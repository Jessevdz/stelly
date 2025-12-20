from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.middleware import TenantMiddleware
from app.api.v1 import sys, store, auth, admin

app = FastAPI(title=settings.PROJECT_NAME)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantMiddleware)

# Routers
app.include_router(sys.router, prefix="/api/v1/sys", tags=["System"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(store.router, prefix="/api/v1/store", tags=["Storefront"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/")
def read_root():
    return {"message": "OmniOrder API Running"}
