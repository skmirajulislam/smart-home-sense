from typing import Literal

from pydantic import BaseModel, Field


class TelemetrySensors(BaseModel):
    temperature: float = Field(ge=-50, le=60, description="Temperature in Celsius (-50 to 60°C)")
    humidity: float = Field(ge=0, le=100, description="Relative humidity percentage (0-100%)")
    airQuality: float = Field(ge=0, le=500, description="Air Quality Index (0-500)")
    motion: int = Field(ge=0, le=1, description="Motion sensor (0 or 1)")
    light: float = Field(ge=0, le=10000, description="Light level in lux (0-10000)")
    door: int = Field(ge=0, le=1, description="Door sensor (0 or 1)")
    gas: float | None = Field(default=None, ge=0, le=5000, description="Gas sensor value (0-5000)")


class TelemetrySnapshot(BaseModel):
    roomId: str = Field(min_length=1, max_length=128)
    timestamp: int | None = None
    sensors: TelemetrySensors


class AnalyzeTelemetryRequest(BaseModel):
    snapshots: list[TelemetrySnapshot] = Field(min_length=1, max_length=100)


class RoomInsight(BaseModel):
    id: str
    roomId: str
    event: str
    reasoning: str
    impact: str
    suggestion: str
    contributingSensors: list[str]
    timestamp: int
    severity: Literal["info", "warning", "critical"]


class ModelInputTrace(BaseModel):
    temperature: float
    humidity: float
    aqi: float
    gas: float
    motion: int


class SummarizerInputTrace(BaseModel):
    prediction: str
    shapValues: dict[str, int]
    inputSensors: ModelInputTrace
    draftExplanation: str


class AnalysisTrace(BaseModel):
    modelInput: ModelInputTrace
    summarizerInput: SummarizerInputTrace
    summarizerOutput: str


class AnalyzeRoomResult(BaseModel):
    roomId: str
    prediction: str
    predictionIndex: int | None
    probabilities: dict[str, float] | None
    modelSource: str
    llmSource: str
    aiAnalyzed: bool
    shapValues: dict[str, int]
    sensors: TelemetrySensors
    insight: RoomInsight
    trace: AnalysisTrace


class AnalyzeTelemetryResponse(BaseModel):
    results: list[AnalyzeRoomResult]


class IngestTelemetryRequest(BaseModel):
    snapshot: TelemetrySnapshot


class IngestTelemetryResponse(BaseModel):
    accepted: bool
