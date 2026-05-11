from fastapi import APIRouter

from backend.app.api.v1.controllers.dependencies import groq_service, model_service
from backend.app.core.config import settings
from backend.app.schemas.health import HealthResponse
from backend.app.schemas.prediction import ExplainResponse, PredictionRequest, PredictionResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=model_service.model_loaded,
        model_path=model_service.model_path,
        database=settings.database_url,
    )


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    prediction, prediction_index, probabilities, model_source = model_service.predict(payload)
    return PredictionResponse(
        prediction=prediction,
        prediction_index=prediction_index,
        probabilities=probabilities,
        model_source=model_source,
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain(payload: PredictionRequest) -> ExplainResponse:
    prediction, _, _, model_source = model_service.predict(payload)
    shap_values = model_service.shap_contributions(payload)
    explanation, llm_source = await groq_service.explain(
        prediction=prediction,
        shap_values=shap_values,
        input_payload={
            "temperature": payload.temperature,
            "humidity": payload.humidity,
            "aqi": payload.aqi,
            "gas": payload.gas,
            "motion": payload.motion,
        },
        base_explanation="Model explanation generated from current sensor contributions.",
    )
    return ExplainResponse(
        prediction=prediction,
        shap_values=shap_values,
        explanation=explanation,
        llm_source=llm_source,
        model_source=model_source,
    )
