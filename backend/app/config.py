"""
Central configuration for the Code Complexity Predictor backend.

All secrets are read from environment variables — see .env.example.
Nothing here is a real credential; missing values fall back to safe
placeholders so the app boots in dev mode without external services.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "Code Complexity Predictor"
    ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # --- CORS ---
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # --- MongoDB ---
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "code_complexity_predictor"

    # --- Firebase ---
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_JSON: str = ""

    # --- OpenAI AI ---
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-5.6-luna"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 3600

    # --- Web Push Notifications ---
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "admin@example.com"

    # --- Code Analysis ---
    MAX_CODE_SIZE_BYTES: int = 500 * 1024

    SUPPORTED_LANGUAGES: str = (
        "python,java,c,cpp,javascript,php,typescript"
    )

    # --- Admin ---
    ADMIN_EMAILS: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def supported_languages(self) -> list[str]:
        return [
            language.strip()
            for language in self.SUPPORTED_LANGUAGES.split(",")
            if language.strip()
        ]

    @property
    def admin_emails(self) -> list[str]:
        return [
            email.strip().lower()
            for email in self.ADMIN_EMAILS.split(",")
            if email.strip()
        ]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()