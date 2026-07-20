"""add infrastructure assets

Revision ID: 0003_assets
Revises: 0002_support_billing
Create Date: 2026-07-18 00:00:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0003_assets"
down_revision: str | None = "0002_support_billing"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "infrastructure_assets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("asset_type", sa.String(length=64), nullable=False),
        sa.Column("location_name", sa.String(length=160), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("capacity_total", sa.Integer(), nullable=False),
        sa.Column("capacity_used", sa.Integer(), nullable=False),
        sa.Column("capacity_unit", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_infrastructure_assets_code", "infrastructure_assets", ["code"])


def downgrade() -> None:
    op.drop_index("ix_infrastructure_assets_code", table_name="infrastructure_assets")
    op.drop_table("infrastructure_assets")
