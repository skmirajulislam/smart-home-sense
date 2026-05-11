from typing import Dict

from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    temperature: float = Field(description="Temperature in Celsius")
    humidity: float = Field(ge=0, le=100, description="Relative humidity percentage")
    aqi: float = Field(ge=0, description="Air Quality Index")
    gas: float = Field(ge=0, description="Gas sensor value")
    motion: int = Field(ge=0, le=1, description="1 if motion detected, else 0")

    @field_validator("motion")
    @classmethod
    def validate_motion_binary(cls, value: int) -> int:
        if value not in (0, 1):
            raise ValueError("motion must be 0 or 1")
        return value


class PredictionResponse(BaseModel):
    prediction: str
    prediction_index: int | None = None
    probabilities: Dict[str, float] | None = None
    model_source: str


class ExplainResponse(BaseModel):
    prediction: str
    shap_values: Dict[str, int]
    explanation: str
    llm_source: str
    model_source: str
