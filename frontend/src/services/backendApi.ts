import { AIInsight } from '@/types/insight';
import { SensorData, SensorType } from '@/types/sensor';

const defaultApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? defaultApiBaseUrl;
const MAX_SNAPSHOTS_PER_REQUEST = 100;

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

export interface AnalyzeRoomResult {
  roomId: string;
  prediction: string;
  predictionIndex: number | null;
  probabilities: Record<string, number> | null;
  modelSource: string;
  llmSource: string;
  aiAnalyzed: boolean;
  shapValues: Record<string, number>;
  sensors: {
    temperature: number;
    humidity: number;
    airQuality: number;
    motion: number;
    light: number;
    door: number;
    gas: number;
  };
  insight: AIInsight;
  trace: {
    modelInput: {
      temperature: number;
      humidity: number;
      aqi: number;
      gas: number;
      motion: number;
    };
    summarizerInput: {
      prediction: string;
      shapValues: Record<string, number>;
      inputSensors: {
        temperature: number;
        humidity: number;
        aqi: number;
        gas: number;
        motion: number;
      };
      draftExplanation: string;
    };
    summarizerOutput: string;
  };
}

interface AnalyzeTelemetryResponse {
  results: AnalyzeRoomResult[];
}

function deriveGasFromSensors(sensors: Record<SensorType, SensorData>) {
  const directGas = sensors.gas?.currentValue;
  if (Number.isFinite(directGas)) {
    return directGas;
  }
  const base = sensors.airQuality.currentValue * 1.2;
  const doorFactor = sensors.door.currentValue === 0 ? 25 : -10;
  const derived = Math.max(0, Math.round((base + doorFactor) * 10) / 10);
  return Math.min(derived, 1000);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return clamp(value, min, max);
}

export function buildTelemetrySnapshot(
  roomId: string,
  sensors: Record<SensorType, SensorData>
): TelemetrySnapshotRequest {
  const motion = sensors.motion.currentValue >= 0.5 ? 1 : 0;
  const door = sensors.door.currentValue >= 0.5 ? 1 : 0;
  const temperature = sanitizeNumber(sensors.temperature.currentValue, 24, -50, 60);
  const humidity = sanitizeNumber(sensors.humidity.currentValue, 45, 0, 100);
  const airQuality = sanitizeNumber(sensors.airQuality.currentValue, 42, 0, 500);
  const light = sanitizeNumber(sensors.light.currentValue, 350, 0, 10000);
  const gas = sanitizeNumber(deriveGasFromSensors(sensors), 100, 0, 5000);
  return {
    roomId: roomId.trim(),
    timestamp: Date.now(),
    sensors: {
      temperature,
      humidity,
      airQuality,
      motion,
      light,
      door,
      gas,
    },
  };
}

export async function analyzeTelemetryBatch(
  snapshots: TelemetrySnapshotRequest[]
): Promise<Record<string, AnalyzeRoomResult>> {
  const cleanSnapshots = snapshots.filter((snapshot) => snapshot.roomId.length > 0);
  if (cleanSnapshots.length === 0) {
    return {};
  }

  const resultsByRoom: Record<string, AnalyzeRoomResult> = {};
  for (let i = 0; i < cleanSnapshots.length; i += MAX_SNAPSHOTS_PER_REQUEST) {
    const chunk = cleanSnapshots.slice(i, i + MAX_SNAPSHOTS_PER_REQUEST);
    const response = await fetch(`${API_BASE_URL}/api/v1/telemetry/analyze`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Client': 'smart-home-sense-frontend',
      },
      body: JSON.stringify({ snapshots: chunk }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Analyze request failed with status ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    const payload = (await response.json()) as AnalyzeTelemetryResponse;
    for (const item of payload.results) {
      resultsByRoom[item.roomId] = item;
    }
  }
  return resultsByRoom;
}
