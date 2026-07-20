"""add tickets invoices and activity

Revision ID: 0002_support_billing
Revises: 0001_initial_schema
Create Date: 2026-07-18 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_support_billing"
down_revision: str | None = "0001_initial_schema"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tickets",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=300), nullable=False),
        sa.Column("opened_on", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
    )
    op.create_index("ix_tickets_customer_id", "tickets", ["customer_id"])

    op.create_table(
        "invoices",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("issued", sa.Date(), nullable=False),
        sa.Column("due", sa.Date(), nullable=False),
        sa.Column("paid", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
    )
    op.create_index("ix_invoices_customer_id", "invoices", ["customer_id"])

    op.create_table(
        "activities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("time_label", sa.String(length=32), nullable=False),
        sa.Column("html", sa.String(length=500), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("activities")
    op.drop_index("ix_invoices_customer_id", table_name="invoices")
    op.drop_table("invoices")
    op.drop_index("ix_tickets_customer_id", table_name="tickets")
    op.drop_table("tickets")
