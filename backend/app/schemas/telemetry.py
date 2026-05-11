from typing import Literal

from pydantic import BaseModel, Field


class TelemetrySensors(BaseModel):
    temperature: float
    humidity: float = Field(ge=0, le=100)
    airQuality: float = Field(ge=0)
    motion: int = Field(ge=0, le=1)
    light: float = Field(ge=0)
    door: int = Field(ge=0, le=1)
    gas: float | None = Field(default=None, ge=0)


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


class AnalyzeRoomResult(BaseModel):
    roomId: str
    prediction: str
    predictionIndex: int | None
    modelSource: str
    llmSource: str
    insight: RoomInsight


class AnalyzeTelemetryResponse(BaseModel):
    results: list[AnalyzeRoomResult]


class IngestTelemetryRequest(BaseModel):
    snapshot: TelemetrySnapshot


class IngestTelemetryResponse(BaseModel):
    accepted: bool
