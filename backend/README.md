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
Three suites (48 tests total). Run from `backend/`:

```bash
.venv\Scripts\pytest -m "not integration"   # unit — no Docker/AWS needed (33 tests)
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
