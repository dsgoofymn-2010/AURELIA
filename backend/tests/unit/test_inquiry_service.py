import pytest
from fastapi import HTTPException

from app.models import Inquiry
from app.schemas import InquiryCreate
from app.services import inquiry_service


def make_inquiry(**overrides) -> Inquiry:
    values = {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": None,
        "project_type": "Apartment",
        "project_location": None,
        "preferred_date": None,
        "message": None,
        "residence_floor": None,
    }
    values.update(overrides)
    return Inquiry(**values)


def payload(**overrides) -> dict:
    data = InquiryCreate(
        name="Jane Doe",
        email="jane@example.com",
        phone=None,
        projectType="Apartment",
    )
    values = data.model_dump(by_alias=False)
    values.pop("idempotency_key")
    values.update(overrides)
    return values


def test_reuse_returns_existing_row_for_same_payload():
    existing = make_inquiry()
    assert inquiry_service._reuse(existing, payload(), "key-1") is existing


def test_reuse_rejects_changed_payload():
    existing = make_inquiry()
    with pytest.raises(HTTPException) as exc:
        inquiry_service._reuse(existing, payload(name="Changed Name"), "key-1")
    assert exc.value.status_code == 409


def test_payload_match_handles_optional_fields():
    existing = make_inquiry(phone=None, project_location=None)
    assert inquiry_service._payload_matches(existing, payload())
