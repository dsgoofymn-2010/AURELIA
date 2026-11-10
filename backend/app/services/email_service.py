import logging
from html import escape

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config import get_settings
from app.models import Inquiry

logger = logging.getLogger("app.email")


def _subject(inquiry: Inquiry) -> str:
    return f"New inquiry — {inquiry.project_type} — {inquiry.name}"


def _text_body(inquiry: Inquiry) -> str:
    return "\n".join(
        [
            "A new inquiry has been submitted on the AURELIA website.",
            "",
            f"Name:             {inquiry.name}",
            f"Email:            {inquiry.email}",
            f"Phone:            {inquiry.phone}",
            f"Project type:     {inquiry.project_type}",
            f"Project location: {inquiry.project_location}",
            f"Submitted:        {inquiry.created_at:%Y-%m-%d %H:%M %Z}",
            f"Inquiry id:       {inquiry.id}",
            "",
            "Reply directly to this email to reach the client.",
        ]
    )


def _html_body(inquiry: Inquiry) -> str:
    rows = [
        ("Name", inquiry.name),
        ("Email", inquiry.email),
        ("Phone", inquiry.phone),
        ("Project type", inquiry.project_type),
        ("Project location", inquiry.project_location),
        ("Submitted", f"{inquiry.created_at:%Y-%m-%d %H:%M %Z}"),
        ("Inquiry id", str(inquiry.id)),
    ]
    trs = "".join(
        f'<tr><td style="padding:6px 12px;color:#8a8f98;white-space:nowrap;">{escape(k)}</td>'
        f'<td style="padding:6px 12px;color:#1a1a1a;">{escape(str(v))}</td></tr>'
        for k, v in rows
    )
    return (
        '<div style="font-family:Georgia,serif;background:#f6f4f0;padding:24px;">'
        '<div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e6e1d8;">'
        '<div style="background:#12141a;color:#c8b98f;padding:18px 24px;'
        'letter-spacing:3px;text-transform:uppercase;font-size:13px;">'
        "AURELIA — New inquiry</div>"
        '<table style="border-collapse:collapse;width:100%;">'
        f"{trs}</table>"
        '<p style="padding:0 24px 20px;color:#555;font-size:13px;">'
        "Reply directly to this email to reach the client.</p>"
        "</div></div>"
    )


def send_inquiry_notification(
    inquiry: Inquiry, *, raise_errors: bool = False
) -> str | None:
    settings = get_settings()
    if not settings.email_enabled:
        logger.info(
            "EMAIL_ENABLED=false — skipped notification for inquiry %s", inquiry.id
        )
        return None
    try:
        client = boto3.client(
            "ses",
            region_name=settings.ses_region,
            endpoint_url=settings.ses_endpoint_url or None,
        )
        response = client.send_email(
            Source=settings.ses_from_address,
            Destination={"ToAddresses": [settings.notify_to]},
            ReplyToAddresses=[inquiry.email],
            Message={
                "Subject": {"Data": _subject(inquiry), "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": _text_body(inquiry), "Charset": "UTF-8"},
                    "Html": {"Data": _html_body(inquiry), "Charset": "UTF-8"},
                },
            },
        )
        message_id = response.get("MessageId")
        logger.info(
            "SES notification sent for inquiry %s (MessageId=%s)",
            inquiry.id,
            message_id,
        )
        return message_id
    except (ClientError, BotoCoreError):
        logger.exception("SES notification failed for inquiry %s", inquiry.id)
        if raise_errors:
            raise
        return None
