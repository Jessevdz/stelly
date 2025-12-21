import redis
from fastapi import HTTPException, Request, status
from app.core.config import settings

# Initialize Redis Pool
pool = redis.ConnectionPool(
    host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0, decode_responses=True
)
redis_client = redis.Redis(connection_pool=pool)


class RateLimiter:
    """
    Rolling window rate limiter based on Client IP.
    """

    def __init__(self, times: int = 3, seconds: int = 60):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request: Request):
        # Resolve real IP behind Nginx
        client_ip = request.headers.get("x-forwarded-for") or request.client.host

        # Unique key per IP + Endpoint path
        key = f"rate_limit:{client_ip}:{request.url.path}"

        # Check current count
        current_count = redis_client.get(key)

        if current_count and int(current_count) >= self.times:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many orders placed. Please wait a moment.",
            )

        # Increment and set expiry if new
        pipe = redis_client.pipeline()
        pipe.incr(key)
        if not current_count:
            pipe.expire(key, self.seconds)
        pipe.execute()
