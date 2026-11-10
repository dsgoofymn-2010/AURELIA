from datetime import datetime, timezone

from app.models import Inquiry
from app.services import email_service as es


def make_inquiry(**overrides) -> Inquiry:
    fields = dict(
        id=7,
        name="Jane Doe",
        email="jane@example.com",
        phone="+91 98765 43210",
        project_type="Apartment",
        project_location="Bengaluru",
        created_at=datetime(2026, 11, 10, 14, 30, tzinfo=timezone.utc),
    )
    fields.update(overrides)
    return Inquiry(**fields)


ALL_VALUES = ["Jane Doe", "jane@example.com", "+91 98765 43210", "Apartment", "Bengaluru"]


def test_subject_contains_project_type_and_name():
    subject = es._subject(make_inquiry())
    assert "Apartment" in subject
    assert "Jane Doe" in subject


def test_text_body_contains_every_field():
    body = es._text_body(make_inquiry())
    for value in ALL_VALUES:
        assert value in body
    assert "2026-11-10" in body
    assert "7" in body  # inquiry id
    assert "Reply directly" in body


def test_html_body_contains_every_field():
    html = es._html_body(make_inquiry())
    for value in ALL_VALUES:
        assert value in html
    assert "<table" in html
    assert "Reply directly" in html


def test_html_body_escapes_user_input():
    html = es._html_body(make_inquiry(name="<script>alert(1)</script>", project_location="A&B"))
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "A&amp;B" in html


def test_text_body_does_not_escape_but_is_plain_text():
    body = es._text_body(make_inquiry(name="<script>"))
    assert "<script>" in body  # plain-text mail, no HTML interpretation
