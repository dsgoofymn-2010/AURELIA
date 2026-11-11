"""Send a REAL inquiry notification through Amazon SES to the website owner.

Requires:
  - AWS credentials in the environment (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
  - SES_REGION where your identities are verified
  - SES_FROM_ADDRESS verified as an SES identity (in sandbox, the recipient
    NOTIFY_TO must be verified too)

Usage:
  .venv/Scripts/python scripts/send_test_inquiry.py            # Windows
  .venv/bin/python scripts/send_test_inquiry.py                # macOS/Linux
"""

import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings  # noqa: E402
from app.models import Inquiry  # noqa: E402
from app.services.email_service import send_inquiry_notification  # noqa: E402


def main() -> int:
    settings = get_settings()

    print("AURELIA — live SES test")
    print(f"  region : {settings.ses_region}")
    print(f"  from   : {settings.ses_from_address}")
    print(f"  to     : {settings.notify_to}")

    if not settings.email_enabled:
        print("  EMAIL_ENABLED=false — set it to true in backend/.env")
        return 1

    inquiry = Inquiry(
        id=0,
        name="AURELIA Test Client",
        email="test.client@example.com",
        phone="+91 00000 00000",
        project_type="Test — Apartment",
        project_location="Bengaluru",
        created_at=datetime.now(timezone.utc),
    )

    try:
        message_id = send_inquiry_notification(inquiry, raise_errors=True)
    except Exception as exc:  # noqa: BLE001 - report any SES failure clearly
        print(f"\nFAILED: {type(exc).__name__}: {exc}")
        print("Check: credentials present? region correct? from/to verified")
        print("       (SES sandbox requires BOTH sender and recipient verified)")
        return 1

    print(f"\nSENT  MessageId={message_id}")
    print(f"Delivery to {settings.notify_to} should arrive within a minute.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
