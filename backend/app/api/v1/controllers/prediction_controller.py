from fastapi import APIRouter, HTTPException

from .dependencies import groq_service, model_service
from ....schemas.prediction import ExplainResponse, PredictionRequest, PredictionResponse

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    try:
        prediction, prediction_index, probabilities, model_source = model_service.predict(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return PredictionResponse(
        prediction=prediction,
        prediction_index=prediction_index,
        probabilities=probabilities,
        model_source=model_source,
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain(payload: PredictionRequest) -> ExplainResponse:
    try:
        prediction, _, _, model_source = model_service.predict(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    shap_values = model_service.shap_contributions(payload)
    base_text = "Model explanation generated from current sensor contributions."
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
        base_explanation=base_text,
    )
    return ExplainResponse(
        prediction=prediction,
        shap_values=shap_values,
        explanation=explanation,
        llm_source=llm_source,
        model_source=model_source,
    )
