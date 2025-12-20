from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.middleware import TenantMiddleware

app = FastAPI(title=settings.PROJECT_NAME)

# 1. Add Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantMiddleware)


# 2. Basic Routes
@app.get("/")
def read_root():
    return {"message": "OmniOrder API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "api"}
