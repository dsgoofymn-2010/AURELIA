"""make phone/project_location optional and drop unused dedupe index

Revision ID: 0004_optional_fields
Revises: 0003_add_idempotency_and_residence
Create Date: 2026-11-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_optional_fields"
down_revision: Union[str, None] = "0003_add_idempotency_and_residence"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The ORM and API treat these as optional; the original schema did not.
    op.alter_column(
        "inquiries",
        "phone",
        existing_type=sa.String(length=40),
        nullable=True,
    )
    op.alter_column(
        "inquiries",
        "project_location",
        existing_type=sa.String(length=255),
        nullable=True,
    )

    # The email/project_type short-window dedupe was removed in favour of
    # client-supplied idempotency keys.
    op.drop_index(
        "ix_inquiries_email_project_type_created_at",
        table_name="inquiries",
    )


def downgrade() -> None:
    op.create_index(
        "ix_inquiries_email_project_type_created_at",
        "inquiries",
        ["email", "project_type", "created_at"],
    )
    op.execute("UPDATE inquiries SET phone = '' WHERE phone IS NULL")
    op.execute("UPDATE inquiries SET project_location = '' WHERE project_location IS NULL")
    op.alter_column(
        "inquiries",
        "phone",
        existing_type=sa.String(length=40),
        nullable=False,
    )
    op.alter_column(
        "inquiries",
        "project_location",
        existing_type=sa.String(length=255),
        nullable=False,
    )
