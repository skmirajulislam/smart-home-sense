import os
from typing import Dict

import joblib
import numpy as np
import pandas as pd

from ..core.config import settings
from ..schemas.prediction import PredictionRequest
from .safety_service import SafetyService

FEATURE_ORDER = ["temperature", "humidity", "motion", "gas", "aqi"]
CLASS_LABELS = {0: "Safe", 1: "Warning", 2: "Danger"}


class ModelService:
    def __init__(self) -> None:
        self.model_path = settings.model_path
        self.model = None
        self.feature_order = FEATURE_ORDER.copy()
        self.feature_median: Dict[str, float] = {}
        self.feature_iqr: Dict[str, float] = {}
        self.feature_importance: Dict[str, float] = {}
        self.model_loaded = False
        self._load_model()

    def _load_model(self) -> None:
        if not os.path.isfile(self.model_path):
            self.model_loaded = False
            self.model = None
            return
        loaded = joblib.load(self.model_path)
        if isinstance(loaded, dict) and "model" in loaded:
            self.model = loaded["model"]
            self.feature_order = list(loaded.get("feature_order") or FEATURE_ORDER)
            self.feature_median = {k: float(v) for k, v in (loaded.get("feature_median") or {}).items()}
            self.feature_iqr = {k: float(v) for k, v in (loaded.get("feature_iqr") or {}).items()}
            self.feature_importance = {k: float(v) for k, v in (loaded.get("feature_importance") or {}).items()}
        else:
            self.model = loaded
            self.feature_order = FEATURE_ORDER.copy()
            self.feature_median = {}
            self.feature_iqr = {}
            self.feature_importance = {}
        self.model_loaded = True

    @staticmethod
    def _map_frontend_to_dataset_scale(value: float, frontend_max: float) -> float:
        # Dataset uses 100..3500 scale for aqi/gas, while frontend emits lower ranges.
        # Always clamp to frontend range, then scale - no pass-through gap
        dataset_min, dataset_max = 100.0, 3500.0
        clipped = max(0.0, min(value, frontend_max))
        return dataset_min + (clipped / frontend_max) * (dataset_max - dataset_min)

    def _normalized_feature_values(self, payload: PredictionRequest) -> dict[str, float]:
        values = {feature: float(getattr(payload, feature)) for feature in self.feature_order}
        if "aqi" in values:
            values["aqi"] = self._map_frontend_to_dataset_scale(values["aqi"], frontend_max=500.0)
        if "gas" in values:
            values["gas"] = self._map_frontend_to_dataset_scale(values["gas"], frontend_max=1000.0)
        if "motion" in values:
            values["motion"] = float(int(round(values["motion"])))
        return values

    def _to_feature_vector(self, payload: PredictionRequest) -> pd.DataFrame:
        normalized = self._normalized_feature_values(payload)
        values = [normalized[feature] for feature in self.feature_order]
        return pd.DataFrame([values], columns=self.feature_order, dtype=float)

    def predict(self, payload: PredictionRequest) -> tuple[str, int | None, Dict[str, float] | None, str]:
        if not self.model_loaded or self.model is None:
            raise RuntimeError(f"Model not loaded from '{self.model_path}'. Train it with backend/models/model.py first.")
        vector = self._to_feature_vector(payload)
        prediction_raw = self.model.predict(vector)[0]
        prediction, prediction_index = self._normalize_prediction(prediction_raw)
        probabilities = self._predict_probabilities(vector)
        
        # If model returned textual label without index, map it to class index when possible
        if prediction_index is None:
            for idx, label in CLASS_LABELS.items():
                if label.lower() == prediction.lower():
                    prediction_index = idx
                    break

        # Apply safety overrides
        final_prediction, was_overridden = SafetyService.apply_safety_overrides(payload, prediction)
        
        # Update prediction_index to match final prediction if overridden
        if was_overridden:
            for idx, label in CLASS_LABELS.items():
                if label == final_prediction:
                    prediction_index = idx
                    break
        
        return final_prediction, prediction_index, probabilities, "trained_dataset_model"

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

    def shap_contributions(self, payload: PredictionRequest) -> dict[str, int]:
        if not self.feature_order:
            return {}

        normalized = self._normalized_feature_values(payload)
        raw_scores: dict[str, float] = {}
        for feature in self.feature_order:
            value = normalized[feature]
            weight = self.feature_importance.get(feature, 1.0)
            if feature == "motion":
                signal = float(int(round(value)))
            else:
                median = self.feature_median.get(feature, 0.0)
                iqr = self.feature_iqr.get(feature, 1.0)
                if iqr == 0:
                    iqr = 1.0
                signal = max(0.0, (value - median) / iqr)
            raw_scores[feature] = signal * max(weight, 0.0001)

        total = sum(raw_scores.values())
        if total <= 0:
            return {feature: 0 for feature in self.feature_order}

        percentages = {
            feature: int(round((score / total) * 100))
            for feature, score in sorted(raw_scores.items(), key=lambda item: item[1], reverse=True)
        }
        return percentages
