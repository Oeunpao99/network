from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class PopCreate(BaseModel):
    code: str | None = Field(default=None, max_length=32)
    name: str = Field(min_length=1, max_length=160)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    ports_total: int = Field(ge=1)
    ports_used: int = Field(default=0, ge=0)
    switch_id: str = Field(min_length=1, max_length=64)


class PopRead(PopCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CustomerSiteCreate(BaseModel):
    code: str | None = Field(default=None, max_length=32)
    name: str = Field(min_length=1, max_length=160)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class CustomerSiteRead(CustomerSiteCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    site_id: int
    pop_id: int
    plan: str = Field(min_length=1, max_length=100)
    account_type: str = Field(default="SME", min_length=1, max_length=32)
    verification_status: str = Field(default="Pending", min_length=1, max_length=32)
    billing_model: str = Field(default="Recurring", min_length=1, max_length=32)
    status: str = Field(min_length=1, max_length=32)
    risk: str = Field(min_length=1, max_length=32)
    monthly_value: Decimal = Field(ge=0)
    tenure: str = Field(min_length=1, max_length=32)
    port: str = Field(min_length=1, max_length=64)
    reasons: list[str] = Field(default_factory=list)


class TicketRead(BaseModel):
    id: str
    text: str
    opened_on: date
    ticket_class: str
    priority: str
    contract_id: int | None
    circuit_id: int | None
    sla_due_at: datetime | None
    model_config = ConfigDict(from_attributes=True)


class CustomerRead(CustomerCreate):
    id: int
    site: CustomerSiteRead
    pop: PopRead
    tickets: list[TicketRead] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class InvoiceRead(BaseModel):
    id: str
    customer_id: int
    amount: Decimal
    status: str
    issued: date
    due: date
    paid: date | None
    model_config = ConfigDict(from_attributes=True)


class ActivityRead(BaseModel):
    id: int
    time: str
    html: str


class InfrastructureAssetCreate(BaseModel):
    code: str | None = Field(default=None, max_length=32)
    name: str = Field(min_length=1, max_length=160)
    asset_type: str = Field(min_length=1, max_length=64)
    location_name: str = Field(min_length=1, max_length=160)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    capacity_total: int = Field(ge=1)
    capacity_used: int = Field(default=0, ge=0)
    capacity_unit: str = Field(min_length=1, max_length=32)
    status: str = Field(default="Active", min_length=1, max_length=32)


class InfrastructureAssetRead(InfrastructureAssetCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ContractCreate(BaseModel):
    contract_number: str | None = Field(default=None, max_length=32)
    account_name: str = Field(min_length=1, max_length=160)
    account_segment: str = Field(min_length=1, max_length=32)
    product: str = Field(min_length=1, max_length=100)
    status: str = Field(default="Draft", min_length=1, max_length=32)
    start_date: date
    end_date: date
    monthly_value: Decimal = Field(ge=0)
    sla_availability: Decimal = Field(ge=0, le=100)
    sla_mttr_hours: int = Field(ge=1)
    msa_number: str | None = Field(default=None, max_length=64)
    service_schedule_number: str | None = Field(default=None, max_length=64)
    route_diversity: str = Field(default="Standard", min_length=1, max_length=64)
    service_credit_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class ContractRead(ContractCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CircuitCreate(BaseModel):
    circuit_id: str | None = Field(default=None, max_length=32)
    contract_id: int
    asset_id: int | None = None
    pop_id: int | None = None
    endpoint_a: str = Field(min_length=1, max_length=160)
    endpoint_b: str = Field(min_length=1, max_length=160)
    bandwidth: str = Field(min_length=1, max_length=64)
    provisioning_stage: str = Field(default="Feasibility", min_length=1, max_length=32)
    status: str = Field(default="Planned", min_length=1, max_length=32)


class CircuitRead(CircuitCreate):
    id: int
    contract: ContractRead
    asset: InfrastructureAssetRead | None = None
    pop: PopRead | None = None
    model_config = ConfigDict(from_attributes=True)


class ProductOfferingCreate(BaseModel):
    code: str | None = Field(default=None, max_length=32)
    name: str = Field(min_length=1, max_length=100)
    segment: str = Field(min_length=1, max_length=32)
    commercial_model: str = Field(min_length=1, max_length=32)
    pricing_model: str = Field(min_length=1, max_length=32)
    base_monthly_price: Decimal | None = Field(default=None, ge=0)
    is_orderable: bool = True


class ProductOfferingRead(ProductOfferingCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class QuoteCreate(BaseModel):
    quote_number: str | None = Field(default=None, max_length=32)
    account_id: int
    product_id: int
    status: str = Field(default="Draft", min_length=1, max_length=32)
    feasibility_status: str = Field(default="Not required", min_length=1, max_length=32)
    requested_capacity: str | None = Field(default=None, max_length=64)
    route_distance_km: Decimal | None = Field(default=None, ge=0)
    term_months: int = Field(default=12, ge=1)
    monthly_value: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class QuoteAccountRead(BaseModel):
    id: int
    name: str
    account_type: str
    model_config = ConfigDict(from_attributes=True)


class QuoteRead(QuoteCreate):
    id: int
    monthly_value: Decimal
    account: QuoteAccountRead
    product: ProductOfferingRead
    model_config = ConfigDict(from_attributes=True)


class DashboardSummary(BaseModel):
    active_subscribers: int
    tickets_recorded: int
    churn_alerts: int
    network_uptime: float | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    customer_context: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    reply: str
