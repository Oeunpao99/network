import json
import logging

from fastapi import HTTPException
from openai import APIError, AzureOpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.models import Circuit, Customer, CustomerSite, InfrastructureAsset, Invoice, Pop, ServiceContract
from app.schemas import ChatRequest

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Fiberline AI Assistant for a fiber telecom CRM.
Help support and account teams summarize customer accounts, draft retention offers,
and explain network or installation issues in plain language. Be concise, practical,
and specific to ISP operations. Keep responses under 120 words unless the user asks
for a draft email or longer explanation. Use only the supplied account and database
context. The database reference is authoritative. Calculate available POP ports as
total ports minus used ports when requested.
When reviewing tickets, cite their IDs and recommend a practical next action. When
reviewing payments, cite invoice IDs, status, and due dates. If information is not
in the context, state that it is unavailable rather than inventing it."""


def build_database_context(session: Session) -> dict:
    pops = session.scalars(select(Pop).order_by(Pop.name)).all()
    sites = session.scalars(select(CustomerSite).order_by(CustomerSite.name)).all()
    customers = session.scalars(
        select(Customer).options(
            selectinload(Customer.site),
            selectinload(Customer.pop),
            selectinload(Customer.tickets),
        ).order_by(Customer.name)
    ).all()
    invoices = session.scalars(select(Invoice).order_by(Invoice.issued.desc(), Invoice.id)).all()
    assets = session.scalars(select(InfrastructureAsset).order_by(InfrastructureAsset.asset_type, InfrastructureAsset.name)).all()
    contracts = session.scalars(select(ServiceContract).order_by(ServiceContract.contract_number)).all()
    circuits = session.scalars(
        select(Circuit).options(
            selectinload(Circuit.contract),
            selectinload(Circuit.asset),
            selectinload(Circuit.pop),
        ).order_by(Circuit.circuit_id)
    ).all()
    return {
        "pops": [
            {
                "code": pop.code,
                "name": pop.name,
                "latitude": pop.latitude,
                "longitude": pop.longitude,
                "ports_total": pop.ports_total,
                "ports_used": pop.ports_used,
                "ports_available": pop.ports_total - pop.ports_used,
                "switch_id": pop.switch_id,
            }
            for pop in pops
        ],
        "customer_sites": [
            {
                "code": site.code,
                "name": site.name,
                "latitude": site.latitude,
                "longitude": site.longitude,
            }
            for site in sites
        ],
        "customers": [
            {
                "id": customer.id,
                "name": customer.name,
                "site": customer.site.name,
                "pop": customer.pop.name,
                "plan": customer.plan,
                "status": customer.status,
                "risk": customer.risk,
                "monthly_value": float(customer.monthly_value),
                "tenure": customer.tenure,
                "port": customer.port,
                "reasons": customer.reasons,
                "tickets": [
                    {"id": ticket.id, "text": ticket.text, "opened_on": ticket.opened_on.isoformat()}
                    for ticket in customer.tickets
                ],
            }
            for customer in customers
        ],
        "invoices": [
            {
                "id": invoice.id,
                "customer_id": invoice.customer_id,
                "amount": float(invoice.amount),
                "status": invoice.status,
                "issued": invoice.issued.isoformat(),
                "due": invoice.due.isoformat(),
                "paid": invoice.paid.isoformat() if invoice.paid else None,
            }
            for invoice in invoices
        ],
        "infrastructure_assets": [
            {
                "code": asset.code,
                "name": asset.name,
                "type": asset.asset_type,
                "location": asset.location_name,
                "capacity_total": asset.capacity_total,
                "capacity_used": asset.capacity_used,
                "capacity_available": asset.capacity_total - asset.capacity_used,
                "capacity_unit": asset.capacity_unit,
                "status": asset.status,
            }
            for asset in assets
        ],
        "contracts": [
            {
                "number": contract.contract_number,
                "account": contract.account_name,
                "segment": contract.account_segment,
                "product": contract.product,
                "status": contract.status,
                "start_date": contract.start_date.isoformat(),
                "end_date": contract.end_date.isoformat(),
                "monthly_value": float(contract.monthly_value),
                "sla_availability": float(contract.sla_availability),
                "sla_mttr_hours": contract.sla_mttr_hours,
            }
            for contract in contracts
        ],
        "circuits": [
            {
                "id": circuit.circuit_id,
                "contract": circuit.contract.contract_number,
                "asset": circuit.asset.code if circuit.asset else None,
                "pop": circuit.pop.code if circuit.pop else None,
                "endpoint_a": circuit.endpoint_a,
                "endpoint_b": circuit.endpoint_b,
                "bandwidth": circuit.bandwidth,
                "provisioning_stage": circuit.provisioning_stage,
                "status": circuit.status,
            }
            for circuit in circuits
        ],
    }


def create_chat_reply(request: ChatRequest, session: Session) -> str:
    settings = get_settings()
    if settings.ai_provider.lower() != "azure":
        raise HTTPException(status_code=503, detail="Only the Azure AI provider is configured.")
    if not all(
        [
            settings.azure_openai_api_key,
            settings.azure_openai_endpoint,
            settings.azure_openai_deployment,
        ]
    ):
        raise HTTPException(status_code=503, detail="Azure OpenAI is not configured.")

    context = f"\n\nDatabase reference:\n{json.dumps(build_database_context(session))}"
    if request.customer_context:
        details = "\n".join(
            f"- {key.replace('_', ' ').title()}: {json.dumps(value) if isinstance(value, (list, dict)) else value}"
            for key, value in request.customer_context.items()
            if value not in (None, "", [], {})
        )
        context += f"\n\nCurrently viewed customer:\n{details}"

    messages = [{"role": "system", "content": SYSTEM_PROMPT + context}]
    messages.extend(message.model_dump() for message in request.history)
    messages.append({"role": "user", "content": request.message})

    try:
        client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )
        response = client.chat.completions.create(
            model=settings.azure_openai_deployment,
            messages=messages,
            max_tokens=600,
            temperature=0.2,
        )
    except APIError as error:
        logger.exception("Azure OpenAI request failed")
        raise HTTPException(status_code=502, detail="Azure OpenAI could not complete the request.") from error

    reply = response.choices[0].message.content
    if not reply:
        raise HTTPException(status_code=502, detail="Azure OpenAI returned an empty response.")
    return reply.strip()
