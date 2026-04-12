export type SensorType = 'temperature' | 'humidity' | 'airQuality' | 'motion' | 'light' | 'door';

export type ThresholdStatus = 'safe' | 'warning' | 'critical';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface SensorReading {
  value: number;
  timestamp: number;
}

export interface SensorData {
  type: SensorType;
  currentValue: number;
  unit: string;
  trend: TrendDirection;
  status: ThresholdStatus;
  history: SensorReading[];
}

export interface SensorConfig {
  type: SensorType;
  label: string;
  unit: string;
  icon: string;
  min: number;
  max: number;
  warningLow?: number;
  warningHigh: number;
  criticalLow?: number;
  criticalHigh: number;
}
