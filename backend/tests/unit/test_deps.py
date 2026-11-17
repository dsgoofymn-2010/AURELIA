import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.api import deps
from app.config import Settings

CORRECT = "correct-key"


@pytest.fixture(autouse=True)
def _reset_limits():
    deps.reset_failed_attempts()
    yield
    deps.reset_failed_attempts()


def settings(**overrides) -> Settings:
    kwargs = {"environment": "development", "admin_api_key": CORRECT}
    kwargs.update(overrides)
    return Settings(_env_file=None, **kwargs)


def make_request(peer: str = "203.0.113.10", xff: str | None = None) -> Request:
    headers = [(b"x-forwarded-for", xff.encode())] if xff else []
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/inquiries",
        "headers": headers,
        "client": (peer, 12345),
    }
    return Request(scope)


def test_correct_key_passes():
    assert deps.check_admin_key(CORRECT, "test-ip", settings()) is None


def test_wrong_key_rejected():
    with pytest.raises(HTTPException) as exc:
        deps.check_admin_key("wrong-key", "test-ip", settings())
    assert exc.value.status_code == 401


def test_missing_header_rejected():
    with pytest.raises(HTTPException) as exc:
        deps.check_admin_key(None, "test-ip", settings())
    assert exc.value.status_code == 401


def test_everyone_rejected_when_key_not_configured():
    with pytest.raises(HTTPException) as exc:
        deps.check_admin_key(CORRECT, "test-ip", settings(admin_api_key=""))
    assert exc.value.status_code == 401


def test_lockout_after_repeated_failures():
    for _ in range(deps._MAX_FAILURES):
        with pytest.raises(HTTPException) as exc:
            deps.check_admin_key("wrong-key", "test-ip", settings())
        assert exc.value.status_code == 401
    with pytest.raises(HTTPException) as exc:
        deps.check_admin_key(CORRECT, "test-ip", settings())
    assert exc.value.status_code == 429


def test_success_clears_previous_failures():
    for _ in range(deps._MAX_FAILURES - 1):
        with pytest.raises(HTTPException):
            deps.check_admin_key("wrong-key", "test-ip", settings())
    assert deps.check_admin_key(CORRECT, "test-ip", settings()) is None
    for _ in range(deps._MAX_FAILURES - 1):
        with pytest.raises(HTTPException) as exc:
            deps.check_admin_key("wrong-key", "test-ip", settings())
        assert exc.value.status_code == 401


def test_lockout_is_scoped_per_ip():
    for _ in range(deps._MAX_FAILURES):
        with pytest.raises(HTTPException):
            deps.check_admin_key("wrong-key", "bad-ip", settings())
    assert deps.check_admin_key(CORRECT, "other-ip", settings()) is None


def test_forwarded_for_ignored_for_untrusted_peer():
    request = make_request(peer="203.0.113.10", xff="198.51.100.7")
    assert deps.client_ip(request, settings()) == "203.0.113.10"


def test_forwarded_for_used_for_trusted_proxy():
    request = make_request(peer="10.0.0.5", xff="198.51.100.7")
    assert deps.client_ip(request, settings(trusted_proxies="10.0.0.5")) == "198.51.100.7"


def test_submission_rate_limit(monkeypatch):
    monkeypatch.setattr(
        deps,
        "get_settings",
        lambda: settings(inquiry_rate_limit_per_minute=2),
    )
    request = make_request(peer="203.0.113.20")
    deps.rate_limit_inquiry_submission(request)
    deps.rate_limit_inquiry_submission(request)
    with pytest.raises(HTTPException) as exc:
        deps.rate_limit_inquiry_submission(request)
    assert exc.value.status_code == 429
