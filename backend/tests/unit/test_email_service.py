from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError, NoCredentialsError

from app.config import Settings
from app.services import email_service as es

from tests.unit.test_email_templates import make_inquiry

OWNER = "menefides@gmail.com"


def settings(**overrides) -> Settings:
    base = dict(
        email_enabled=True,
        ses_region="ap-south-1",
        ses_from_address=OWNER,
        notify_to=OWNER,
    )
    base.update(overrides)
    return Settings(**base)


def send(inquiry=None, **settings_overrides):
    inquiry = inquiry or make_inquiry()
    with patch.object(es, "get_settings", return_value=settings(**settings_overrides)):
        with patch.object(es.boto3, "client") as mock_client:
            mock_client.return_value.send_email.return_value = {"MessageId": "msg-123"}
            message_id = es.send_inquiry_notification(inquiry)
    return message_id, mock_client


def test_sends_to_owner_inbox_with_client_reply_to():
    message_id, mock_client = send()
    assert message_id == "msg-123"
    mock_client.assert_called_once_with("ses", region_name="ap-south-1")

    kwargs = mock_client.return_value.send_email.call_args.kwargs
    assert kwargs["Source"] == OWNER
    assert kwargs["Destination"] == {"ToAddresses": [OWNER]}
    assert kwargs["ReplyToAddresses"] == ["jane@example.com"]
    assert "Jane Doe" in kwargs["Message"]["Subject"]["Data"]
    assert "Apartment" in kwargs["Message"]["Subject"]["Data"]


def test_message_body_contains_all_five_fields():
    _, mock_client = send()
    kwargs = mock_client.return_value.send_email.call_args.kwargs
    text = kwargs["Message"]["Body"]["Text"]["Data"]
    html = kwargs["Message"]["Body"]["Html"]["Data"]
    for value in ["Jane Doe", "jane@example.com", "+91 98765 43210", "Apartment", "Bengaluru"]:
        assert value in text
        assert value in html
    assert kwargs["Message"]["Body"]["Text"]["Charset"] == "UTF-8"
    assert kwargs["Message"]["Body"]["Html"]["Charset"] == "UTF-8"


def test_disabled_email_makes_no_ses_call():
    inquiry = make_inquiry()
    with patch.object(es, "get_settings", return_value=settings(email_enabled=False)):
        with patch.object(es.boto3, "client") as mock_client:
            message_id = es.send_inquiry_notification(inquiry)
    assert message_id is None
    mock_client.assert_not_called()


def test_ses_failure_is_swallowed_by_default():
    inquiry = make_inquiry()
    with patch.object(es, "get_settings", return_value=settings()):
        with patch.object(es.boto3, "client") as mock_client:
            mock_client.return_value.send_email.side_effect = NoCredentialsError()
            assert es.send_inquiry_notification(inquiry) is None


def test_ses_failure_raises_when_requested():
    inquiry = make_inquiry()
    error = ClientError(
        {"Error": {"Code": "MessageRejected", "Message": "not verified"}},
        "SendEmail",
    )
    with patch.object(es, "get_settings", return_value=settings()):
        with patch.object(es.boto3, "client") as mock_client:
            mock_client.return_value.send_email.side_effect = error
            with pytest.raises(ClientError):
                es.send_inquiry_notification(inquiry, raise_errors=True)


def test_client_error_from_boto3_is_also_swallowed():
    inquiry = make_inquiry()
    error = ClientError(
        {"Error": {"Code": "MessageRejected", "Message": "nope"}}, "SendEmail"
    )
    with patch.object(es, "get_settings", return_value=settings()):
        with patch.object(es.boto3, "client") as mock_client:
            mock_client.return_value.send_email.side_effect = error
            assert es.send_inquiry_notification(inquiry) is None
