import asyncio
import os
from datetime import date

import pytest
from alembic import command
from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from tests.integration.conftest import BACKEND_DIR, TEST_DATABASE_URL

pytestmark = pytest.mark.integration

LEGACY_REVISION = "0002_add_viewing_details"


def _alembic_config() -> AlembicConfig:
    config = AlembicConfig(os.path.join(BACKEND_DIR, "alembic.ini"))
    config.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    return config


async def _seed_legacy_rows(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO inquiries
                    (name, email, phone, project_type, project_location,
                     preferred_date, message)
                VALUES
                    ('Valid', 'valid@migration.test', '1234567890',
                     'Apartment', 'Chennai', '2026-12-01', NULL),
                    ('Blank', 'blank@migration.test', '1234567890',
                     'Apartment', 'Chennai', '', NULL),
                    ('Invalid', 'invalid@migration.test', '1234567890',
                     'Apartment', 'Chennai', 'not-a-date', NULL),
                    ('Impossible', 'impossible@migration.test', '1234567890',
                     'Apartment', 'Chennai', '2026-13-40', NULL)
                """
            )
        )


async def test_upgrade_cleans_legacy_dates_and_makes_optional_fields_nullable(
    engine, db_query
):
    config = _alembic_config()
    try:
        await asyncio.to_thread(command.downgrade, config, LEGACY_REVISION)
        await _seed_legacy_rows(engine)
        await asyncio.to_thread(command.upgrade, config, "head")

        async with engine.begin() as conn:
            await conn.execute(
                text(
                    """
                    INSERT INTO inquiries
                        (name, email, phone, project_type, project_location)
                    VALUES
                        ('No Phone', 'nophone@migration.test', NULL,
                         'Apartment', NULL)
                    """
                )
            )

        rows = await db_query(
            "SELECT email, preferred_date FROM inquiries ORDER BY email"
        )
        by_email = {row.email: row.preferred_date for row in rows}
        assert by_email["valid@migration.test"] == date(2026, 12, 1)
        assert by_email["blank@migration.test"] is None
        assert by_email["invalid@migration.test"] is None
        assert by_email["impossible@migration.test"] is None
        assert by_email["nophone@migration.test"] is None

        columns = await db_query(
            "SELECT column_name, is_nullable FROM information_schema.columns "
            "WHERE table_name = 'inquiries' "
            "AND column_name IN ('phone', 'project_location') "
            "ORDER BY column_name"
        )
        assert {row.column_name: row.is_nullable for row in columns} == {
            "phone": "YES",
            "project_location": "YES",
        }

        version = await db_query("SELECT version_num FROM alembic_version")
        head = ScriptDirectory.from_config(config).get_current_head()
        assert version[0].version_num == head
    finally:
        await asyncio.to_thread(command.upgrade, config, "head")
