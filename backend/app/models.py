from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Pop(Base):
    __tablename__ = "pops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    ports_total: Mapped[int] = mapped_column(Integer)
    ports_used: Mapped[int] = mapped_column(Integer, default=0)
    switch_id: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customers: Mapped[list["Customer"]] = relationship(back_populates="pop")


class CustomerSite(Base):
    __tablename__ = "customer_sites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customers: Mapped[list["Customer"]] = relationship(back_populates="site")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    site_id: Mapped[int] = mapped_column(ForeignKey("customer_sites.id"), index=True)
    pop_id: Mapped[int] = mapped_column(ForeignKey("pops.id"), index=True)
    plan: Mapped[str] = mapped_column(String(100))
    account_type: Mapped[str] = mapped_column(String(32), default="SME")
    verification_status: Mapped[str] = mapped_column(String(32), default="Pending")
    billing_model: Mapped[str] = mapped_column(String(32), default="Recurring")
    status: Mapped[str] = mapped_column(String(32))
    risk: Mapped[str] = mapped_column(String(32))
    monthly_value: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tenure: Mapped[str] = mapped_column(String(32))
    port: Mapped[str] = mapped_column(String(64))
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    site: Mapped[CustomerSite] = relationship(back_populates="customers")
    pop: Mapped[Pop] = relationship(back_populates="customers")
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="customer")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="customer")
    quotes: Mapped[list["Quote"]] = relationship(back_populates="account")


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    text: Mapped[str] = mapped_column(String(300))
    opened_on: Mapped[date] = mapped_column(Date)
    ticket_class: Mapped[str] = mapped_column(String(32), default="Retail")
    priority: Mapped[str] = mapped_column(String(32), default="Normal")
    contract_id: Mapped[int | None] = mapped_column(ForeignKey("service_contracts.id"), nullable=True, index=True)
    circuit_id: Mapped[int | None] = mapped_column(ForeignKey("circuits.id"), nullable=True, index=True)
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    customer: Mapped[Customer] = relationship(back_populates="tickets")
    contract: Mapped["ServiceContract | None"] = relationship(back_populates="tickets")
    circuit: Mapped["Circuit | None"] = relationship(back_populates="tickets")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(32))
    issued: Mapped[date] = mapped_column(Date)
    due: Mapped[date] = mapped_column(Date)
    paid: Mapped[date | None] = mapped_column(Date, nullable=True)

    customer: Mapped[Customer] = relationship(back_populates="invoices")


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    time_label: Mapped[str] = mapped_column(String(32))
    html: Mapped[str] = mapped_column(String(500))


class InfrastructureAsset(Base):
    __tablename__ = "infrastructure_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    asset_type: Mapped[str] = mapped_column(String(64))
    location_name: Mapped[str] = mapped_column(String(160))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    capacity_total: Mapped[int] = mapped_column(Integer)
    capacity_used: Mapped[int] = mapped_column(Integer, default=0)
    capacity_unit: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="Active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ServiceContract(Base):
    __tablename__ = "service_contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contract_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    account_name: Mapped[str] = mapped_column(String(160))
    account_segment: Mapped[str] = mapped_column(String(32))
    product: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(32), default="Draft")
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    monthly_value: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    sla_availability: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    sla_mttr_hours: Mapped[int] = mapped_column(Integer)
    msa_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    service_schedule_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    route_diversity: Mapped[str] = mapped_column(String(64), default="Standard")
    service_credit_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    circuits: Mapped[list["Circuit"]] = relationship(back_populates="contract")
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="contract")


class Circuit(Base):
    __tablename__ = "circuits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    circuit_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("service_contracts.id"), index=True)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("infrastructure_assets.id"), nullable=True, index=True)
    pop_id: Mapped[int | None] = mapped_column(ForeignKey("pops.id"), nullable=True, index=True)
    endpoint_a: Mapped[str] = mapped_column(String(160))
    endpoint_b: Mapped[str] = mapped_column(String(160))
    bandwidth: Mapped[str] = mapped_column(String(64))
    provisioning_stage: Mapped[str] = mapped_column(String(32), default="Feasibility")
    status: Mapped[str] = mapped_column(String(32), default="Planned")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    contract: Mapped[ServiceContract] = relationship(back_populates="circuits")
    asset: Mapped[InfrastructureAsset | None] = relationship()
    pop: Mapped[Pop | None] = relationship()
    tickets: Mapped[list[Ticket]] = relationship(back_populates="circuit")


class ProductOffering(Base):
    __tablename__ = "product_offerings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    segment: Mapped[str] = mapped_column(String(32))
    commercial_model: Mapped[str] = mapped_column(String(32))
    pricing_model: Mapped[str] = mapped_column(String(32))
    base_monthly_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_orderable: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quotes: Mapped[list["Quote"]] = relationship(back_populates="product")


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quote_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("product_offerings.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="Draft")
    feasibility_status: Mapped[str] = mapped_column(String(32), default="Not required")
    requested_capacity: Mapped[str | None] = mapped_column(String(64), nullable=True)
    route_distance_km: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    term_months: Mapped[int] = mapped_column(Integer)
    monthly_value: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    account: Mapped[Customer] = relationship(back_populates="quotes")
    product: Mapped[ProductOffering] = relationship(back_populates="quotes")
