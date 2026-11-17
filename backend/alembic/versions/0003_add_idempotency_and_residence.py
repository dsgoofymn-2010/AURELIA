"""add idempotency_key, residence_floor, dedupe indexes, and date type

Revision ID: 0003_add_idempotency_and_residence
Revises: 0002_add_viewing_details
Create Date: 2026-11-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_idempotency_and_residence"
down_revision: Union[str, None] = "0002_add_viewing_details"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add idempotency_key and residence_floor columns
    op.add_column("inquiries", sa.Column("idempotency_key", sa.String(length=64), nullable=True))
    op.add_column("inquiries", sa.Column("residence_floor", sa.String(length=40), nullable=True))

    # 2. Change preferred_date from String(10) to Date.
    # Legacy rows may contain "" or invalid dates; convert them to NULL
    # first so the cast cannot abort the migration.
    op.execute(
        """
        CREATE OR REPLACE FUNCTION pg_temp.aurelia_safe_date(value text)
        RETURNS date AS $$
        BEGIN
            RETURN value::date;
        EXCEPTION WHEN others THEN
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        UPDATE inquiries
        SET preferred_date = pg_temp.aurelia_safe_date(TRIM(preferred_date))::text
        WHERE preferred_date IS NOT NULL;
        """
    )
    op.alter_column(
        "inquiries",
        "preferred_date",
        type_=sa.Date(),
        existing_type=sa.String(length=10),
        postgresql_using="preferred_date::date",
        nullable=True,
    )

    # 3. Add partial unique index on idempotency_key
    op.create_index(
        "ix_inquiries_idempotency_key",
        "inquiries",
        ["idempotency_key"],
        unique=True,
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )

    # 4. Add index for short-window dedupe
    op.create_index(
        "ix_inquiries_email_project_type_created_at",
        "inquiries",
        ["email", "project_type", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_inquiries_email_project_type_created_at", table_name="inquiries")
    op.drop_index(
        "ix_inquiries_idempotency_key",
        table_name="inquiries",
        postgresql_where=sa.text("idempotency_key IS NOT NULL"),
    )
    op.alter_column(
        "inquiries",
        "preferred_date",
        type_=sa.String(length=10),
        existing_type=sa.Date(),
        postgresql_using="preferred_date::text",
        nullable=True,
    )
    op.drop_column("inquiries", "residence_floor")
    op.drop_column("inquiries", "idempotency_key")

