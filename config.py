from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///challenge_hub.db"
    default_max_team_size: int = 4
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"


settings = Settings()
