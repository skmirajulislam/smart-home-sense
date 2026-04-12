import { SensorConfig, SensorType, ThresholdStatus } from '@/types/sensor';

export const SENSOR_CONFIGS: Record<SensorType, SensorConfig> = {
  temperature: {
    type: 'temperature',
    label: 'Temperature',
    unit: '°C',
    icon: 'Thermometer',
    min: 10,
    max: 45,
    warningHigh: 30,
    criticalHigh: 38,
    warningLow: 15,
    criticalLow: 10,
  },
  humidity: {
    type: 'humidity',
    label: 'Humidity',
    unit: '%',
    icon: 'Droplets',
    min: 10,
    max: 100,
    warningHigh: 70,
    criticalHigh: 85,
    warningLow: 25,
    criticalLow: 15,
  },
  airQuality: {
    type: 'airQuality',
    label: 'Air Quality',
    unit: 'AQI',
    icon: 'Wind',
    min: 0,
    max: 500,
    warningHigh: 100,
    criticalHigh: 200,
  },
  motion: {
    type: 'motion',
    label: 'Motion',
    unit: '',
    icon: 'Activity',
    min: 0,
    max: 1,
    warningHigh: 2,
    criticalHigh: 2,
  },
  light: {
    type: 'light',
    label: 'Light',
    unit: 'lux',
    icon: 'Sun',
    min: 0,
    max: 1000,
    warningHigh: 800,
    criticalHigh: 950,
    warningLow: 10,
  },
  door: {
    type: 'door',
    label: 'Door',
    unit: '',
    icon: 'DoorOpen',
    min: 0,
    max: 1,
    warningHigh: 2,
    criticalHigh: 2,
  },
};

export function getThresholdStatus(type: SensorType, value: number): ThresholdStatus {
  const config = SENSOR_CONFIGS[type];
  if (type === 'motion' || type === 'door') return 'safe';
  if (value >= config.criticalHigh || (config.criticalLow !== undefined && value <= config.criticalLow)) return 'critical';
  if (value >= config.warningHigh || (config.warningLow !== undefined && value <= config.warningLow)) return 'warning';
  return 'safe';
}
