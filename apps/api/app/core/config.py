from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OmniOrder API"
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
