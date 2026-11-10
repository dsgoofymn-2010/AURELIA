"""Integration fixtures: a dedicated `aurelia_test` database on the local
Docker PostgreSQL, schema applied with alembic, tables wiped between tests.
The suite skips cleanly when PostgreSQL is unreachable."""

import asyncio
import os

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Deterministic test environment, independent of any ambient shell values.
os.environ["EMAIL_ENABLED"] = "false"
os.environ["ADMIN_API_KEY"] = "test-key"

from app.config import get_settings  # noqa: E402

get_settings.cache_clear()

TEST_DATABASE_URL = "postgresql+asyncpg://aurelia:aurelia@localhost:5432/aurelia_test"
SERVER_DATABASE_URL = "postgresql+asyncpg://aurelia:aurelia@localhost:5432/postgres"
TEST_DB_NAME = "aurelia_test"

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def _probe_server() -> None:
    engine = create_async_engine(SERVER_DATABASE_URL, poolclass=NullPool)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    finally:
        await engine.dispose()


async def _ensure_database() -> None:
    engine = create_async_engine(
        SERVER_DATABASE_URL, poolclass=NullPool, isolation_level="AUTOCOMMIT"
    )
    try:
        async with engine.connect() as conn:
            exists = await conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": TEST_DB_NAME},
            )
            if exists.scalar() is None:
                await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    finally:
        await engine.dispose()


def _run_alembic() -> None:
    from alembic import command
    from alembic.config import Config as AlembicConfig

    cfg = AlembicConfig(os.path.join(BACKEND_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(cfg, "head")


@pytest.fixture(scope="session")
def db_url() -> str:
    try:
        asyncio.run(_probe_server())
    except Exception as exc:  # noqa: BLE001 - any connection problem means "no DB"
        pytest.skip(f"PostgreSQL is not reachable — start it with `docker compose up -d db` ({exc})")
    asyncio.run(_ensure_database())
    _run_alembic()
    return TEST_DATABASE_URL


@pytest.fixture(scope="session")
def engine(db_url):
    engine = create_async_engine(db_url, poolclass=NullPool)
    yield engine
    asyncio.run(engine.dispose())


@pytest.fixture(scope="session")
def session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def clean_tables(session_factory):
    """Wipe inquiry data before every integration test."""
    async with session_factory() as session:
        await session.execute(text("TRUNCATE inquiries RESTART IDENTITY"))
        await session.commit()
    yield


@pytest_asyncio.fixture
async def client(session_factory):
    from app.db import get_db
    from app.main import app

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    import httpx

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def db_query(session_factory):
    async def _query(query: str, **params):
        async with session_factory() as session:
            result = await session.execute(text(query), params)
            return result.all()

    return _query
