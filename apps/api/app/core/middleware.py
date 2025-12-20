from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import logging

logger = logging.getLogger("uvicorn")


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Phase 1 Logic:
        1. Intercept request.
        2. Extract Host header.
        3. Print/Log for verification.
        4. (Phase 2) Resolve Tenant and SET search_path.
        """

        # 1. Read Host Header
        host = request.headers.get("host", "unknown")

        # Remove port number if present (e.g., localhost:8000 -> localhost)
        domain = host.split(":")[0]

        # 2. Log for Phase 1 Validation
        logger.info(f"Checking Tenant Resolution for Host: {domain}")

        # 3. (Future) Database Lookup would happen here
        # tenant = db.query(Tenant).filter(domain=domain).first()
        # db.execute(f"SET search_path TO {tenant.schema_name}")

        response = await call_next(request)
        return response
