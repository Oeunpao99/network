"""add account segmentation and CPQ entities

Revision ID: 0005_commercial_cpq
Revises: 0004_contracts
Create Date: 2026-07-18 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0005_commercial_cpq"
down_revision: str | None = "0004_contracts"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("account_type", sa.String(length=32), nullable=False, server_default="SME"))
    op.add_column("customers", sa.Column("verification_status", sa.String(length=32), nullable=False, server_default="Pending"))
    op.add_column("customers", sa.Column("billing_model", sa.String(length=32), nullable=False, server_default="Recurring"))
    op.execute("UPDATE customers SET account_type = 'Enterprise' WHERE plan LIKE 'Enterprise%'")

    op.add_column("tickets", sa.Column("ticket_class", sa.String(length=32), nullable=False, server_default="Retail"))
    op.add_column("tickets", sa.Column("priority", sa.String(length=32), nullable=False, server_default="Normal"))
    op.add_column("tickets", sa.Column("contract_id", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("circuit_id", sa.Integer(), nullable=True))
    op.add_column("tickets", sa.Column("sla_due_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key("fk_tickets_contract_id", "tickets", "service_contracts", ["contract_id"], ["id"])
    op.create_foreign_key("fk_tickets_circuit_id", "tickets", "circuits", ["circuit_id"], ["id"])
    op.create_index("ix_tickets_contract_id", "tickets", ["contract_id"])
    op.create_index("ix_tickets_circuit_id", "tickets", ["circuit_id"])

    op.add_column("service_contracts", sa.Column("msa_number", sa.String(length=64), nullable=True))
    op.add_column("service_contracts", sa.Column("service_schedule_number", sa.String(length=64), nullable=True))
    op.add_column("service_contracts", sa.Column("route_diversity", sa.String(length=64), nullable=False, server_default="Standard"))
    op.add_column("service_contracts", sa.Column("service_credit_rate", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0"))

    op.create_table(
        "product_offerings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("segment", sa.String(length=32), nullable=False),
        sa.Column("commercial_model", sa.String(length=32), nullable=False),
        sa.Column("pricing_model", sa.String(length=32), nullable=False),
        sa.Column("base_monthly_price", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("is_orderable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_product_offerings_code", "product_offerings", ["code"])

    op.create_table(
        "quotes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("quote_number", sa.String(length=32), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("feasibility_status", sa.String(length=32), nullable=False),
        sa.Column("requested_capacity", sa.String(length=64), nullable=True),
        sa.Column("route_distance_km", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("term_months", sa.Integer(), nullable=False),
        sa.Column("monthly_value", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["product_offerings.id"]),
        sa.UniqueConstraint("quote_number"),
    )
    op.create_index("ix_quotes_quote_number", "quotes", ["quote_number"])
    op.create_index("ix_quotes_account_id", "quotes", ["account_id"])
    op.create_index("ix_quotes_product_id", "quotes", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_quotes_product_id", table_name="quotes")
    op.drop_index("ix_quotes_account_id", table_name="quotes")
    op.drop_index("ix_quotes_quote_number", table_name="quotes")
    op.drop_table("quotes")
    op.drop_index("ix_product_offerings_code", table_name="product_offerings")
    op.drop_table("product_offerings")

    op.drop_column("service_contracts", "service_credit_rate")
    op.drop_column("service_contracts", "route_diversity")
    op.drop_column("service_contracts", "service_schedule_number")
    op.drop_column("service_contracts", "msa_number")

    op.drop_index("ix_tickets_circuit_id", table_name="tickets")
    op.drop_index("ix_tickets_contract_id", table_name="tickets")
    op.drop_constraint("fk_tickets_circuit_id", "tickets", type_="foreignkey")
    op.drop_constraint("fk_tickets_contract_id", "tickets", type_="foreignkey")
    op.drop_column("tickets", "sla_due_at")
    op.drop_column("tickets", "circuit_id")
    op.drop_column("tickets", "contract_id")
    op.drop_column("tickets", "priority")
    op.drop_column("tickets", "ticket_class")

    op.drop_column("customers", "billing_model")
    op.drop_column("customers", "verification_status")
    op.drop_column("customers", "account_type")
