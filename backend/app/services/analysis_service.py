import time
from dataclasses import dataclass

from sqlalchemy.orm import Session

from ..repositories.analysis_repository import AnalysisRepository
from ..repositories.telemetry_repository import TelemetryRepository
from ..schemas.prediction import PredictionRequest
from ..schemas.telemetry import AnalyzeRoomResult, AnalysisTrace, ModelInputTrace, RoomInsight, SummarizerInputTrace, TelemetrySnapshot
from ..services.groq_service import GroqService
from ..services.model_service import ModelService


SEVERITY_BY_PREDICTION = {"Safe": "info", "Warning": "warning", "Danger": "critical"}


@dataclass
class AnalyzeResult:
    prediction: str
    prediction_index: int | None
    probabilities: dict[str, float] | None
    model_source: str
    shap_values: dict[str, int]
    explanation: str
    llm_source: str
    ai_analyzed: bool


class AnalysisService:
    def __init__(self, db: Session, model_service: ModelService, groq_service: GroqService):
        self.db = db
        self.model_service = model_service
        self.groq_service = groq_service
        self.telemetry_repo = TelemetryRepository(db)
        self.analysis_repo = AnalysisRepository(db)

    @staticmethod
    def derive_gas(snapshot: TelemetrySnapshot) -> float:
        if snapshot.sensors.gas is not None:
            return float(snapshot.sensors.gas)
        door_factor = 25 if snapshot.sensors.door == 0 else -10
        derived = max(0.0, round(snapshot.sensors.airQuality * 1.2 + door_factor, 2))
        # Clamp to expected frontend range [0, 1000]
        return min(derived, 1000.0)

    @staticmethod
    def _base_explanation(prediction: str, shap_values: dict[str, int], motion: int) -> str:
        non_zero = [item for item in shap_values.items() if item[1] > 0]
        if prediction == "Safe" or not non_zero:
            return "All major environmental signals are in the safe range."

        top_signals = [name for name, _ in sorted(non_zero, key=lambda item: item[1], reverse=True)[:2]]
        pair = " and ".join(top_signals)
        if prediction == "Danger":
            prefix = f"Elevated {pair} are the primary drivers of dangerous conditions."
        else:
            prefix = f"Rising {pair} are the main reasons behind the warning state."
        if motion == 0:
            return f"{prefix} No motion also suggests poor ventilation in a closed room."
        return prefix

    @staticmethod
    def _insight_from_prediction(
        room_id: str,
        prediction: str,
        explanation: str,
        shap_values: dict[str, int],
    ) -> RoomInsight:
        severity = SEVERITY_BY_PREDICTION.get(prediction, "warning")
        timestamp = int(time.time() * 1000)
        sensor_map = {
            "aqi": "airQuality",
            "gas": "gas",
            "temperature": "temperature",
            "humidity": "humidity",
            "motion": "motion",
        }
        contributors = []
        for key, value in shap_values.items():
            if value <= 0:
                continue
            mapped = sensor_map.get(key)
            if mapped and mapped not in contributors:
                contributors.append(mapped)

        event_map = {
            "Danger": "Dangerous Environment Detected",
            "Warning": "Environmental Warning",
            "Safe": "All Systems Normal",
        }
        impact_map = {
            "critical": "Immediate health and safety risk if this condition continues.",
            "warning": "Reduced comfort and potential risk for sensitive occupants.",
            "info": "Environment remains stable and safe.",
        }
        action_map = {
            "critical": "Increase ventilation and inspect room conditions immediately.",
            "warning": "Monitor sensor trends and improve airflow if needed.",
            "info": "No action required. Continue monitoring.",
        }

        return RoomInsight(
            id=f"insight-{room_id}-{timestamp}",
            roomId=room_id,
            event=event_map.get(prediction, "Environment Update"),
            reasoning=explanation,
            impact=impact_map[severity],
            suggestion=action_map[severity],
            contributingSensors=contributors,
            timestamp=timestamp,
            severity=severity,
        )

    async def analyze_snapshot(self, snapshot: TelemetrySnapshot) -> AnalyzeRoomResult:
        gas = self.derive_gas(snapshot)
        self.telemetry_repo.save_snapshot(snapshot, gas)

        payload = PredictionRequest(
            temperature=snapshot.sensors.temperature,
            humidity=snapshot.sensors.humidity,
            aqi=snapshot.sensors.airQuality,
            gas=gas,
            motion=snapshot.sensors.motion,
        )
        model_input = ModelInputTrace(
            temperature=payload.temperature,
            humidity=payload.humidity,
            aqi=payload.aqi,
            gas=payload.gas,
            motion=payload.motion,
        )
        prediction, prediction_index, probabilities, model_source = self.model_service.predict(payload)
        shap_values = self.model_service.shap_contributions(payload)
        base_explanation = self._base_explanation(prediction, shap_values, payload.motion)
        summarizer_input = SummarizerInputTrace(
            prediction=prediction,
            shapValues=shap_values,
            inputSensors=model_input,
            draftExplanation=base_explanation,
        )

        ai_analyzed = prediction != "Safe"
        if ai_analyzed:
            final_explanation, llm_source = await self.groq_service.explain(
                prediction=prediction,
                shap_values=shap_values,
                input_payload=model_input.model_dump(),
                base_explanation=base_explanation,
            )
        else:
            final_explanation = base_explanation
            llm_source = "skipped_safe_prediction"

        insight = self._insight_from_prediction(snapshot.roomId, prediction, final_explanation, shap_values)

        self.analysis_repo.save_result(
            room_id=snapshot.roomId,
            prediction=prediction,
            severity=insight.severity,
            model_source=model_source,
            shap_values=shap_values,
            explanation=final_explanation,
            llm_source=llm_source,
        )

        return AnalyzeRoomResult(
            roomId=snapshot.roomId,
            prediction=prediction,
            predictionIndex=prediction_index,
            probabilities=probabilities,
            modelSource=model_source,
            llmSource=llm_source,
            aiAnalyzed=ai_analyzed,
            shapValues=shap_values,
            sensors=snapshot.sensors.model_copy(update={"gas": gas}),
            insight=insight,
            trace=AnalysisTrace(
                modelInput=model_input,
                summarizerInput=summarizer_input,
                summarizerOutput=final_explanation,
            ),
        )
