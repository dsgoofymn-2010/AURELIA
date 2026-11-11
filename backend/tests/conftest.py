"""Shared helpers. No app imports here — unit and integration suites
configure their own environment in their own conftest files."""

VALID_PAYLOAD = {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91 98765 43210",
    "projectType": "Apartment",
    "project_location": "Bengaluru",
}

OWNER_EMAIL = "menefides@gmail.com"


def make_payload(**overrides) -> dict:
    payload = dict(VALID_PAYLOAD)
    payload.update(overrides)
    return payload
