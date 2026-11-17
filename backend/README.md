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
  "project_location": "Bengaluru"
}
```
Field names accept both `projectType`/`project_type` and
`projectLocation`/`project_location` on input; responses use camelCase
(`projectType`, `projectLocation`) plus `id` and `created_at`.
Validation failures return `422`. The row is committed to PostgreSQL before
the `201` is returned.

### `GET /api/v1/inquiries?limit=50&offset=0` → `200`
Requires header `X-Admin-Key: $ADMIN_API_KEY` (locked with `401` if the key
is unset or invalid; rate-limited on failed attempts). Returns paginated results
with `items`, `total`, `offset`, and `limit`. Supports filters: `email`, `projectType`,
`createdAfter`, `createdBefore`. Responses carry `Cache-Control: no-store, private`.

### `GET /api/v1/health` → `200` (or `503` degraded)
`{"status": "ok", "database": "up"}` — checks a live `SELECT 1`. Returns HTTP 503
if database connectivity is down. Use `/api/v1/ping` for a lightweight liveness probe.

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
  tests (your dev data is untouched). Verifies persisted rows with raw SQL.
  Skips with a clear message if Docker/Postgres is down; runs with
  `ADMIN_API_KEY=test-key` regardless of `.env`.

## Configuration reference
See `.env.example`. Point `DATABASE_URL` at your RDS endpoint in production —
no code changes. `CORS_ORIGINS` lists the allowed browser origins
(default `http://localhost:3000`).
