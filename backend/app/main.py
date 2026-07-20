import json
import math
import re
from collections.abc import Generator
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.ai import create_chat_reply
from app.config import PROJECT_ROOT, get_settings
from app.db import SessionLocal
from app.models import Activity, Circuit, Customer, CustomerSite, InfrastructureAsset, Invoice, Pop, ProductOffering, Quote, ServiceContract, Ticket
from app.schemas import (
    ActivityRead,
    ChatRequest,
    ChatResponse,
    CircuitCreate,
    CircuitRead,
    ContractCreate,
    ContractRead,
    CustomerCreate,
    CustomerRead,
    CustomerSiteCreate,
    CustomerSiteRead,
    DashboardSummary,
    InfrastructureAssetCreate,
    InfrastructureAssetRead,
    InvoiceRead,
    PopCreate,
    PopRead,
    ProductOfferingCreate,
    ProductOfferingRead,
    QuoteCreate,
    QuoteRead,
    RouteFeasibilityRequest,
    RouteFeasibilityResponse,
    TicketCreate,
    TicketRead,
)

GIS_DIR = PROJECT_ROOT / "public" / "gis"
GIS_FILENAMES = {
    "fiber-routes": "fiber-routes.geojson",
    "coverage-zones": "coverage-zones.geojson",
}

settings = get_settings()
app = FastAPI(title="Fiberline CRM API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def next_code(session: Session, model: type, prefix: str) -> str:
    count = session.scalar(select(func.count()).select_from(model)) or 0
    existing_codes = set(session.scalars(select(model.code)).all())
    sequence = count + 1
    while f"{prefix}-{sequence:02d}" in existing_codes:
        sequence += 1
    return f"{prefix}-{sequence:02d}"


def next_ticket_id(session: Session) -> str:
    numbers = [int(ticket_id[4:]) for ticket_id in session.scalars(select(Ticket.id)).all() if ticket_id.startswith("TCK-") and ticket_id[4:].isdigit()]
    return f"TCK-{max(numbers, default=0) + 1:04d}"


def distance_km(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
    latitude_delta = math.radians(latitude_b - latitude_a)
    longitude_delta = math.radians(longitude_b - longitude_a)
    latitude_a_rad = math.radians(latitude_a)
    latitude_b_rad = math.radians(latitude_b)
    value = math.sin(latitude_delta / 2) ** 2 + math.cos(latitude_a_rad) * math.cos(latitude_b_rad) * math.sin(longitude_delta / 2) ** 2
    return 6371 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def point_to_segment_distance_km(latitude: float, longitude: float, start: list[float], end: list[float]) -> float:
    latitude_scale = 110.574
    longitude_scale = 111.320 * math.cos(math.radians(latitude))
    start_x, start_y = (start[0] - longitude) * longitude_scale, (start[1] - latitude) * latitude_scale
    end_x, end_y = (end[0] - longitude) * longitude_scale, (end[1] - latitude) * latitude_scale
    segment_x, segment_y = end_x - start_x, end_y - start_y
    segment_length = segment_x**2 + segment_y**2
    if segment_length == 0:
        return math.hypot(start_x, start_y)
    ratio = max(0, min(1, -(start_x * segment_x + start_y * segment_y) / segment_length))
    return math.hypot(start_x + ratio * segment_x, start_y + ratio * segment_y)


def contains_point(coordinates: list, latitude: float, longitude: float) -> bool:
    inside = False
    for index, point in enumerate(coordinates):
        previous = coordinates[index - 1]
        if (point[1] > latitude) != (previous[1] > latitude) and longitude < (previous[0] - point[0]) * (latitude - point[1]) / (previous[1] - point[1]) + point[0]:
            inside = not inside
    return inside


def coverage_feature(features: list[dict], latitude: float, longitude: float) -> dict | None:
    for feature in features:
        geometry = feature.get("geometry") or {}
        if geometry.get("type") == "Polygon":
            rings = geometry.get("coordinates", [])
            if rings and contains_point(rings[0], latitude, longitude) and not any(contains_point(ring, latitude, longitude) for ring in rings[1:]):
                return feature
        if geometry.get("type") == "MultiPolygon":
            for polygon in geometry.get("coordinates", []):
                if polygon and contains_point(polygon[0], latitude, longitude) and not any(contains_point(ring, latitude, longitude) for ring in polygon[1:]):
                    return feature
    return None


def nearest_route_feature(features: list[dict], latitude: float, longitude: float) -> tuple[dict | None, float | None]:
    closest_feature = None
    closest_distance = None
    for feature in features:
        geometry = feature.get("geometry") or {}
        line_sets = [geometry.get("coordinates", [])] if geometry.get("type") == "LineString" else geometry.get("coordinates", []) if geometry.get("type") == "MultiLineString" else []
        for line in line_sets:
            for start, end in zip(line, line[1:]):
                if len(start) < 2 or len(end) < 2:
                    continue
                distance = point_to_segment_distance_km(latitude, longitude, start, end)
                if closest_distance is None or distance < closest_distance:
                    closest_feature, closest_distance = feature, distance
    return closest_feature, closest_distance


def requested_capacity_gbps(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(g|m)bps", value, re.IGNORECASE)
    if match is None:
        return None
    capacity = float(match.group(1))
    return capacity if match.group(2).lower() == "g" else capacity / 1000


def load_gis_features(*filenames: str) -> list[dict]:
    all_features = []
    for filename in filenames:
        try:
            payload = json.loads((GIS_DIR / filename).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise HTTPException(status_code=503, detail=f"GIS layer {filename} is unavailable.") from error
        features = payload.get("features")
        if payload.get("type") != "FeatureCollection" or not isinstance(features, list):
            raise HTTPException(status_code=503, detail=f"GIS layer {filename} is invalid.")
        all_features.extend(features)
    return all_features


def commit_and_refresh(session: Session, record):
    try:
        session.add(record)
        session.commit()
        session.refresh(record)
    except IntegrityError as error:
        session.rollback()
        constraint_name = getattr(getattr(error.orig, "diag", None), "constraint_name", "")
        messages = {
            "pops_switch_id_key": "A POP already uses this switch ID. Enter a different switch ID.",
            "pops_code_key": "A POP already uses this generated code. Please retry.",
            "customer_sites_code_key": "A customer site already uses this generated code. Please retry.",
            "infrastructure_assets_code_key": "An asset already uses this generated code. Please retry.",
            "product_offerings_code_key": "A product already uses this generated code. Please retry.",
            "quotes_quote_number_key": "A quote already uses this generated number. Please retry.",
            "service_contracts_contract_number_key": "A contract already uses this generated number. Please retry.",
            "circuits_circuit_id_key": "A circuit already uses this generated ID. Please retry.",
        }
        raise HTTPException(status_code=409, detail=messages.get(constraint_name, "A record with one of these unique values already exists.")) from error
    return record


@app.get("/health")
def health_check(session: Session = Depends(get_session)) -> dict[str, str]:
    session.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(session: Session = Depends(get_session)):
    return DashboardSummary(
        active_subscribers=session.scalar(select(func.count()).where(Customer.status == "Active")) or 0,
        tickets_recorded=session.scalar(select(func.count()).select_from(Ticket)) or 0,
        churn_alerts=session.scalar(select(func.count()).where(Customer.risk != "Low")) or 0,
    )


@app.get("/api/pops", response_model=list[PopRead])
def list_pops(session: Session = Depends(get_session)):
    return session.scalars(select(Pop).order_by(Pop.name)).all()


@app.post("/api/pops", response_model=PopRead, status_code=status.HTTP_201_CREATED)
def create_pop(payload: PopCreate, session: Session = Depends(get_session)):
    if payload.ports_used > payload.ports_total:
        raise HTTPException(status_code=422, detail="Used ports cannot exceed total ports.")
    record = Pop(
        code=payload.code or next_code(session, Pop, "POP"),
        name=payload.name.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        ports_total=payload.ports_total,
        ports_used=payload.ports_used,
        switch_id=payload.switch_id.strip(),
    )
    return commit_and_refresh(session, record)


@app.get("/api/assets", response_model=list[InfrastructureAssetRead])
def list_assets(session: Session = Depends(get_session)):
    return session.scalars(select(InfrastructureAsset).order_by(InfrastructureAsset.asset_type, InfrastructureAsset.name)).all()


@app.post("/api/assets", response_model=InfrastructureAssetRead, status_code=status.HTTP_201_CREATED)
def create_asset(payload: InfrastructureAssetCreate, session: Session = Depends(get_session)):
    if payload.capacity_used > payload.capacity_total:
        raise HTTPException(status_code=422, detail="Used capacity cannot exceed total capacity.")
    record = InfrastructureAsset(
        code=payload.code or next_code(session, InfrastructureAsset, "AST"),
        name=payload.name.strip(),
        asset_type=payload.asset_type,
        location_name=payload.location_name.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        capacity_total=payload.capacity_total,
        capacity_used=payload.capacity_used,
        capacity_unit=payload.capacity_unit.strip(),
        status=payload.status,
    )
    return commit_and_refresh(session, record)


@app.get("/api/catalog/products", response_model=list[ProductOfferingRead])
def list_product_offerings(session: Session = Depends(get_session)):
    return session.scalars(select(ProductOffering).order_by(ProductOffering.segment, ProductOffering.name)).all()


@app.post("/api/catalog/products", response_model=ProductOfferingRead, status_code=status.HTTP_201_CREATED)
def create_product_offering(payload: ProductOfferingCreate, session: Session = Depends(get_session)):
    if payload.pricing_model == "Fixed" and payload.base_monthly_price is None:
        raise HTTPException(status_code=422, detail="Fixed-price offerings require a base monthly price.")
    record = ProductOffering(
        code=payload.code or next_code(session, ProductOffering, "PRD"),
        name=payload.name.strip(),
        segment=payload.segment,
        commercial_model=payload.commercial_model,
        pricing_model=payload.pricing_model,
        base_monthly_price=payload.base_monthly_price,
        is_orderable=payload.is_orderable,
    )
    return commit_and_refresh(session, record)


@app.get("/api/quotes", response_model=list[QuoteRead])
def list_quotes(session: Session = Depends(get_session)):
    statement = select(Quote).options(
        selectinload(Quote.account),
        selectinload(Quote.product),
    ).order_by(Quote.created_at.desc(), Quote.quote_number)
    return session.scalars(statement).all()


@app.post("/api/quotes", response_model=QuoteRead, status_code=status.HTTP_201_CREATED)
def create_quote(payload: QuoteCreate, session: Session = Depends(get_session)):
    if session.get(Customer, payload.account_id) is None:
        raise HTTPException(status_code=404, detail="Account was not found.")
    product = session.get(ProductOffering, payload.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product offering was not found.")
    if not product.is_orderable:
        raise HTTPException(status_code=422, detail="This product offering is not currently orderable.")
    if product.pricing_model == "Fixed":
        if product.base_monthly_price is None:
            raise HTTPException(status_code=422, detail="The fixed-price product has no configured price.")
        monthly_value = product.base_monthly_price
        feasibility_status = "Not required"
    else:
        if payload.monthly_value is None:
            raise HTTPException(status_code=422, detail="Custom quotes require a monthly price after feasibility assessment.")
        if payload.feasibility_status == "Not required":
            raise HTTPException(status_code=422, detail="Custom quotes require a feasibility status.")
        monthly_value = payload.monthly_value
        feasibility_status = payload.feasibility_status
    record = Quote(
        quote_number=payload.quote_number or next_code(session, Quote, "QTE"),
        account_id=payload.account_id,
        product_id=payload.product_id,
        status=payload.status,
        feasibility_status=feasibility_status,
        requested_capacity=payload.requested_capacity.strip() if payload.requested_capacity else None,
        route_distance_km=payload.route_distance_km,
        term_months=payload.term_months,
        monthly_value=monthly_value,
        notes=payload.notes.strip() if payload.notes else None,
    )
    return commit_and_refresh(session, record)


@app.get("/api/contracts", response_model=list[ContractRead])
def list_contracts(session: Session = Depends(get_session)):
    return session.scalars(select(ServiceContract).order_by(ServiceContract.end_date, ServiceContract.account_name)).all()


@app.post("/api/contracts", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(payload: ContractCreate, session: Session = Depends(get_session)):
    if payload.end_date <= payload.start_date:
        raise HTTPException(status_code=422, detail="Contract end date must be after the start date.")
    record = ServiceContract(
        contract_number=payload.contract_number or next_code(session, ServiceContract, "CON"),
        account_name=payload.account_name.strip(),
        account_segment=payload.account_segment,
        product=payload.product,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
        monthly_value=payload.monthly_value,
        sla_availability=payload.sla_availability,
        sla_mttr_hours=payload.sla_mttr_hours,
        msa_number=payload.msa_number.strip() if payload.msa_number else None,
        service_schedule_number=payload.service_schedule_number.strip() if payload.service_schedule_number else None,
        route_diversity=payload.route_diversity,
        service_credit_rate=payload.service_credit_rate,
    )
    return commit_and_refresh(session, record)


@app.get("/api/circuits", response_model=list[CircuitRead])
def list_circuits(session: Session = Depends(get_session)):
    statement = select(Circuit).options(
        selectinload(Circuit.contract),
        selectinload(Circuit.asset),
        selectinload(Circuit.pop),
    ).order_by(Circuit.circuit_id)
    return session.scalars(statement).all()


@app.post("/api/circuits", response_model=CircuitRead, status_code=status.HTTP_201_CREATED)
def create_circuit(payload: CircuitCreate, session: Session = Depends(get_session)):
    if session.get(ServiceContract, payload.contract_id) is None:
        raise HTTPException(status_code=404, detail="Contract was not found.")
    if payload.asset_id is not None and session.get(InfrastructureAsset, payload.asset_id) is None:
        raise HTTPException(status_code=404, detail="Infrastructure asset was not found.")
    if payload.pop_id is not None and session.get(Pop, payload.pop_id) is None:
        raise HTTPException(status_code=404, detail="POP was not found.")
    record = Circuit(
        circuit_id=payload.circuit_id or next_code(session, Circuit, "CIR"),
        contract_id=payload.contract_id,
        asset_id=payload.asset_id,
        pop_id=payload.pop_id,
        endpoint_a=payload.endpoint_a.strip(),
        endpoint_b=payload.endpoint_b.strip(),
        bandwidth=payload.bandwidth.strip(),
        provisioning_stage=payload.provisioning_stage,
        status=payload.status,
    )
    return commit_and_refresh(session, record)


@app.get("/api/customer-sites", response_model=list[CustomerSiteRead])
def list_customer_sites(session: Session = Depends(get_session)):
    return session.scalars(select(CustomerSite).order_by(CustomerSite.name)).all()


@app.post("/api/customer-sites", response_model=CustomerSiteRead, status_code=status.HTTP_201_CREATED)
def create_customer_site(payload: CustomerSiteCreate, session: Session = Depends(get_session)):
    record = CustomerSite(
        code=payload.code or next_code(session, CustomerSite, "SITE"),
        name=payload.name.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    return commit_and_refresh(session, record)


@app.post("/api/route-feasibility", response_model=RouteFeasibilityResponse)
def check_route_feasibility(payload: RouteFeasibilityRequest, session: Session = Depends(get_session)):
    site = session.get(CustomerSite, payload.customer_site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="Customer site was not found.")

    coverage = coverage_feature(load_gis_features("coverage-zones.geojson", "kampot-coverage-zones.geojson"), site.latitude, site.longitude)
    route, route_distance = nearest_route_feature(load_gis_features("fiber-routes.geojson", "kampot-fiber-routes.geojson"), site.latitude, site.longitude)
    nearest_pop = min(session.scalars(select(Pop)).all(), key=lambda pop: distance_km(site.latitude, site.longitude, pop.latitude, pop.longitude), default=None)
    pop_distance = distance_km(site.latitude, site.longitude, nearest_pop.latitude, nearest_pop.longitude) if nearest_pop else None
    available_ports = nearest_pop.ports_total - nearest_pop.ports_used if nearest_pop else None
    coverage_properties = coverage.get("properties", {}) if coverage else {}
    route_properties = route.get("properties", {}) if route else {}
    coverage_serviceable = str(coverage_properties.get("serviceability", "")).lower() == "serviceable"
    route_status = str(route_properties.get("status", "")).lower()
    route_is_candidate = "candidate" in route_status
    try:
        route_capacity = float(route_properties["capacity_available_gbps"])
    except (KeyError, TypeError, ValueError):
        route_capacity = None
    requested_capacity = requested_capacity_gbps(payload.requested_capacity)

    if nearest_pop is None or available_ports is None or available_ports < 1:
        decision, reason = "Build required", "No POP port capacity is currently available for this site."
    elif route is None or route_distance is None or route_distance > 1.5:
        decision, reason = "Build required", "No suitable fiber route is available within 1.5 km of the customer site."
    elif requested_capacity is not None and (route_capacity is None or route_capacity < requested_capacity):
        decision, reason = "Build required", "The nearest fiber route does not have the requested available capacity."
    elif not coverage_serviceable:
        decision, reason = "Survey required", "The site is outside a confirmed serviceable coverage zone."
    elif route_is_candidate:
        decision, reason = "Survey required", "The nearest GIS route is a candidate corridor and needs field-survey confirmation."
    else:
        decision, reason = "Serviceable", "Coverage, route capacity, and POP port capacity meet the preliminary feasibility criteria."

    return RouteFeasibilityResponse(
        decision=decision,
        reason=reason,
        customer_site_name=site.name,
        requested_capacity=payload.requested_capacity,
        coverage_zone_name=coverage_properties.get("name"),
        coverage_serviceable=coverage_serviceable,
        nearest_pop_name=nearest_pop.name if nearest_pop else None,
        nearest_pop_distance_km=round(pop_distance, 2) if pop_distance is not None else None,
        available_pop_ports=available_ports,
        nearest_route_id=route_properties.get("id"),
        nearest_route_name=route_properties.get("name"),
        nearest_route_distance_km=round(route_distance, 2) if route_distance is not None else None,
        route_available_capacity_gbps=route_capacity,
        route_is_candidate=route_is_candidate,
    )


@app.get("/api/customers", response_model=list[CustomerRead])
def list_customers(session: Session = Depends(get_session)):
    statement = select(Customer).options(
        selectinload(Customer.site),
        selectinload(Customer.pop),
        selectinload(Customer.tickets),
    ).order_by(Customer.name)
    return session.scalars(statement).all()


@app.post("/api/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, session: Session = Depends(get_session)):
    if session.get(CustomerSite, payload.site_id) is None:
        raise HTTPException(status_code=404, detail="Customer site was not found.")
    if session.get(Pop, payload.pop_id) is None:
        raise HTTPException(status_code=404, detail="POP was not found.")
    record = Customer(**payload.model_dump())
    return commit_and_refresh(session, record)


@app.post("/api/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, session: Session = Depends(get_session)):
    if session.get(Customer, payload.customer_id) is None:
        raise HTTPException(status_code=404, detail="Customer was not found.")
    if payload.contract_id is not None and session.get(ServiceContract, payload.contract_id) is None:
        raise HTTPException(status_code=404, detail="Contract was not found.")
    if payload.circuit_id is not None and session.get(Circuit, payload.circuit_id) is None:
        raise HTTPException(status_code=404, detail="Circuit was not found.")
    record = Ticket(
        id=next_ticket_id(session),
        customer_id=payload.customer_id,
        text=payload.text.strip(),
        ticket_class=payload.ticket_class,
        priority=payload.priority,
        contract_id=payload.contract_id,
        circuit_id=payload.circuit_id,
        sla_due_at=payload.sla_due_at,
    )
    return commit_and_refresh(session, record)


@app.get("/api/invoices", response_model=list[InvoiceRead])
def list_invoices(session: Session = Depends(get_session)):
    return session.scalars(select(Invoice).order_by(Invoice.issued.desc(), Invoice.id)).all()


@app.get("/api/activity", response_model=list[ActivityRead])
def list_activity(session: Session = Depends(get_session)):
    activities = session.scalars(select(Activity).order_by(Activity.id)).all()
    return [{"id": activity.id, "time": activity.time_label, "html": activity.html} for activity in activities]


@app.post("/api/ai/chat", response_model=ChatResponse)
def chat_with_ai(payload: ChatRequest, session: Session = Depends(get_session)) -> ChatResponse:
    return ChatResponse(reply=create_chat_reply(payload, session))


@app.put("/api/gis/{layer}")
def save_gis_layer(layer: str, payload: dict[str, Any]) -> dict[str, str]:
    filename = GIS_FILENAMES.get(layer)
    if filename is None:
        raise HTTPException(status_code=404, detail="Unknown GIS layer.")
    if payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
        raise HTTPException(status_code=422, detail="GIS layer must be a GeoJSON FeatureCollection.")
    GIS_DIR.mkdir(parents=True, exist_ok=True)
    (GIS_DIR / filename).write_text(json.dumps(payload), encoding="utf-8")
    return {"status": "saved", "layer": layer}
