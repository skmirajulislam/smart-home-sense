import os
from typing import Dict, Optional, Tuple

import joblib
import numpy as np

from .schemas import PredictionRequest


FEATURE_ORDER = ["temperature", "humidity", "aqi", "gas", "motion"]
CLASS_LABELS = {0: "Safe", 1: "Warning", 2: "Danger"}


class ModelService:
    def __init__(self) -> None:
        self.model_path = os.getenv("MODEL_PATH", "backend/models/smart_home_model.pkl")
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
    def _to_feature_vector(payload: PredictionRequest) -> np.ndarray:
        values = [getattr(payload, feature) for feature in FEATURE_ORDER]
        return np.array(values, dtype=float).reshape(1, -1)

    def predict(self, payload: PredictionRequest) -> Tuple[str, Optional[int], Optional[Dict[str, float]], str]:
        if self.model_loaded:
            feature_vector = self._to_feature_vector(payload)
            prediction_raw = self.model.predict(feature_vector)[0]
            prediction, prediction_index = self._normalize_prediction(prediction_raw)
            probabilities = self._predict_probabilities(feature_vector)
            return prediction, prediction_index, probabilities, "pkl"

        prediction, prediction_index = self._rule_based_prediction(payload)
        return prediction, prediction_index, None, "rule_based_fallback"

    def _predict_probabilities(self, feature_vector: np.ndarray) -> Optional[Dict[str, float]]:
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
    def _normalize_prediction(raw_prediction) -> Tuple[str, Optional[int]]:
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
        return text, None

    @staticmethod
    def _rule_based_prediction(payload: PredictionRequest) -> Tuple[str, int]:
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
    def explain(payload: PredictionRequest, prediction: str) -> Tuple[Dict[str, int], str]:
        contributions = {
            "temperature": max(0.0, payload.temperature - 30.0) * 2.0,
            "humidity": max(0.0, payload.humidity - 60.0) * 1.2,
            "aqi": max(0.0, payload.aqi - 100.0) * 0.8,
            "gas": max(0.0, payload.gas - 120.0) * 0.7,
        }

        total = sum(contributions.values())
        if total <= 0:
            shap_values = {key: 0 for key in contributions}
        else:
            shap_values = {
                key: int(round((value / total) * 100))
                for key, value in sorted(contributions.items(), key=lambda item: item[1], reverse=True)
            }

        explanation = ModelService._build_explanation(shap_values, prediction, payload.motion)
        return shap_values, explanation

    @staticmethod
    def _build_explanation(shap_values: Dict[str, int], prediction: str, motion: int) -> str:
        non_zero = [item for item in shap_values.items() if item[1] > 0]
        if prediction == "Safe" or not non_zero:
            return "All major environmental signals are in the safe range."

        top_signals = [name for name, _ in sorted(non_zero, key=lambda item: item[1], reverse=True)[:2]]
        signal_text = " and ".join(top_signals)

        if prediction == "Danger":
            base = f"Elevated {signal_text} are the primary drivers of dangerous conditions."
        else:
            base = f"Rising {signal_text} are the main reasons behind the warning state."

        if motion == 0:
            return f"{base} No motion also suggests poor ventilation in a closed room."
        return base
