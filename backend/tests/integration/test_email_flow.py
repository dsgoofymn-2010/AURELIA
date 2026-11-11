"""End-to-end email flow: POST inquiry → background task → real botocore
HTTP call → fake SES (moto). Asserts the notification is addressed to the
website owner's inbox."""

import boto3
import pytest
from moto import mock_aws
from moto.ses.models import ses_backends

from app.config import Settings
from tests.conftest import OWNER_EMAIL, make_payload

pytestmark = pytest.mark.integration

ACCOUNT_ID = "123456789012"
REGION = "ap-south-1"
CLIENT_EMAIL = "client@example.com"


@pytest.fixture
def enabled_email(monkeypatch):
    from app.services import email_service

    test_settings = Settings(
        email_enabled=True,
        ses_region=REGION,
        ses_from_address=OWNER_EMAIL,
        notify_to=OWNER_EMAIL,
    )
    monkeypatch.setattr(email_service, "get_settings", lambda: test_settings)


async def test_inquiry_notification_reaches_owner_inbox(client, enabled_email, monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")

    with mock_aws():
        ses = boto3.client("ses", region_name=REGION)
        ses.verify_email_identity(EmailAddress=OWNER_EMAIL)

        res = await client.post(
            "/api/v1/inquiries", json=make_payload(email=CLIENT_EMAIL)
        )
        assert res.status_code == 201, res.text

        backend = ses_backends[ACCOUNT_ID][REGION]
        assert len(backend.sent_messages) == 1, "background task did not send via SES"

        message = backend.sent_messages[0]
        # addressed to the website owner, replying goes to the client
        assert message.source == OWNER_EMAIL
        assert message.destinations == {"ToAddresses": [OWNER_EMAIL]}

        # content: subject + html body (moto stores Html.Data as body)
        assert "Apartment" in message.subject
        assert "Jane Doe" in message.subject
        for value in ["Jane Doe", CLIENT_EMAIL, "+91 98765 43210", "Apartment", "Bengaluru"]:
            assert value in message.body


async def test_notification_not_sent_when_email_disabled(client, db_query, monkeypatch):
    """EMAIL_ENABLED=false (forced in this conftest): row stored, zero SES traffic."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")

    with mock_aws():
        ses = boto3.client("ses", region_name=REGION)
        ses.verify_email_identity(EmailAddress=OWNER_EMAIL)

        res = await client.post("/api/v1/inquiries", json=make_payload())
        assert res.status_code == 201

        rows = await db_query("SELECT id FROM inquiries")
        assert len(rows) == 1

        backend = ses_backends[ACCOUNT_ID][REGION]
        assert backend.sent_messages == [], "email was sent despite EMAIL_ENABLED=false"
