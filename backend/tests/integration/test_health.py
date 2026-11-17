import pytest
from unittest.mock import AsyncMock

from app.db import get_db

pytestmark = pytest.mark.integration


async def test_health_reports_database_up(client):
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body == {"status": "ok", "database": "up"}


async def test_health_reports_database_degraded_on_failure(client):
    from app.main import app

    broken_session = AsyncMock()
    broken_session.execute.side_effect = Exception("DB connection timeout")

    async def override_broken_db():
        yield broken_session

    app.dependency_overrides[get_db] = override_broken_db
    try:
        res = await client.get("/api/v1/health")
        assert res.status_code == 503
        body = res.json()
        assert body == {"status": "degraded", "database": "down"}
    finally:
        del app.dependency_overrides[get_db]


async def test_ping(client):
    res = await client.get("/api/v1/ping")
    assert res.status_code == 200
    assert res.json()["service"] == "AURELIA Inquiry API"
