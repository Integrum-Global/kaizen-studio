"""
Kaizen Studio Configuration Management

Centralizes application settings with environment-based configuration.
Uses Pydantic Settings for type-safe configuration.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings with environment variable support.

    Loads configuration from environment variables with sensible defaults.
    """

    # Application
    app_name: str = "Kaizen Studio"
    environment: str = "development"
    debug: bool = False
    version: str = "0.1.0"

    # Database Configuration
    database_url: str = (
        "postgresql://kaizen_dev:kaizen_dev_password@localhost:5432/kaizen_studio_dev"
    )
    database_pool_size: int = 10
    database_max_overflow: int = 20

    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    redis_expire_seconds: int = 3600

    # JWT Authentication - RS256 algorithm
    jwt_secret_key: str = (
        "dev_secret_key_change_in_production_must_be_at_least_32_chars"
    )
    jwt_algorithm: str = "RS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # RSA Keys for RS256 (load from environment or files)
    jwt_private_key: str = ""
    jwt_public_key: str = ""

    # API Configuration
    api_prefix: str = "/api/v1"
    api_rate_limit: int = 100

    # CORS Configuration
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Performance Targets
    api_response_target_ms: int = 100
    database_query_target_ms: int = 50

    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # SSO / Encryption
    encryption_key: str = ""  # Fernet key for encrypting secrets (required for SSO)
    credential_encryption_key: str = (
        ""  # Fernet key for encrypting external agent credentials
    )

    # Azure AD Multi-Tenant SSO Configuration
    azure_client_id: str = ""
    azure_client_secret: str = ""
    azure_tenant_id: str = "common"  # "common" for multi-tenant

    # Google OAuth 2.0 SSO Configuration
    google_client_id: str = ""
    google_client_secret: str = ""

    # Okta OAuth 2.0/OIDC SSO Configuration
    okta_client_id: str = ""
    okta_client_secret: str = ""
    okta_domain: str = ""  # e.g., "dev-12345.okta.com"

    # Audit
    audit_enabled: bool = True
    audit_retention_days: int = 90

    # Metrics
    metrics_enabled: bool = True
    prometheus_enabled: bool = True

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v):
        """Validate environment is one of allowed values."""
        allowed = ["development", "testing", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret(cls, v):
        """Ensure JWT secret has minimum length."""
        if len(v) < 32:
            raise ValueError("JWT secret key must be at least 32 characters")
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """
    Get application settings with caching.

    Uses LRU cache to avoid reloading settings on every call.
    """
    return Settings()


def get_database_url(test: bool = False) -> str:
    """
    Get database URL for application or testing.

    Args:
        test: If True, returns test database URL

    Returns:
        Database connection URL
    """
    settings = get_settings()

    if test:
        url = settings.database_url
        # Already a test database - return as-is to avoid doubling _test suffix
        if "kaizen_studio_test" in url:
            return url
        if "kaizen_studio_dev" in url:
            return url.replace("kaizen_studio_dev", "kaizen_studio_test")
        elif "kaizen_studio" in url:
            return url.replace("kaizen_studio", "kaizen_studio_test")
        else:
            return (
                "postgresql://test_user:test_password@localhost:5433/kaizen_studio_test"
            )

    return settings.database_url


def get_redis_url(test: bool = False) -> str:
    """
    Get Redis URL for application or testing.

    Args:
        test: If True, returns test Redis URL

    Returns:
        Redis connection URL
    """
    settings = get_settings()

    if test:
        # Use same Redis as production but select database 1 for tests
        # This allows tests to run without a separate Redis instance
        url = settings.redis_url
        # Select database 1 for testing (default is database 0)
        if "?" in url:
            return f"{url}&db=1"
        else:
            return f"{url}/1"

    return settings.redis_url


def is_production() -> bool:
    """Check if running in production environment."""
    return get_settings().environment == "production"


def is_development() -> bool:
    """Check if running in development environment."""
    return get_settings().environment == "development"


def is_testing() -> bool:
    """Check if running in testing environment."""
    return get_settings().environment == "testing"


__all__ = [
    "Settings",
    "get_settings",
    "get_database_url",
    "get_redis_url",
    "is_production",
    "is_development",
    "is_testing",
]
