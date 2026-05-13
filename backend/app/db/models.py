from sqlalchemy import JSON, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from .base import Base


class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(128), index=True, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    aqi = Column(Float, nullable=False)
    gas = Column(Float, nullable=False)
    motion = Column(Integer, nullable=False)
    light = Column(Float, nullable=True)
    door = Column(Integer, nullable=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AnalysisEvent(Base):
    __tablename__ = "analysis_events"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String(128), index=True, nullable=False)
    prediction = Column(String(32), nullable=False)
    severity = Column(String(16), nullable=False)
    model_source = Column(String(64), nullable=False)
    shap_values = Column(JSON, nullable=False)
    explanation = Column(String(2000), nullable=False)
    llm_source = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
