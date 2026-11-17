import hmac
import ipaddress
import logging
import time

from fastapi import Header, HTTPException, Request, status

from app.config import Settings, get_settings

logger = logging.getLogger("app.auth")

_MAX_FAILURES = 5
_WINDOW_SECONDS = 60.0
_MAX_TRACKED_IPS = 10_000

_failed_attempts: dict[str, list[float]] = {}
_submissions: dict[str, list[float]] = {}


def reset_failed_attempts() -> None:
    _failed_attempts.clear()
    _submissions.clear()


def _prune(values: list[float], now: float, window: float) -> list[float]:
    return [t for t in values if now - t < window]


def _is_trusted_proxy(host: str, trusted: list[str]) -> bool:
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        return False
    for entry in trusted:
        try:
            if "/" in entry:
                if address in ipaddress.ip_network(entry, strict=False):
                    return True
            elif address == ipaddress.ip_address(entry):
                return True
        except ValueError:
            continue
    return False


def client_ip(request: Request | None, settings: Settings | None = None) -> str:
    if request is None or not getattr(request, "client", None):
        return "unknown"
    peer = request.client.host
    settings = settings or get_settings()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded and _is_trusted_proxy(peer, settings.trusted_proxy_list):
        candidate = forwarded.split(",")[0].strip()
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            logger.warning("Ignoring invalid X-Forwarded-For value from trusted proxy")
    return peer


def _evict_if_needed(store: dict[str, list[float]], now: float, window: float) -> None:
    if len(store) < _MAX_TRACKED_IPS:
        return
    for key in list(store):
        store[key] = _prune(store[key], now, window)
        if not store[key]:
            del store[key]
    while len(store) >= _MAX_TRACKED_IPS:
        store.pop(next(iter(store)))


def _is_locked_out(ip: str, now: float | None = None) -> bool:
    now = time.monotonic() if now is None else now
    attempts = _prune(_failed_attempts.get(ip, []), now, _WINDOW_SECONDS)
    if attempts:
        _failed_attempts[ip] = attempts
    else:
        _failed_attempts.pop(ip, None)
    return len(attempts) >= _MAX_FAILURES


def _record_failure(ip: str, now: float | None = None) -> None:
    now = time.monotonic() if now is None else now
    _evict_if_needed(_failed_attempts, now, _WINDOW_SECONDS)
    attempts = _prune(_failed_attempts.get(ip, []), now, _WINDOW_SECONDS)
    attempts.append(now)
    _failed_attempts[ip] = attempts


def check_admin_key(
    key: str | None,
    ip: str,
    settings: Settings | None = None,
) -> None:
    """Validate an admin key for a client IP.

    Kept separate from the FastAPI dependency so it can be unit-tested
    directly (the dependency itself must only receive Request/Header types).
    """
    settings = settings or get_settings()
    now = time.monotonic()

    if _is_locked_out(ip, now):
        logger.warning("Admin auth locked out for IP %s (too many failures)", ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts — try again later",
        )

    if (
        not settings.admin_api_key
        or key is None
        or not hmac.compare_digest(key.encode("utf-8"), settings.admin_api_key.encode("utf-8"))
    ):
        _record_failure(ip, now)
        logger.warning("Admin auth failed from IP %s", ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    # Successful auth clears previous failures for this IP.
    _failed_attempts.pop(ip, None)


def require_admin_key(
    request: Request,
    x_admin_key: str | None = Header(default=None),
) -> None:
    settings = get_settings()
    check_admin_key(x_admin_key, client_ip(request, settings), settings)


def rate_limit_inquiry_submission(request: Request) -> None:
    settings = get_settings()
    ip = client_ip(request, settings)
    now = time.monotonic()
    window = 60.0
    limit = max(settings.inquiry_rate_limit_per_minute, 1)

    _evict_if_needed(_submissions, now, window)
    recent = _prune(_submissions.get(ip, []), now, window)
    if len(recent) >= limit:
        logger.warning("Inquiry rate limit exceeded for IP %s", ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many submissions — try again later",
        )
    recent.append(now)
    _submissions[ip] = recent
