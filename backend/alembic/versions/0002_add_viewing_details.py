"""add preferred_date and message to inquiries

Revision ID: 0002_add_viewing_details
Revises: 0001_create_inquiries
Create Date: 2026-11-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_add_viewing_details"
down_revision: Union[str, None] = "0001_create_inquiries"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("inquiries", sa.Column("preferred_date", sa.String(length=10), nullable=True))
    op.add_column("inquiries", sa.Column("message", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("inquiries", "message")
    op.drop_column("inquiries", "preferred_date")
