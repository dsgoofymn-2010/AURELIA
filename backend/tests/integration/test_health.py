import pytest

pytestmark = pytest.mark.integration


async def test_health_reports_database_up(client):
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body == {"status": "ok", "database": "up"}


async def test_ping(client):
    res = await client.get("/api/v1/ping")
    assert res.status_code == 200
    assert res.json()["service"] == "AURELIA Inquiry API"
