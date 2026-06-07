"""add provider profile fields

Revision ID: 004
Revises: 003
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("providers", sa.Column("title", sa.String(255), nullable=True))
    op.add_column("providers", sa.Column("bio", sa.Text(), nullable=True))
    op.add_column("providers", sa.Column("years_experience", sa.Integer(), nullable=True))
    op.add_column("providers", sa.Column("linkedin_url", sa.String(500), nullable=True))
    op.add_column("providers", sa.Column("specialty", sa.String(255), nullable=True))
    op.add_column("providers", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("providers", "is_verified")
    op.drop_column("providers", "specialty")
    op.drop_column("providers", "linkedin_url")
    op.drop_column("providers", "years_experience")
    op.drop_column("providers", "bio")
    op.drop_column("providers", "title")
