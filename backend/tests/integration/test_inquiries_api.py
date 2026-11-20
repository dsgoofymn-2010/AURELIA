from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import text

from tests.conftest import make_payload

pytestmark = pytest.mark.integration

ADMIN = {"X-Admin-Key": "test-key"}


async def test_create_inquiry_persists_row_in_postgres(client, db_query):
    res = await client.post("/api/v1/inquiries", json=make_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert isinstance(body["id"], int) and body["id"] > 0
    assert body["projectType"] == "Apartment"
    assert body["projectLocation"] == "Bengaluru"
    assert body["createdAt"]

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

    rows = await db_query("SELECT project_type, project_location FROM inquiries WHERE email = 'john@example.com'")
    assert rows[0].project_type == "Villa"
    assert rows[0].project_location == "Goa"


async def test_create_is_independent_per_row(client, db_query):
    ids = []
    for i in range(3):
        res = await client.post(
            "/api/v1/inquiries", json=make_payload(email=f"client{i}@example.com")
        )
        assert res.status_code == 201
        ids.append(res.json()["id"])
    assert len(set(ids)) == 3
    for inquiry_id in ids:
        assert isinstance(inquiry_id, int) and inquiry_id > 0


async def test_list_returns_newest_first_and_requires_key(client, db_query):
    anonymous = await client.get("/api/v1/inquiries")
    assert anonymous.status_code == 401

    wrong = await client.get("/api/v1/inquiries", headers={"X-Admin-Key": "nope"})
    assert wrong.status_code == 401

    await client.post("/api/v1/inquiries", json=make_payload(name="First", email="first@example.com"))
    await client.post("/api/v1/inquiries", json=make_payload(name="Second", email="second@example.com"))

    res = await client.get("/api/v1/inquiries", headers=ADMIN)
    assert res.status_code == 200
    data = res.json()
    items = data["items"] if isinstance(data, dict) else data
    assert [i["name"] for i in items[:2]] == ["Second", "First"]


async def test_list_limit(client):
    for i in range(5):
        await client.post("/api/v1/inquiries", json=make_payload(name=f"Person {i}", email=f"person{i}@example.com"))
    res = await client.get("/api/v1/inquiries?limit=2", headers=ADMIN)
    assert res.status_code == 200
    data = res.json()
    items = data["items"] if isinstance(data, dict) else data
    assert len(items) == 2

    bad = await client.get("/api/v1/inquiries?limit=0", headers=ADMIN)
    assert bad.status_code == 422


async def test_rejects_invalid_email(client, db_query):
    res = await client.post(
        "/api/v1/inquiries", json=make_payload(email="not-an-email")
    )
    assert res.status_code == 422
    assert await db_query("SELECT id FROM inquiries") == []


@pytest.mark.parametrize("field,value", [
    ("email", ""),
    ("projectType", ""),
    ("name", ""),
    ("name", "   "),
    ("name", "a"),
])
async def test_rejects_missing_or_empty_fields(client, db_query, field, value):
    res = await client.post("/api/v1/inquiries", json=make_payload(**{field: value}))
    assert res.status_code == 422
    assert await db_query("SELECT id FROM inquiries") == []


async def test_optional_fields_may_be_omitted(client, db_query):
    payload = {
        "name": "No Phone",
        "email": "nophone@example.com",
        "projectType": "Apartment",
    }
    res = await client.post("/api/v1/inquiries", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["phone"] is None
    assert body["projectLocation"] is None

    rows = await db_query(
        "SELECT phone, project_location, preferred_date, message FROM inquiries WHERE id = :id",
        id=body["id"],
    )
    assert rows[0].phone is None
    assert rows[0].project_location is None


async def test_viewing_details_are_persisted(client, db_query):
    future_date = (datetime.now(timezone.utc).date() + timedelta(days=20)).isoformat()
    payload = make_payload(
        email="viewing@example.com",
        preferredDate=future_date,
        message="Evening slot, please",
        residenceFloor="Floor 07",
    )
    res = await client.post("/api/v1/inquiries", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["preferredDate"] == future_date
    assert body["message"] == "Evening slot, please"
    assert body["residenceFloor"] == "Floor 07"

    rows = await db_query(
        "SELECT preferred_date, message, residence_floor FROM inquiries WHERE id = :id", id=body["id"]
    )
    assert str(rows[0].preferred_date) == future_date
    assert rows[0].message == "Evening slot, please"
    assert rows[0].residence_floor == "Floor 07"


async def test_idempotency_key_prevents_duplicate_insert(client, db_query):
    payload = make_payload(email="idemp@example.com", idempotencyKey="test-idemp-key-123")
    res1 = await client.post("/api/v1/inquiries", json=payload)
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    res2 = await client.post("/api/v1/inquiries", json=payload)
    assert res2.status_code == 201
    id2 = res2.json()["id"]

    assert id1 == id2
    rows = await db_query("SELECT id FROM inquiries WHERE email = 'idemp@example.com'")
    assert len(rows) == 1


async def test_idempotency_key_reused_with_different_payload_returns_409(client, db_query):
    payload = make_payload(email="conflict@example.com", idempotencyKey="reuse-key-123")
    first = await client.post("/api/v1/inquiries", json=payload)
    assert first.status_code == 201

    changed = make_payload(
        name="Different Name",
        email="conflict@example.com",
        idempotencyKey="reuse-key-123",
    )
    conflict = await client.post("/api/v1/inquiries", json=changed)
    assert conflict.status_code == 409

    rows = await db_query("SELECT id FROM inquiries WHERE email = 'conflict@example.com'")
    assert len(rows) == 1


async def test_list_filters_use_camel_case(client):
    await client.post(
        "/api/v1/inquiries",
        json=make_payload(email="villa@example.com", projectType="Villa"),
    )
    await client.post(
        "/api/v1/inquiries",
        json=make_payload(email="apt@example.com", projectType="Apartment"),
    )

    res = await client.get("/api/v1/inquiries?projectType=Villa", headers=ADMIN)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert [item["email"] for item in body["items"]] == ["villa@example.com"]


async def test_rejects_overlong_values(client):
    res = await client.post(
        "/api/v1/inquiries", json=make_payload(project_location="x" * 256)
    )
    assert res.status_code == 422

    res = await client.post("/api/v1/inquiries", json=make_payload(name="x" * 121))
    assert res.status_code == 422
