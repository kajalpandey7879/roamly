import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).parents[2] / ".env")


@dataclass(frozen=True)
class Settings:
    app_name: str = "Roamly Stays API"
    api_version: str = "1.0.0"
    active_guest_id: int = int(os.getenv("ROAMLY_ACTIVE_GUEST_ID", "1"))
    active_host_id: int = int(os.getenv("ROAMLY_ACTIVE_HOST_ID", "2"))
    default_database_path: Path = Path(__file__).parents[2] / "stays.db"
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "ROAMLY_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    )

    @property
    def database_path(self) -> Path:
        configured_path = os.getenv("ROAMLY_DATABASE_PATH")
        return Path(configured_path).expanduser() if configured_path else self.default_database_path

    @property
    def cloudinary_cloud_name(self) -> str:
        return os.getenv("CLOUDINARY_CLOUD_NAME", "")

    @property
    def cloudinary_api_key(self) -> str:
        return os.getenv("CLOUDINARY_API_KEY", "")

    @property
    def cloudinary_api_secret(self) -> str:
        return os.getenv("CLOUDINARY_API_SECRET", "")

    @property
    def smtp_host(self) -> str:
        return os.getenv("SMTP_HOST", "")

    @property
    def smtp_port(self) -> int:
        return int(os.getenv("SMTP_PORT", "587"))

    @property
    def smtp_username(self) -> str:
        return os.getenv("SMTP_USERNAME", "")

    @property
    def smtp_password(self) -> str:
        return os.getenv("SMTP_PASSWORD", "")

    @property
    def smtp_from_email(self) -> str:
        return os.getenv("SMTP_FROM_EMAIL", self.smtp_username)

    @property
    def smtp_use_tls(self) -> bool:
        return os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes"}

    @property
    def smtp_use_ssl(self) -> bool:
        return os.getenv("SMTP_USE_SSL", "false").lower() in {"1", "true", "yes"}

    @property
    def auth_otp_secret(self) -> str:
        return os.getenv("AUTH_OTP_SECRET", "roamly-local-development-secret")


settings = Settings()
