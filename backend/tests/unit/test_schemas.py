from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas import InquiryCreate, InquiryOut

from tests.conftest import VALID_PAYLOAD, make_payload


def make_valid(**overrides) -> InquiryCreate:
    return InquiryCreate(**make_payload(**overrides))


# --- accepted input spellings -------------------------------------------------

def test_camel_case_input_accepted():
    data = make_valid()
    assert data.project_type == "Apartment"
    assert data.project_location == "Bengaluru"


def test_snake_case_input_accepted():
    data = InquiryCreate(
        name="John",
        email="john@example.com",
        phone="1234567890",
        project_type="Villa",
        project_location="Goa",
    )
    assert data.project_type == "Villa"


def test_output_serialization_uses_camel_case():
    out = InquiryOut(
        id=1,
        name="Jane Doe",
        email="jane@example.com",
        phone="+91 98765 43210",
        project_type="Apartment",
        project_location="Bengaluru",
        created_at=datetime(2026, 11, 10, tzinfo=timezone.utc),
    )
    dumped = out.model_dump(by_alias=True)
    assert dumped["projectType"] == "Apartment"
    assert dumped["projectLocation"] == "Bengaluru"
    assert "project_type" not in dumped


def test_surrounding_whitespace_is_stripped():
    data = make_valid(name="  Jane Doe  ")
    assert data.name == "Jane Doe"


# --- rejected input ------------------------------------------------------------

@pytest.mark.parametrize("bad_email", ["not-an-email", "a@b", "@example.com", "jane@"])
def test_invalid_email_rejected(bad_email):
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(email=bad_email))


@pytest.mark.parametrize("bad_name", ["", "   "])
def test_empty_name_rejected(bad_name):
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(name=bad_name))


def test_name_length_limit():
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(name="x" * 121))
    assert InquiryCreate(**make_payload(name="x" * 120)).name


@pytest.mark.parametrize("field,value", [
    ("phone", ""),
    ("projectType", ""),
    ("project_location", ""),
])
def test_empty_required_fields_rejected(field, value):
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(**{field: value}))


def test_phone_length_limit():
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(phone="1" * 41))


def test_project_type_length_limit():
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(projectType="x" * 121))


def test_project_location_length_limit():
    with pytest.raises(ValidationError):
        InquiryCreate(**make_payload(project_location="x" * 256))


def test_missing_field_rejected():
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "phone"}
    with pytest.raises(ValidationError):
        InquiryCreate(**payload)
