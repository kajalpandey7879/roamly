from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = "Roamly Stays API"
    api_version: str = "1.0.0"
    active_guest_id: int = 1
    active_host_id: int = 2
    database_path: Path = Path(__file__).parents[2] / "stays.db"
    cors_origins: tuple[str, ...] = ("http://localhost:3000", "http://127.0.0.1:3000")


settings = Settings()
