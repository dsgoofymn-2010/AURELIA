# AURELIA — Inquiry Backend

FastAPI service that stores website inquiry-form submissions in PostgreSQL
(Amazon RDS in production).

```
POST /api/v1/inquiries  →  validate → insert row → 201
```

## Stack
FastAPI · SQLAlchemy 2 (async) + asyncpg · Alembic · pydantic-settings · uvicorn · pytest

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
│       └── inquiry_service.py  # DB read/write
├── alembic/                    # migrations (versions/)
├── tests/                      # pytest + httpx
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
  "projectLocation": "Bengaluru"
}
```
Field names accept both `projectType`/`project_type` and
`projectLocation`/`project_location` on input; responses use camelCase
(`projectType`, `projectLocation`, `createdAt`) plus `id`.
Optional fields (`phone`, `projectLocation`, `preferredDate`, `message`,
`residenceFloor`) may be omitted. Validation failures return `422`. The row is
committed to PostgreSQL before the `201` is returned.

Send an optional `idempotencyKey` (UUID, max 64 chars) and reuse it when
retrying the same submission. Repeating the same key with the same data returns
the existing row (`201`); reusing a key with different data returns `409`.

### `GET /api/v1/inquiries?limit=50&offset=0` → `200`
Requires header `X-Admin-Key: $ADMIN_API_KEY` (`401` if the key is unset or
invalid; failed attempts are limited per client IP and cleared on success).
Returns paginated results with `items`, `total`, `offset`, and `limit`.
Supports filters: `email`, `projectType`, `createdAfter`, `createdBefore`.
Responses carry `Cache-Control: no-store, private`.

### `GET /api/v1/health` → `200` (or `503` degraded)
`{"status": "ok", "database": "up"}` — checks a live `SELECT 1`. Returns HTTP 503
if database connectivity is down. Use `/api/v1/ping` for a lightweight liveness probe.

## Docker and CI

```bash
docker build -t aurelia-backend .
# Run the migration as a one-off job before starting new containers:
docker run --rm --env-file .env aurelia-backend alembic upgrade head
docker run --rm -p 8000:8000 --env-file .env aurelia-backend
```

The image includes `alembic.ini` and `alembic/` so the startup revision
check works; the container does not run migrations automatically. CI
(`.github/workflows/backend.yml`) runs the unit and integration suites
against PostgreSQL 16 and applies migrations on every backend change.

## Tests
Run from `backend/`:

```bash
.venv\Scripts\pytest -m "not integration"   # unit — no Docker needed
.venv\Scripts\pytest -m integration         # integration — needs Docker Postgres
.venv\Scripts\pytest                        # everything
```

- **unit/** — schema validation, admin-key guard.
- **integration/** — real PostgreSQL in Docker: a separate `aurelia_test`
  database is created once, migrated with **alembic**, and truncated between
  tests (your dev data is untouched). Verifies persisted rows with raw SQL,
  including a 0002→0004 migration test that seeds legacy `preferred_date`
  values. Skips with a clear message if Docker/Postgres is down; runs with
  `ADMIN_API_KEY=test-key` regardless of `.env`.

## Configuration reference
See `.env.example`. Point `DATABASE_URL` at your RDS endpoint in production —
no code changes. `ENVIRONMENT` defaults to `production` and fails closed:
production requires a strong `ADMIN_API_KEY` and non-default database
credentials. Set `ENVIRONMENT=development` for local work.

- `CORS_ORIGINS` — comma-separated allowed browser origins
  (default `http://localhost:3000`).
- `ALLOWED_HOSTS` — optional comma-separated hostnames for
  TrustedHostMiddleware.
- `TRUSTED_PROXIES` — comma-separated IPs/CIDRs whose `X-Forwarded-For` may be
  trusted. Set this to the Next.js server or load-balancer addresses so
  admin lockout and rate limits use the real client IP.
- `MIN_ADMIN_KEY_LENGTH` — minimum production admin key length (default 32).
- `INQUIRY_RATE_LIMIT_PER_MINUTE` — direct API submission limit per client IP
  (default 10; the Next proxy has its own 5/min limit).

Startup verifies that the database is reachable and that the Alembic revision
matches the codebase head; in production a mismatch aborts startup.
