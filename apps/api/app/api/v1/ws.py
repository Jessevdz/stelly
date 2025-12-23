from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Tenant
from app.core.socket import manager
from app.core.config import settings  # <--- Added Import
import logging

router = APIRouter()
logger = logging.getLogger("uvicorn")


@router.websocket("/kitchen")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """
    KDS WebSocket Endpoint.
    """
    # 1. Resolve Tenant
    host = websocket.headers.get("host", "").split(":")[0]

    schema_name = None

    if host == settings.DEMO_DOMAIN:
        schema_name = settings.DEMO_SCHEMA
        logger.info(f"WS Connection: forcing demo context for {host}")
    else:
        tenant = db.query(Tenant).filter(Tenant.domain == host).first()
        if not tenant:
            logger.warning(f"WS Connection rejected: Unknown Host {host}")
            await websocket.close(code=4000, reason="Tenant not found")
            return
        schema_name = tenant.schema_name

    # 2. Connect
    await manager.connect(schema_name, websocket)
    logger.info(f"KDS Connected: {schema_name}")

    try:
        # 3. Keep connection alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(schema_name, websocket)
        logger.info(f"KDS Disconnected: {schema_name}")
