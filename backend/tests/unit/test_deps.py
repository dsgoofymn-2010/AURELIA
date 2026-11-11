import pytest
from fastapi import HTTPException

from app.api.deps import require_admin_key
from app.config import Settings

CORRECT = "correct-key"


def require(key, **settings_overrides):
    kwargs = {"admin_api_key": CORRECT}
    kwargs.update(settings_overrides)
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(
            "app.api.deps.get_settings",
            lambda: Settings(**kwargs),
        )
        return require_admin_key(key)


def test_correct_key_passes():
    assert require(CORRECT) is None


def test_wrong_key_rejected():
    with pytest.raises(HTTPException) as exc:
        require("wrong-key")
    assert exc.value.status_code == 401


def test_missing_header_rejected():
    with pytest.raises(HTTPException) as exc:
        require(None)
    assert exc.value.status_code == 401


def test_everyone_rejected_when_key_not_configured():
    with pytest.raises(HTTPException) as exc:
        require(CORRECT, admin_api_key="")
    assert exc.value.status_code == 401
