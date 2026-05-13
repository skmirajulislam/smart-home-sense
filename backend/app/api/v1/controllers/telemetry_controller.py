from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .dependencies import groq_service, model_service
from ....db.session import get_db
from ....schemas.telemetry import (
    AnalyzeTelemetryRequest,
    AnalyzeTelemetryResponse,
    IngestTelemetryRequest,
    IngestTelemetryResponse,
)
from ....services.analysis_service import AnalysisService

router = APIRouter()


@router.post("/ingest", response_model=IngestTelemetryResponse)
async def ingest_telemetry(payload: IngestTelemetryRequest, db: Session = Depends(get_db)) -> IngestTelemetryResponse:
    service = AnalysisService(db=db, model_service=model_service, groq_service=groq_service)
    service.telemetry_repo.save_snapshot(payload.snapshot, service.derive_gas(payload.snapshot))
    return IngestTelemetryResponse(accepted=True)


@router.post("/analyze", response_model=AnalyzeTelemetryResponse)
async def analyze_telemetry(
    payload: AnalyzeTelemetryRequest,
    db: Session = Depends(get_db),
) -> AnalyzeTelemetryResponse:
    service = AnalysisService(db=db, model_service=model_service, groq_service=groq_service)
    results = []
    try:
        for snapshot in payload.snapshots:
            result = await service.analyze_snapshot(snapshot)
            results.append(result)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return AnalyzeTelemetryResponse(results=results)
