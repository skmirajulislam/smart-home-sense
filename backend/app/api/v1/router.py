from fastapi import APIRouter

from .controllers.health_controller import router as health_router
from .controllers.prediction_controller import router as prediction_router
from .controllers.telemetry_controller import router as telemetry_router

router = APIRouter()
router.include_router(health_router, tags=["health"])
router.include_router(prediction_router, prefix="/predictions", tags=["predictions"])
router.include_router(telemetry_router, prefix="/telemetry", tags=["telemetry"])
