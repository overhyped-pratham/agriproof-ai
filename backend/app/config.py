from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import json

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./agriproof.db"
    planet_user_id: str = ""
    planet_api_key: str = ""
    planet_base_url: str = "https://api.planet.com/data/v1"
    sentinel_hub_client_id: str = ""
    sentinel_hub_client_secret: str = ""
    sentinel_hub_instance_id: str = ""
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    circuits_dir: str = "../circuits"
    app_env: str = "development"
    cors_origins: str = '["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]'

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        try:
            return json.loads(self.cors_origins)
        except Exception:
            return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

@lru_cache()
def get_settings():
    return Settings()
