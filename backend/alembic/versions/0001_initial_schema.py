"""create fiberline crm tables

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-18 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "pops",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("ports_total", sa.Integer(), nullable=False),
        sa.Column("ports_used", sa.Integer(), nullable=False),
        sa.Column("switch_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("switch_id"),
    )
    op.create_index("ix_pops_code", "pops", ["code"])

    op.create_table(
        "customer_sites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_customer_sites_code", "customer_sites", ["code"])

    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("site_id", sa.Integer(), nullable=False),
        sa.Column("pop_id", sa.Integer(), nullable=False),
        sa.Column("plan", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("risk", sa.String(length=32), nullable=False),
        sa.Column("monthly_value", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("tenure", sa.String(length=32), nullable=False),
        sa.Column("port", sa.String(length=64), nullable=False),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["site_id"], ["customer_sites.id"]),
        sa.ForeignKeyConstraint(["pop_id"], ["pops.id"]),
    )
    op.create_index("ix_customers_site_id", "customers", ["site_id"])
    op.create_index("ix_customers_pop_id", "customers", ["pop_id"])


def downgrade() -> None:
    op.drop_index("ix_customers_pop_id", table_name="customers")
    op.drop_index("ix_customers_site_id", table_name="customers")
    op.drop_table("customers")
    op.drop_index("ix_customer_sites_code", table_name="customer_sites")
    op.drop_table("customer_sites")
    op.drop_index("ix_pops_code", table_name="pops")
    op.drop_table("pops")
