from typing import Dict

from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    temperature: float = Field(ge=-50, le=60, description="Temperature in Celsius (-50 to 60°C)")
    humidity: float = Field(ge=0, le=100, description="Relative humidity percentage (0-100%)")
    aqi: float = Field(ge=0, le=500, description="Air Quality Index (0-500)")
    gas: float = Field(ge=0, le=5000, description="Gas sensor value (0-5000)")
    motion: int = Field(ge=0, le=1, description="1 if motion detected, else 0")

    @field_validator("motion")
    @classmethod
    def validate_motion_binary(cls, value: int) -> int:
        if value not in (0, 1):
            raise ValueError("motion must be 0 or 1")
        return value

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, value: float) -> float:
        if not -50 <= value <= 60:
            raise ValueError("temperature must be between -50 and 60 Celsius")
        return value

    @field_validator("humidity")
    @classmethod
    def validate_humidity(cls, value: float) -> float:
        if not 0 <= value <= 100:
            raise ValueError("humidity must be between 0 and 100 percent")
        return value

    @field_validator("aqi")
    @classmethod
    def validate_aqi(cls, value: float) -> float:
        if not 0 <= value <= 500:
            raise ValueError("aqi must be between 0 and 500")
        return value

    @field_validator("gas")
    @classmethod
    def validate_gas(cls, value: float) -> float:
        if not 0 <= value <= 5000:
            raise ValueError("gas must be between 0 and 5000")
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
