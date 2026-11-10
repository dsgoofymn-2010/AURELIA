# AURELIA — Inquiry Backend

FastAPI service that stores website inquiry-form submissions in PostgreSQL
(Amazon RDS in production) and emails the company inbox through Amazon SES.

```
POST /api/v1/inquiries  →  validate → insert row → 201 → SES notification (background task)
```

## Stack
FastAPI · SQLAlchemy 2 (async) + asyncpg · Alembic · pydantic-settings · boto3 (SES) · uvicorn · pytest

## Layout
```
backend/
├── app/
│   ├── main.py                 # create_app(): CORS + routers
│   ├── config.py               # .env settings (pydantic-settings)
│   ├── db.py                   # async engine/session, get_db dependency
│   ├── models.py               # Inquiry model
│   ├── schemas.py              # request/response validation
│   ├── api/
│   │   ├── deps.py             # admin-key guard
│   │   └── routes/             # health.py, inquiries.py
│   └── services/
│       ├── inquiry_service.py  # DB read/write
│       └── email_service.py    # SES send + text/HTML templates
├── alembic/                    # migrations (versions/)
├── tests/                      # pytest + httpx (SQLite, no AWS needed)
├── docker-compose.yml          # local Postgres 16
├── .env.example
└── pyproject.toml
```

## Local setup

```bash
cd backend
py -3.11 -m venv .venv
.venv\Scripts\python -m pip install -e ".[dev]"     # macOS/Linux: source .venv/bin/activate

# 1. database (Docker Desktop must be running)
docker compose up -d db

# 2. configuration
copy .env.example .env          # macOS/Linux: cp .env.example .env

# 3. schema
.venv\Scripts\alembic upgrade head

# 4. run
.venv\Scripts\uvicorn app.main:app --reload          # http://localhost:8000/docs
```

## API

### `POST /api/v1/inquiries` → `201`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91 98765 43210",
  "projectType": "Apartment",
  "project_location": "Bengaluru"
}
```
Field names accept both `projectType`/`project_type` and
`projectLocation`/`project_location` on input; responses use camelCase
(`projectType`, `projectLocation`) plus `id` and `created_at`.
Validation failures return `422`.

### `GET /api/v1/inquiries?limit=50` → `200`
Requires header `X-Admin-Key: $ADMIN_API_KEY` (locked with `401` if the key
is unset). Returns newest first — handy to confirm storage before the
frontend exists.

### `GET /api/v1/health` → `200`
`{"status": "ok", "database": "up"}` — checks a live `SELECT 1`.

## Email flow (Amazon SES)
After the row is committed, `BackgroundTasks` runs
`send_inquiry_notification()` — a `send_email` call with the five fields,
Reply-To set to the client so the sales inbox can answer directly.
SES failures are logged and **never** fail the request (the inquiry is
already stored). Set `EMAIL_ENABLED=false` to disable sending.

Production checklist:
- Verify `SES_FROM_ADDRESS` (or its domain) in SES, and `NOTIFY_TO` while the
  account is still in the sandbox.
- Move out of the sandbox before real traffic, otherwise only verified
  addresses receive mail.
- Credentials: env vars (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) locally;
  an IAM role in AWS. boto3 uses the default credential chain.

## Tests
Three suites (49 tests total). Run from `backend/`:

```bash
.venv\Scripts\pytest -m "not integration"   # unit — no Docker/AWS needed (34 tests)
.venv\Scripts\pytest -m integration         # integration — needs Docker Postgres (15 tests)
.venv\Scripts\pytest                        # everything
```

- **unit/** — schema validation, email templates (incl. HTML-escaping),
  `send_inquiry_notification` with a mocked SES client (exact `send_email`
  arguments: From, To, Reply-To, subject, bodies), admin-key guard.
- **integration/** — real PostgreSQL in Docker: a separate `aurelia_test`
  database is created once, migrated with **alembic**, and truncated between
  tests (your dev data is untouched). Verifies rows with raw SQL, plus the
  full email flow against **moto** fake SES: POST → background task →
  botocore HTTP → captured message addressed to `NOTIFY_TO` (owner inbox).
  Skips with a clear message if Docker/Postgres is down.
  Force-runs with `EMAIL_ENABLED=false` and `ADMIN_API_KEY=test-key`
  regardless of `.env`.

## Confirming the email flow **without AWS**
Two scripts prove the notification path before any AWS account exists:

```bash
.venv\Scripts\python scripts\preview_email.py      # opens email_preview.html — the exact
                                                   # subject/text/html the owner would receive
.venv\Scripts\python scripts\local_email_demo.py   # boots an in-process fake SES server and
                                                   # runs the app's real send code path:
                                                   # [1] unverified sender rejected (control)
                                                   # [2] identity verified
                                                   # [3] MessageId returned by send_inquiry_notification()
```
The demo is the same function the API's background task calls; production
differs only by `endpoint_url` (real AWS), credentials, and verified identities.
The moto integration tests (`pytest -m integration`) cover the full
POST → background task → SES chain on every test run.

For local API development against the fake SES server, set in `.env`:
`SES_ENDPOINT_URL=http://127.0.0.1:5000` (run `moto_server -p 5000`), plus
fake creds `AWS_ACCESS_KEY_ID=testing` / `AWS_SECRET_ACCESS_KEY=testing`.

## AWS setup (when you're ready — needed only for REAL delivery)
1. Sign in to the [AWS console](https://console.aws.amazon.com) → SES (pick a
   region, e.g. `ap-south-1` — note it, it goes in `SES_REGION`).
2. **Verify identities**: SES → *Email addresses* → *Verify a new email
   address* → add **menefides@gmail.com** → click the link in the
   confirmation mail AWS sends you. (Sandbox: verify the From address too —
   here both From and To are the same address, so one verification covers it.)
3. **Create credentials**: IAM → Users → *Create user* → programmatic access →
   attach policy `AmazonSESFullAccess` → save the access key + secret.
4. Put them in `backend/.env` (never commit it):
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   SES_REGION=<the region you chose>
   ```
5. Send the real test mail:
   ```bash
   .venv\Scripts\python scripts\send_test_inquiry.py
   ```
   → prints `SENT MessageId=...`; mail arrives at menefides@gmail.com within
   a minute.
6. Before launch: request *production access* in the SES console (removes the
   sandbox limit of only mailing verified addresses), and optionally verify
   your brand domain to send from `sales@aurelia-residences.com`.

## Live SES test (real email)
Sends a real inquiry notification through Amazon SES to `NOTIFY_TO`
(currently **menefides@gmail.com**):

```bash
# needs credentials + verified identities in SES
$env:AWS_ACCESS_KEY_ID="AKIA..."; $env:AWS_SECRET_ACCESS_KEY="..."
.venv\Scripts\python scripts\send_test_inquiry.py
```
Prints the SES `MessageId` on success; on failure explains the usual causes
(missing credentials, wrong region, unverified from/to — the SES sandbox
requires **both** `SES_FROM_ADDRESS` and `NOTIFY_TO` to be verified identities).

## Configuration reference
See `.env.example`. Current test values: `SES_FROM_ADDRESS` and `NOTIFY_TO`
are both `menefides@gmail.com` (a pair that is easy to verify in the SES
sandbox). For production, verify your brand domain and switch
`SES_FROM_ADDRESS` to e.g. `sales@aurelia-residences.com`; point
`DATABASE_URL` at your RDS endpoint — no code changes.
