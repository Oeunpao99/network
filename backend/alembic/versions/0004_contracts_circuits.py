"""add service contracts and circuits

Revision ID: 0004_contracts
Revises: 0003_assets
Create Date: 2026-07-18 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0004_contracts"
down_revision: str | None = "0003_assets"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "service_contracts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("contract_number", sa.String(length=32), nullable=False),
        sa.Column("account_name", sa.String(length=160), nullable=False),
        sa.Column("account_segment", sa.String(length=32), nullable=False),
        sa.Column("product", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("monthly_value", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("sla_availability", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("sla_mttr_hours", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("contract_number"),
    )
    op.create_index("ix_service_contracts_contract_number", "service_contracts", ["contract_number"])

    op.create_table(
        "circuits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("circuit_id", sa.String(length=32), nullable=False),
        sa.Column("contract_id", sa.Integer(), nullable=False),
        sa.Column("asset_id", sa.Integer(), nullable=True),
        sa.Column("pop_id", sa.Integer(), nullable=True),
        sa.Column("endpoint_a", sa.String(length=160), nullable=False),
        sa.Column("endpoint_b", sa.String(length=160), nullable=False),
        sa.Column("bandwidth", sa.String(length=64), nullable=False),
        sa.Column("provisioning_stage", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["contract_id"], ["service_contracts.id"]),
        sa.ForeignKeyConstraint(["asset_id"], ["infrastructure_assets.id"]),
        sa.ForeignKeyConstraint(["pop_id"], ["pops.id"]),
        sa.UniqueConstraint("circuit_id"),
    )
    op.create_index("ix_circuits_circuit_id", "circuits", ["circuit_id"])
    op.create_index("ix_circuits_contract_id", "circuits", ["contract_id"])
    op.create_index("ix_circuits_asset_id", "circuits", ["asset_id"])
    op.create_index("ix_circuits_pop_id", "circuits", ["pop_id"])


def downgrade() -> None:
    op.drop_index("ix_circuits_pop_id", table_name="circuits")
    op.drop_index("ix_circuits_asset_id", table_name="circuits")
    op.drop_index("ix_circuits_contract_id", table_name="circuits")
    op.drop_index("ix_circuits_circuit_id", table_name="circuits")
    op.drop_table("circuits")
    op.drop_index("ix_service_contracts_contract_number", table_name="service_contracts")
    op.drop_table("service_contracts")
