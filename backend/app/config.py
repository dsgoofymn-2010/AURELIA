from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "AURELIA Inquiry API"
    environment: str = "development"

    database_url: str = "postgresql+asyncpg://aurelia:aurelia@localhost:5432/aurelia"

    cors_origins: str = "http://localhost:5173"
    admin_api_key: str = ""

    ses_region: str = "ap-south-1"
    ses_from_address: str = "sales@aurelia-residences.com"
    notify_to: str = "sales@aurelia-residences.com"
    email_enabled: bool = True
    # Optional local fake-SES override (e.g. http://127.0.0.1:5000) for
    # development without AWS. Empty = real Amazon SES.
    ses_endpoint_url: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
