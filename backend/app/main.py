from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api.router import router as api_router
from .core.config import settings
from .core.rate_limiter import RateLimitMiddleware
from .core.security import SecurityHeadersMiddleware
from .db.base import create_schema


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_schema()
    yield


app = FastAPI(
    title="Smart Home Sense API",
    description="IoT telemetry analysis backend with model prediction and explanation services.",
    version="0.2.0",
    lifespan=lifespan,
)
create_schema()

# Ensure CORSMiddleware runs early so preflight OPTIONS are handled before
# other custom middleware (rate limiting, security headers, trusted hosts).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_window=settings.rate_limit_requests_per_minute,
    window_seconds=60,
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

app.include_router(api_router)
