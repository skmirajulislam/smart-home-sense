from sqlalchemy.orm import Session

from backend.app.db.models import TelemetryEvent
from backend.app.schemas.telemetry import TelemetrySnapshot


class TelemetryRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_snapshot(self, snapshot: TelemetrySnapshot, derived_gas: float) -> TelemetryEvent:
        item = TelemetryEvent(
            room_id=snapshot.roomId,
            temperature=snapshot.sensors.temperature,
            humidity=snapshot.sensors.humidity,
            aqi=snapshot.sensors.airQuality,
            gas=derived_gas,
            motion=snapshot.sensors.motion,
            light=snapshot.sensors.light,
            door=snapshot.sensors.door,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
