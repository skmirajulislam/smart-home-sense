import { AIInsight } from '@/types/insight';
import { SensorData, SensorType } from '@/types/sensor';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

interface TelemetrySnapshotRequest {
  roomId: string;
  timestamp: number;
  sensors: {
    temperature: number;
    humidity: number;
    airQuality: number;
    motion: number;
    light: number;
    door: number;
    gas: number;
  };
}

interface AnalyzeTelemetryResponse {
  results: Array<{
    roomId: string;
    insight: AIInsight;
  }>;
}

function deriveGasFromSensors(sensors: Record<SensorType, SensorData>) {
  const base = sensors.airQuality.currentValue * 1.2;
  const doorFactor = sensors.door.currentValue === 0 ? 25 : -10;
  return Math.max(0, Math.round((base + doorFactor) * 10) / 10);
}

export function buildTelemetrySnapshot(
  roomId: string,
  sensors: Record<SensorType, SensorData>
): TelemetrySnapshotRequest {
  return {
    roomId,
    timestamp: Date.now(),
    sensors: {
      temperature: sensors.temperature.currentValue,
      humidity: sensors.humidity.currentValue,
      airQuality: sensors.airQuality.currentValue,
      motion: sensors.motion.currentValue,
      light: sensors.light.currentValue,
      door: sensors.door.currentValue,
      gas: deriveGasFromSensors(sensors),
    },
  };
}

export async function analyzeTelemetryBatch(
  snapshots: TelemetrySnapshotRequest[]
): Promise<Record<string, AIInsight>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/telemetry/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ snapshots }),
  });

  if (!response.ok) {
    throw new Error(`Analyze request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AnalyzeTelemetryResponse;
  return payload.results.reduce<Record<string, AIInsight>>((acc, item) => {
    acc[item.roomId] = item.insight;
    return acc;
  }, {});
}
