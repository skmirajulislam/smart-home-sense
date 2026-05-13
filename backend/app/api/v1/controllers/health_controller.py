from fastapi import APIRouter

from .dependencies import model_service
from ....core.config import settings
from ....schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=model_service.model_loaded,
        model_path=model_service.model_path,
        database=settings.database_url,
    )
