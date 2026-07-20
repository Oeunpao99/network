from datetime import date

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Activity, Circuit, Customer, CustomerSite, InfrastructureAsset, Invoice, Pop, ProductOffering, Quote, ServiceContract, Ticket

POPS = [
    {"code": "POP-WPH", "name": "Wat Phnom Exchange", "latitude": 11.5925, "longitude": 104.9282, "ports_total": 96, "ports_used": 71, "switch_id": "SW-CORE-01"},
    {"code": "POP-CCV", "name": "Chroy Changvar POP", "latitude": 11.5975, "longitude": 104.9420, "ports_total": 48, "ports_used": 22, "switch_id": "SW-EDGE-04"},
    {"code": "POP-TLK", "name": "Toul Kork Exchange", "latitude": 11.5794, "longitude": 104.8925, "ports_total": 96, "ports_used": 88, "switch_id": "SW-CORE-02"},
    {"code": "POP-BKK", "name": "BKK1 POP", "latitude": 11.5537, "longitude": 104.9282, "ports_total": 64, "ports_used": 40, "switch_id": "SW-EDGE-07"},
]

SITES = [
    {"code": "SITE-01", "name": "Aeon Mall Sen Sok", "latitude": 11.5730, "longitude": 104.8890},
    {"code": "SITE-02", "name": "Attwood Business Center", "latitude": 11.5580, "longitude": 104.9270},
    {"code": "SITE-03", "name": "Diamond Island Convention Ctr", "latitude": 11.5560, "longitude": 104.9330},
    {"code": "SITE-04", "name": "Olympia City Complex", "latitude": 11.5670, "longitude": 104.9130},
    {"code": "SITE-05", "name": "Chip Mong Tower 88", "latitude": 11.5620, "longitude": 104.9200},
    {"code": "SITE-06", "name": "Chroy Changvar Riverside Hotel", "latitude": 11.6000, "longitude": 104.9450},
    {"code": "SITE-07", "name": "Central Market Business Hub", "latitude": 11.5680, "longitude": 104.9210},
    {"code": "SITE-08", "name": "Koh Pich Tower", "latitude": 11.5540, "longitude": 104.9300},
]

CUSTOMERS = [
    {"name": "Aeon Mall Sen Sok Co., Ltd", "site": "SITE-01", "pop": "POP-TLK", "plan": "Enterprise Dedicated 10G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 2400, "tenure": "3.2 yrs", "port": "GE0/1/14", "reasons": []},
    {"name": "Attwood Business Center", "site": "SITE-02", "pop": "POP-BKK", "plan": "Fiber Pro 1G", "account_type": "SME", "verification_status": "KYB Verified", "status": "At Risk", "risk": "High", "monthly_value": 680, "tenure": "1.1 yrs", "port": "GE0/2/03", "reasons": ["3 failed payments", "2 open tickets", "Avg latency +40%"]},
    {"name": "Diamond Island Convention Ctr", "site": "SITE-03", "pop": "POP-BKK", "plan": "Enterprise Dedicated 10G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 3100, "tenure": "4.0 yrs", "port": "GE0/2/11", "reasons": []},
    {"name": "Olympia City Complex", "site": "SITE-04", "pop": "POP-TLK", "plan": "Fiber Business 500", "account_type": "SME", "verification_status": "Pending", "status": "Onboarding", "risk": "Medium", "monthly_value": 420, "tenure": "0.2 yrs", "port": "GE0/1/29", "reasons": ["Install delayed 6 days", "Port capacity at 92% on exchange"]},
    {"name": "Chip Mong Tower 88", "site": "SITE-05", "pop": "POP-BKK", "plan": "Fiber Pro 1G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 680, "tenure": "2.4 yrs", "port": "GE0/2/18", "reasons": []},
    {"name": "Chroy Changvar Riverside Hotel", "site": "SITE-06", "pop": "POP-CCV", "plan": "Fiber Business 500", "account_type": "SME", "verification_status": "KYB Verified", "status": "At Risk", "risk": "High", "monthly_value": 420, "tenure": "0.9 yrs", "port": "GE0/4/02", "reasons": ["4 outage tickets in 30 days", "NPS score dropped to 3"]},
    {"name": "Central Market Business Hub", "site": "SITE-07", "pop": "POP-WPH", "plan": "Fiber Essential 100", "account_type": "SME", "verification_status": "KYB Verified", "status": "Active", "risk": "Medium", "monthly_value": 180, "tenure": "1.6 yrs", "port": "GE0/0/33", "reasons": ["Usage near plan cap"]},
    {"name": "Koh Pich Tower", "site": "SITE-08", "pop": "POP-BKK", "plan": "Enterprise Dedicated 10G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 2950, "tenure": "3.7 yrs", "port": "GE0/2/25", "reasons": []},
    {"name": "Fiberline SME - Riverside Traders", "site": "SITE-07", "pop": "POP-WPH", "plan": "Fiber Essential 100", "account_type": "SME", "verification_status": "KYB Verified", "status": "Suspended", "risk": "High", "monthly_value": 0, "tenure": "0.8 yrs", "port": "GE0/0/41", "reasons": ["Suspended - non-payment 45 days"]},
    {"name": "Sen Sok Medical Plaza", "site": "SITE-01", "pop": "POP-TLK", "plan": "Fiber Business 500", "account_type": "SME", "verification_status": "KYB Verified", "status": "Active", "risk": "Medium", "monthly_value": 420, "tenure": "1.3 yrs", "port": "GE0/1/07", "reasons": ["Exchange nearing port capacity"]},
]

TICKETS = [
    {"id": "TCK-2291", "customer": "Aeon Mall Sen Sok Co., Ltd", "text": "Scheduled maintenance window confirmed", "opened_on": "2024-07-12"},
    {"id": "TCK-2287", "customer": "Attwood Business Center", "text": "Repeated packet loss reported", "opened_on": "2024-07-10"},
    {"id": "TCK-2270", "customer": "Attwood Business Center", "text": "Billing dispute - overcharge claim", "opened_on": "2024-07-03"},
    {"id": "TCK-2299", "customer": "Olympia City Complex", "text": "Install crew rescheduled", "opened_on": "2024-07-14"},
    {"id": "TCK-2280", "customer": "Chroy Changvar Riverside Hotel", "text": "Fiber cut - riverside construction", "opened_on": "2024-07-08"},
    {"id": "TCK-2265", "customer": "Chroy Changvar Riverside Hotel", "text": "Second outage this month", "opened_on": "2024-07-01"},
    {"id": "TCK-2201", "customer": "Fiberline SME - Riverside Traders", "text": "Service suspended per policy", "opened_on": "2024-06-29"},
]

INVOICES = [
    {"id": "INV-2024-001", "customer": "Aeon Mall Sen Sok Co., Ltd", "amount": 2400, "status": "paid", "issued": "2024-07-01", "due": "2024-07-15", "paid": "2024-07-12"},
    {"id": "INV-2024-002", "customer": "Attwood Business Center", "amount": 680, "status": "overdue", "issued": "2024-06-01", "due": "2024-06-15", "paid": None},
    {"id": "INV-2024-003", "customer": "Diamond Island Convention Ctr", "amount": 3100, "status": "paid", "issued": "2024-07-01", "due": "2024-07-15", "paid": "2024-07-10"},
    {"id": "INV-2024-004", "customer": "Olympia City Complex", "amount": 420, "status": "pending", "issued": "2024-07-01", "due": "2024-07-22", "paid": None},
    {"id": "INV-2024-005", "customer": "Chip Mong Tower 88", "amount": 680, "status": "paid", "issued": "2024-06-01", "due": "2024-06-15", "paid": "2024-06-14"},
    {"id": "INV-2024-006", "customer": "Chroy Changvar Riverside Hotel", "amount": 420, "status": "overdue", "issued": "2024-05-01", "due": "2024-05-15", "paid": None},
    {"id": "INV-2024-007", "customer": "Central Market Business Hub", "amount": 180, "status": "paid", "issued": "2024-07-01", "due": "2024-07-15", "paid": "2024-07-14"},
    {"id": "INV-2024-008", "customer": "Koh Pich Tower", "amount": 2950, "status": "pending", "issued": "2024-07-01", "due": "2024-07-20", "paid": None},
    {"id": "INV-2024-009", "customer": "Fiberline SME - Riverside Traders", "amount": 180, "status": "overdue", "issued": "2024-04-01", "due": "2024-04-15", "paid": None},
    {"id": "INV-2024-010", "customer": "Sen Sok Medical Plaza", "amount": 420, "status": "paid", "issued": "2024-06-01", "due": "2024-06-15", "paid": "2024-06-13"},
    {"id": "INV-2024-011", "customer": "Attwood Business Center", "amount": 680, "status": "pending", "issued": "2024-07-01", "due": "2024-07-15", "paid": None},
    {"id": "INV-2024-012", "customer": "Chroy Changvar Riverside Hotel", "amount": 420, "status": "pending", "issued": "2024-06-01", "due": "2024-06-15", "paid": None},
]

ACTIVITIES = [
    {"time_label": "09:41", "html": "<b>AI model</b> flagged Attwood Business Center as high churn risk"},
    {"time_label": "09:20", "html": "<b>Sereyvath R.</b> closed ticket TCK-2260 for Koh Pich Tower"},
    {"time_label": "08:55", "html": "Install crew dispatched for <b>Olympia City Complex</b>"},
    {"time_label": "08:12", "html": "<b>Chroy Changvar POP</b> port utilization crossed 45%"},
    {"time_label": "Yesterday", "html": "<b>Diamond Island Convention Ctr</b> upgraded to Enterprise Dedicated 10G"},
]

ASSETS = [
    {"code": "AST-001", "name": "Phnom Penh Metro Fiber Ring", "asset_type": "Fiber Route", "location_name": "Central Phnom Penh", "latitude": 11.5750, "longitude": 104.9180, "capacity_total": 144, "capacity_used": 92, "capacity_unit": "fiber cores", "status": "Active"},
    {"code": "AST-002", "name": "Riverside Cable Duct A", "asset_type": "Cable Duct", "location_name": "Sisowath Quay", "latitude": 11.5700, "longitude": 104.9290, "capacity_total": 48, "capacity_used": 34, "capacity_unit": "duct slots", "status": "Active"},
    {"code": "AST-003", "name": "BKK1 Tower Space", "asset_type": "Tower Space", "location_name": "BKK1", "latitude": 11.5520, "longitude": 104.9260, "capacity_total": 12, "capacity_used": 9, "capacity_unit": "antenna slots", "status": "Active"},
    {"code": "AST-004", "name": "Toul Kork Equipment Site", "asset_type": "Equipment Site", "location_name": "Toul Kork", "latitude": 11.5800, "longitude": 104.8910, "capacity_total": 40, "capacity_used": 31, "capacity_unit": "rack units", "status": "Active"},
]

CONTRACTS = [
    {"contract_number": "CON-001", "account_name": "Cambodian Health Ministry", "account_segment": "Enterprise", "product": "IPLC", "status": "Active", "start_date": "2024-01-01", "end_date": "2027-12-31", "monthly_value": 3500, "sla_availability": 99.95, "sla_mttr_hours": 4, "msa_number": "MSA-GOV-2024-01", "service_schedule_number": "SS-001", "route_diversity": "Dual route", "service_credit_rate": 10},
    {"contract_number": "CON-002", "account_name": "AngkorNet Carrier", "account_segment": "Carrier", "product": "IP Transit", "status": "Active", "start_date": "2024-04-01", "end_date": "2026-03-31", "monthly_value": 6200, "sla_availability": 99.90, "sla_mttr_hours": 4, "msa_number": "MSA-CAR-2024-07", "service_schedule_number": "SS-014", "route_diversity": "Standard", "service_credit_rate": 5},
    {"contract_number": "CON-003", "account_name": "Mekong Logistics", "account_segment": "Enterprise", "product": "DPLC", "status": "Feasibility", "start_date": "2025-01-01", "end_date": "2027-12-31", "monthly_value": 1800, "sla_availability": 99.90, "sla_mttr_hours": 8, "msa_number": "MSA-MEK-2025-01", "service_schedule_number": "SS-002", "route_diversity": "Pending survey", "service_credit_rate": 5},
]

PRODUCTS = [
    {"code": "PRD-HOME-100", "name": "TC-Home Fiber 100", "segment": "Residential", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 25},
    {"code": "PRD-BIZ-500", "name": "TC-Biz Fiber 500", "segment": "SME", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 120},
    {"code": "PRD-SIP-TRUNK", "name": "SIP Trunk", "segment": "SME", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 85},
    {"code": "PRD-VPBX", "name": "VPBX", "segment": "Enterprise", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 250},
    {"code": "PRD-IPLC", "name": "IPLC", "segment": "Enterprise", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-DPLC", "name": "DPLC", "segment": "Enterprise", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-IP-TRANSIT", "name": "IP Transit", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-FIBER-LEASE", "name": "Fiber Route Lease", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
]

QUOTES = [
    {"quote_number": "QTE-001", "account": "Aeon Mall Sen Sok Co., Ltd", "product": "PRD-VPBX", "status": "Approved", "feasibility_status": "Not required", "requested_capacity": "150 seats", "route_distance_km": None, "term_months": 24, "monthly_value": 250, "notes": "Additional branches included."},
    {"quote_number": "QTE-002", "account": "Diamond Island Convention Ctr", "product": "PRD-DPLC", "status": "Submitted", "feasibility_status": "Approved", "requested_capacity": "1 Gbps", "route_distance_km": 12.4, "term_months": 36, "monthly_value": 2800, "notes": "Dual route required between convention centre and DR site."},
]

CIRCUITS = [
    {"circuit_id": "CIR-PP-SIEM-01", "contract": "CON-001", "asset": "AST-001", "pop": "POP-BKK", "endpoint_a": "Phnom Penh Ministry DC", "endpoint_b": "Siem Reap Provincial Hospital", "bandwidth": "100 Mbps", "provisioning_stage": "Active", "status": "Active"},
    {"circuit_id": "CIR-ANGKOR-01", "contract": "CON-002", "asset": "AST-002", "pop": "POP-WPH", "endpoint_a": "AngkorNet Phnom Penh", "endpoint_b": "TC Core Gateway", "bandwidth": "10 Gbps", "provisioning_stage": "Active", "status": "Active"},
    {"circuit_id": "CIR-MEKONG-01", "contract": "CON-003", "asset": "AST-004", "pop": "POP-TLK", "endpoint_a": "Mekong Logistics HQ", "endpoint_b": "Mekong Warehouse", "bandwidth": "50 Mbps", "provisioning_stage": "Feasibility", "status": "Planned"},
]


def seed() -> None:
    with SessionLocal() as session:
        if session.scalar(select(Pop.id).limit(1)) is None:
            session.add_all([Pop(**pop) for pop in POPS])
            session.add_all([CustomerSite(**site) for site in SITES])
            session.flush()

        if session.scalar(select(Customer.id).limit(1)) is None:
            pop_by_code = {pop.code: pop.id for pop in session.scalars(select(Pop)).all()}
            site_by_code = {site.code: site.id for site in session.scalars(select(CustomerSite)).all()}
            session.add_all(
                Customer(
                    name=customer["name"],
                    site_id=site_by_code[customer["site"]],
                    pop_id=pop_by_code[customer["pop"]],
                    plan=customer["plan"],
                    account_type=customer["account_type"],
                    verification_status=customer["verification_status"],
                    status=customer["status"],
                    risk=customer["risk"],
                    monthly_value=customer["monthly_value"],
                    tenure=customer["tenure"],
                    port=customer["port"],
                    reasons=customer["reasons"],
                )
                for customer in CUSTOMERS
            )
            session.flush()

        customer_by_name = {customer.name: customer.id for customer in session.scalars(select(Customer)).all()}
        if session.scalar(select(Ticket.id).limit(1)) is None:
            session.add_all(
                Ticket(
                    id=ticket["id"],
                    customer_id=customer_by_name[ticket["customer"]],
                    text=ticket["text"],
                    opened_on=date.fromisoformat(ticket["opened_on"]),
                )
                for ticket in TICKETS
            )
        if session.scalar(select(Invoice.id).limit(1)) is None:
            session.add_all(
                Invoice(
                    id=invoice["id"],
                    customer_id=customer_by_name[invoice["customer"]],
                    amount=invoice["amount"],
                    status=invoice["status"],
                    issued=date.fromisoformat(invoice["issued"]),
                    due=date.fromisoformat(invoice["due"]),
                    paid=date.fromisoformat(invoice["paid"]) if invoice["paid"] else None,
                )
                for invoice in INVOICES
            )
        if session.scalar(select(Activity.id).limit(1)) is None:
            session.add_all([Activity(**activity) for activity in ACTIVITIES])
        if session.scalar(select(InfrastructureAsset.id).limit(1)) is None:
            session.add_all([InfrastructureAsset(**asset) for asset in ASSETS])
            session.flush()
        if session.scalar(select(ProductOffering.id).limit(1)) is None:
            session.add_all([ProductOffering(**product) for product in PRODUCTS])
            session.flush()
        if session.scalar(select(ServiceContract.id).limit(1)) is None:
            session.add_all(
                ServiceContract(
                    contract_number=contract["contract_number"],
                    account_name=contract["account_name"],
                    account_segment=contract["account_segment"],
                    product=contract["product"],
                    status=contract["status"],
                    start_date=date.fromisoformat(contract["start_date"]),
                    end_date=date.fromisoformat(contract["end_date"]),
                    monthly_value=contract["monthly_value"],
                    sla_availability=contract["sla_availability"],
                    sla_mttr_hours=contract["sla_mttr_hours"],
                    msa_number=contract["msa_number"],
                    service_schedule_number=contract["service_schedule_number"],
                    route_diversity=contract["route_diversity"],
                    service_credit_rate=contract["service_credit_rate"],
                )
                for contract in CONTRACTS
            )
            session.flush()
        if session.scalar(select(Circuit.id).limit(1)) is None:
            contract_by_number = {contract.contract_number: contract.id for contract in session.scalars(select(ServiceContract)).all()}
            asset_by_code = {asset.code: asset.id for asset in session.scalars(select(InfrastructureAsset)).all()}
            pop_by_code = {pop.code: pop.id for pop in session.scalars(select(Pop)).all()}
            session.add_all(
                Circuit(
                    circuit_id=circuit["circuit_id"],
                    contract_id=contract_by_number[circuit["contract"]],
                    asset_id=asset_by_code[circuit["asset"]],
                    pop_id=pop_by_code[circuit["pop"]],
                    endpoint_a=circuit["endpoint_a"],
                    endpoint_b=circuit["endpoint_b"],
                    bandwidth=circuit["bandwidth"],
                    provisioning_stage=circuit["provisioning_stage"],
                    status=circuit["status"],
                )
                for circuit in CIRCUITS
            )
        if session.scalar(select(Quote.id).limit(1)) is None:
            product_by_code = {product.code: product.id for product in session.scalars(select(ProductOffering)).all()}
            session.add_all(
                Quote(
                    quote_number=quote["quote_number"],
                    account_id=customer_by_name[quote["account"]],
                    product_id=product_by_code[quote["product"]],
                    status=quote["status"],
                    feasibility_status=quote["feasibility_status"],
                    requested_capacity=quote["requested_capacity"],
                    route_distance_km=quote["route_distance_km"],
                    term_months=quote["term_months"],
                    monthly_value=quote["monthly_value"],
                    notes=quote["notes"],
                )
                for quote in QUOTES
            )
        session.commit()


if __name__ == "__main__":
    seed()
