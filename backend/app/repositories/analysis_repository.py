from sqlalchemy.orm import Session

from backend.app.db.models import AnalysisEvent


class AnalysisRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_result(
        self,
        room_id: str,
        prediction: str,
        severity: str,
        model_source: str,
        shap_values: dict[str, int],
        explanation: str,
        llm_source: str,
    ) -> AnalysisEvent:
        item = AnalysisEvent(
            room_id=room_id,
            prediction=prediction,
            severity=severity,
            model_source=model_source,
            shap_values=shap_values,
            explanation=explanation,
            llm_source=llm_source,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
