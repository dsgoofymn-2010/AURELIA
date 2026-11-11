"""End-to-end email confirmation WITHOUT any AWS setup.

Starts an in-process fake SES server (moto), then:
  1. negative control — sending from an unverified address must be rejected
     (proves the fake server enforces real SES identity rules)
  2. verifies menefides@gmail.com as sender
  3. runs the app's real send_inquiry_notification() code path — the exact
     function the API's background task calls — and prints the MessageId

Production differs only in: endpoint_url (real AWS), credentials, and
verified identities.

Usage:  .venv\\Scripts\\python scripts\\local_email_demo.py
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Fake credentials so botocore can sign requests to the local server.
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")

import boto3  # noqa: E402
from botocore.exceptions import ClientError  # noqa: E402
from moto.server import ThreadedMotoServer  # noqa: E402

import app.services.email_service as email_service  # noqa: E402
from app.config import Settings  # noqa: E402
from app.models import Inquiry  # noqa: E402

OWNER = "menefides@gmail.com"


def main() -> int:
    server = ThreadedMotoServer(ip_address="127.0.0.1", port=0, verbose=False)
    server.start()
    host, port = server.get_host_and_port()
    endpoint = f"http://{host}:{port}"
    print(f"[0] fake SES server running at {endpoint}")

    try:
        probe = boto3.client(
            "ses", region_name="ap-south-1", endpoint_url=endpoint
        )
        inquiry = Inquiry(
            id=1,
            name="Jane Doe",
            email="jane@example.com",
            phone="+91 98765 43210",
            project_type="Apartment",
            project_location="Bengaluru",
            created_at=datetime.now(timezone.utc),
        )

        # 1. negative control: unverified sender must bounce
        try:
            probe.send_email(
                Source=OWNER,
                Destination={"ToAddresses": [OWNER]},
                Message={
                    "Subject": {"Data": "should fail", "Charset": "UTF-8"},
                    "Body": {"Text": {"Data": "x", "Charset": "UTF-8"}},
                },
            )
        except ClientError as exc:
            print(f"[1] unverified sender rejected -> {exc.response['Error']['Message']}")
        else:
            print("[1] FAILED: fake SES accepted an unverified sender")
            return 1

        # 2. verify the sender (same step you will do in the real SES console)
        probe.verify_email_identity(EmailAddress=OWNER)
        print(f"[2] verified sender identity: {OWNER}")

        # 3. the app's real code path
        test_settings = Settings(
            email_enabled=True,
            ses_region="ap-south-1",
            ses_from_address=OWNER,
            notify_to=OWNER,
            ses_endpoint_url=endpoint,
        )
        email_service.get_settings = lambda: test_settings

        message_id = email_service.send_inquiry_notification(
            inquiry, raise_errors=True
        )
        print(f"[3] send_inquiry_notification() -> MessageId={message_id}")
        print()
        print("CONFIRMED: the exact notification code path works end-to-end.")
        print(f"  From: {OWNER}  |  To: {OWNER}  |  Reply-To: {inquiry.email}")
        print("  (locally against fake SES — run scripts/send_test_inquiry.py")
        print("   with AWS credentials to deliver the real one)")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"FAILED: {type(exc).__name__}: {exc}")
        return 1
    finally:
        server.stop()


if __name__ == "__main__":
    raise SystemExit(main())
