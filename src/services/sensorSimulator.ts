import { SensorType, SensorData, TrendDirection } from '@/types/sensor';
import { SENSOR_CONFIGS, getThresholdStatus } from './thresholds';

const HISTORY_SIZE = 20;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomWalk(current: number, step: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * 2 * step;
  return clamp(current + delta, min, max);
}

function getTrend(history: { value: number }[]): TrendDirection {
  if (history.length < 3) return 'stable';
  const recent = history.slice(-3);
  const diff = recent[recent.length - 1].value - recent[0].value;
  if (Math.abs(diff) < 0.5) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

const INITIAL_VALUES: Record<SensorType, number> = {
  temperature: 24,
  humidity: 45,
  airQuality: 42,
  motion: 0,
  light: 350,
  door: 0,
};

export function createInitialSensorData(): Record<SensorType, SensorData> {
  const now = Date.now();
  const result = {} as Record<SensorType, SensorData>;
  const types: SensorType[] = ['temperature', 'humidity', 'airQuality', 'motion', 'light', 'door'];

  for (const type of types) {
    const config = SENSOR_CONFIGS[type];
    const baseVal = INITIAL_VALUES[type] + (Math.random() - 0.5) * 4;
    const val = clamp(baseVal, config.min, config.max);
    result[type] = {
      type,
      currentValue: Math.round(val * 10) / 10,
      unit: config.unit,
      trend: 'stable',
      status: getThresholdStatus(type, val),
      history: [{ value: Math.round(val * 10) / 10, timestamp: now }],
    };
  }
  return result;
}

export function simulateSensorUpdate(sensors: Record<SensorType, SensorData>): Record<SensorType, SensorData> {
  const now = Date.now();
  const updated = { ...sensors };
  const anomalyChance = Math.random();

  for (const type of Object.keys(sensors) as SensorType[]) {
    const prev = sensors[type];
    const config = SENSOR_CONFIGS[type];
    let newVal: number;

    if (type === 'motion') {
      newVal = Math.random() > 0.7 ? 1 : 0;
    } else if (type === 'door') {
      newVal = Math.random() > 0.95 ? (prev.currentValue === 0 ? 1 : 0) : prev.currentValue;
    } else {
      const step = type === 'temperature' ? 0.5 : type === 'humidity' ? 1.5 : type === 'airQuality' ? 5 : 20;
      newVal = randomWalk(prev.currentValue, step, config.min, config.max);

      // Occasional anomaly spike
      if (anomalyChance > 0.95 && type === 'temperature') {
        newVal = clamp(newVal + 8, config.min, config.max);
      }
      if (anomalyChance > 0.93 && type === 'airQuality') {
        newVal = clamp(newVal + 60, config.min, config.max);
      }
    }

    newVal = Math.round(newVal * 10) / 10;
    const newHistory = [...prev.history, { value: newVal, timestamp: now }].slice(-HISTORY_SIZE);

    updated[type] = {
      ...prev,
      currentValue: newVal,
      status: getThresholdStatus(type, newVal),
      trend: getTrend(newHistory),
      history: newHistory,
    };
  }

  return updated;
}
