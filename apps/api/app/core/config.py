from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniOrder API"

    # Database
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "omniorder"
    POSTGRES_PORT: str = "5432"

    # Security - OIDC (Authentik)
    OIDC_DOMAIN: str = "http://auth.localhost"
    OIDC_CLIENT_ID: str = "omniorder-api"
    OIDC_AUDIENCE: str = "omniorder-api"
    # Internal Docker URL to reach Authentik
    JWKS_URL: str = "http://authentik-server:9000/application/o/omniorder/jwks/"
    ALGORITHM: str = "RS256"

    # Super Admins (Emails authorized to provision tenants)
    SUPER_ADMINS: List[str] = ["jesse_vdz@hotmail.com", "admin@omniorder.localhost"]

    # Security - Local (For Demo/Magic Tokens)
    SECRET_KEY: str = "538422cb-34b7-48a8-8fcc-8c28b6bc21d3"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Demo Mode Configuration
    DEMO_DOMAIN: str = "demo.omniorder.localhost"
    DEMO_ACCESS_CODE: str = "OMNI2025"
    DEMO_SCHEMA: str = "tenant_demo"

    # Storage (MinIO/S3)
    S3_ENDPOINT: str = "http://minio:9000"  # Internal Docker URL
    S3_PUBLIC_ENDPOINT: str = "http://localhost:9000"  # Browser accessible URL
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "omniorder-assets"
    S3_REGION: str = "us-east-1"

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True


settings = Settings()
