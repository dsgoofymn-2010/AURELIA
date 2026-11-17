import hmac
import logging
import time
from collections import defaultdict

from fastapi import Header, HTTPException, Request

from app.config import get_settings

logger = logging.getLogger("app.auth")

# Simple in-memory rate limiter: {ip: [(timestamp, ...),]}
_failed_attempts: dict[str, list[float]] = defaultdict(list)
_MAX_FAILURES = 5
_WINDOW_SECONDS = 60.0


def reset_failed_attempts() -> None:
    _failed_attempts.clear()


def _client_ip(request: Request | None) -> str:
    if request is not None and hasattr(request, "client") and request.client:
        return request.client.host
    return "unknown"


def _is_locked_out(ip: str) -> bool:
    now = time.monotonic()
    attempts = _failed_attempts[ip]
    # Prune expired entries
    _failed_attempts[ip] = [t for t in attempts if now - t < _WINDOW_SECONDS]
    return len(_failed_attempts[ip]) >= _MAX_FAILURES


def _record_failure(ip: str) -> None:
    _failed_attempts[ip].append(time.monotonic())


def require_admin_key(
    request: Request | str | None = None,
    x_admin_key: str | None = Header(default=None),
) -> None:
    # Support both require_admin_key("my-key") and require_admin_key(request, "my-key")
    if isinstance(request, Request):
        req = request
        key = x_admin_key if isinstance(x_admin_key, str) else None
    elif isinstance(request, str):
        req = None
        key = request
    else:
        req = None
        key = x_admin_key if isinstance(x_admin_key, str) else None

    settings = get_settings()
    ip = _client_ip(req)

    if _is_locked_out(ip):
        logger.warning("Admin auth locked out for IP %s (too many failures)", ip)
        raise HTTPException(status_code=429, detail="Too many failed attempts — try again later")

    if not settings.admin_api_key or key is None:
        _record_failure(ip)
        logger.warning("Admin auth failed from IP %s: missing key", ip)
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not hmac.compare_digest(key, settings.admin_api_key):
        _record_failure(ip)
        logger.warning("Admin auth failed from IP %s: invalid key", ip)
        raise HTTPException(status_code=401, detail="Unauthorized")
