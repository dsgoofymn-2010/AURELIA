import pytest

from tests.conftest import make_payload

pytestmark = pytest.mark.integration

ADMIN = {"X-Admin-Key": "test-key"}


async def test_create_inquiry_persists_row_in_postgres(client, db_query):
    res = await client.post("/api/v1/inquiries", json=make_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["id"] == 1
    assert body["projectType"] == "Apartment"
    assert body["projectLocation"] == "Bengaluru"
    assert body["created_at"]

    rows = await db_query(
        "SELECT name, email, phone, project_type, project_location, created_at "
        "FROM inquiries WHERE id = :id",
        id=body["id"],
    )
    assert len(rows) == 1
    row = rows[0]
    assert row.name == "Jane Doe"
    assert row.email == "jane@example.com"
    assert row.phone == "+91 98765 43210"
    assert row.project_type == "Apartment"
    assert row.project_location == "Bengaluru"
    assert row.created_at is not None


async def test_create_accepts_snake_case_field_names(client, db_query):
    payload = {
        "name": "John",
        "email": "john@example.com",
        "phone": "1234567890",
        "project_type": "Villa",
        "project_location": "Goa",
    }
    res = await client.post("/api/v1/inquiries", json=payload)
    assert res.status_code == 201, res.text
    assert res.json()["projectType"] == "Villa"

    rows = await db_query("SELECT project_type, project_location FROM inquiries")
    assert rows[0].project_type == "Villa"
    assert rows[0].project_location == "Goa"


async def test_create_is_independent_per_row(client, db_query):
    for i in range(3):
        res = await client.post(
            "/api/v1/inquiries", json=make_payload(email=f"client{i}@example.com")
        )
        assert res.status_code == 201
    rows = await db_query("SELECT id FROM inquiries ORDER BY id")
    assert [r.id for r in rows] == [1, 2, 3]


async def test_list_returns_newest_first_and_requires_key(client, db_query):
    anonymous = await client.get("/api/v1/inquiries")
    assert anonymous.status_code == 401

    wrong = await client.get("/api/v1/inquiries", headers={"X-Admin-Key": "nope"})
    assert wrong.status_code == 401

    await client.post("/api/v1/inquiries", json=make_payload(name="First"))
    await client.post("/api/v1/inquiries", json=make_payload(name="Second"))

    res = await client.get("/api/v1/inquiries", headers=ADMIN)
    assert res.status_code == 200
    items = res.json()
    assert [i["name"] for i in items] == ["Second", "First"]


async def test_list_limit(client):
    for i in range(5):
        await client.post("/api/v1/inquiries", json=make_payload(name=f"Person {i}"))
    res = await client.get("/api/v1/inquiries?limit=2", headers=ADMIN)
    assert res.status_code == 200
    assert len(res.json()) == 2

    bad = await client.get("/api/v1/inquiries?limit=0", headers=ADMIN)
    assert bad.status_code == 422


async def test_rejects_invalid_email(client, db_query):
    res = await client.post(
        "/api/v1/inquiries", json=make_payload(email="not-an-email")
    )
    assert res.status_code == 422
    assert await db_query("SELECT id FROM inquiries") == []


@pytest.mark.parametrize("field,value", [
    ("phone", ""),
    ("projectType", ""),
    ("project_location", ""),
    ("name", "   "),
])
async def test_rejects_missing_or_empty_fields(client, db_query, field, value):
    res = await client.post("/api/v1/inquiries", json=make_payload(**{field: value}))
    assert res.status_code == 422
    assert await db_query("SELECT id FROM inquiries") == []


async def test_rejects_overlong_values(client):
    res = await client.post(
        "/api/v1/inquiries", json=make_payload(project_location="x" * 256)
    )
    assert res.status_code == 422

    res = await client.post("/api/v1/inquiries", json=make_payload(name="x" * 121))
    assert res.status_code == 422
