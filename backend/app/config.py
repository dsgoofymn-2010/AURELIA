import logging
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("app.config")

_INSECURE_KEYS: set[str] = {"dev-admin-key", "changeme", "admin", ""}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "AURELIA Inquiry API"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://aurelia:aurelia@localhost:5432/aurelia"

    cors_origins: str = "http://localhost:3000"
    admin_api_key: str = ""
    min_admin_key_length: int = 32

    allowed_hosts: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_host_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]

    @model_validator(mode="after")
    def _validate_production_settings(self) -> "Settings":
        if self.environment != "development":
            if self.admin_api_key in _INSECURE_KEYS:
                raise ValueError(
                    f"ADMIN_API_KEY is insecure or empty in {self.environment} environment. "
                    f"Set a strong key (>= {self.min_admin_key_length} chars)."
                )
            if len(self.admin_api_key) < self.min_admin_key_length:
                raise ValueError(
                    f"ADMIN_API_KEY is too short ({len(self.admin_api_key)} chars, minimum {self.min_admin_key_length}) "
                    f"in {self.environment} environment."
                )
            if "aurelia:aurelia@localhost" in self.database_url:
                raise ValueError(
                    "DATABASE_URL cannot use default development credentials in production. "
                    "Configure secure database credentials."
                )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
