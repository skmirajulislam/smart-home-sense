import os
from typing import Dict

import joblib
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.schemas.prediction import PredictionRequest

FEATURE_ORDER = ["temperature", "humidity", "motion", "gas", "aqi"]
CLASS_LABELS = {0: "Safe", 1: "Warning", 2: "Danger"}


class ModelService:
    def __init__(self) -> None:
        self.model_path = settings.model_path
        self.model = None
        self.model_loaded = False
        self._load_model()

    def _load_model(self) -> None:
        if not os.path.isfile(self.model_path):
            self.model_loaded = False
            self.model = None
            return
        self.model = joblib.load(self.model_path)
        self.model_loaded = True

    @staticmethod
    def _to_feature_vector(payload: PredictionRequest) -> pd.DataFrame:
        values = [getattr(payload, feature) for feature in FEATURE_ORDER]
        return pd.DataFrame([values], columns=FEATURE_ORDER, dtype=float)

    def predict(self, payload: PredictionRequest) -> tuple[str, int | None, Dict[str, float] | None, str]:
        if self.model_loaded:
            vector = self._to_feature_vector(payload)
            prediction_raw = self.model.predict(vector)[0]
            prediction, prediction_index = self._normalize_prediction(prediction_raw)
            probabilities = self._predict_probabilities(vector)
            return prediction, prediction_index, probabilities, "pkl"
        prediction, prediction_index = self._rule_based_prediction(payload)
        return prediction, prediction_index, None, "rule_based_fallback"

    def _predict_probabilities(self, feature_vector: pd.DataFrame) -> Dict[str, float] | None:
        if not hasattr(self.model, "predict_proba"):
            return None
        probabilities = self.model.predict_proba(feature_vector)[0]
        classes = getattr(self.model, "classes_", None)
        if classes is None:
            return None
        result: Dict[str, float] = {}
        for class_value, score in zip(classes, probabilities):
            class_name, _ = self._normalize_prediction(class_value)
            result[class_name] = round(float(score), 4)
        return result

    @staticmethod
    def _normalize_prediction(raw_prediction) -> tuple[str, int | None]:
        if isinstance(raw_prediction, (int, np.integer)):
            idx = int(raw_prediction)
            return CLASS_LABELS.get(idx, str(idx)), idx
        text = str(raw_prediction).strip()
        if text.isdigit():
            idx = int(text)
            return CLASS_LABELS.get(idx, text), idx
        lowered = text.lower()
        if lowered in {"safe", "warning", "danger"}:
            return lowered.capitalize(), None
        if lowered == "normal":
            return "Safe", None
        return text, None

    @staticmethod
    def _rule_based_prediction(payload: PredictionRequest) -> tuple[str, int]:
        score = 0
        if payload.temperature >= 35:
            score += 2
        elif payload.temperature >= 30:
            score += 1
        if payload.humidity >= 80:
            score += 2
        elif payload.humidity >= 65:
            score += 1
        if payload.aqi >= 150:
            score += 2
        elif payload.aqi >= 100:
            score += 1
        if payload.gas >= 220:
            score += 2
        elif payload.gas >= 140:
            score += 1
        if payload.motion == 0 and (payload.temperature >= 30 or payload.aqi >= 100 or payload.gas >= 140):
            score += 1

        if score >= 6:
            return "Danger", 2
        if score >= 3:
            return "Warning", 1
        return "Safe", 0

    @staticmethod
    def shap_contributions(payload: PredictionRequest) -> dict[str, int]:
        contributions = {
            "temperature": max(0.0, payload.temperature - 30.0) * 2.0,
            "humidity": max(0.0, payload.humidity - 60.0) * 1.2,
            "aqi": max(0.0, payload.aqi - 100.0) * 0.8,
            "gas": max(0.0, payload.gas - 120.0) * 0.7,
        }
        total = sum(contributions.values())
        if total <= 0:
            return {key: 0 for key in contributions}
        return {
            key: int(round((value / total) * 100))
            for key, value in sorted(contributions.items(), key=lambda item: item[1], reverse=True)
        }
