from fastapi import HTTPException

from app.config import get_settings


def require_admin_key(x_admin_key: str | None) -> None:
    settings = get_settings()
    if not settings.admin_api_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")
