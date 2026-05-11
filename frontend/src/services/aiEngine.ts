import { SensorData, SensorType } from '@/types/sensor';
import { AIInsight } from '@/types/insight';

type SensorMap = Record<SensorType, SensorData>;

interface Rule {
  check: (s: SensorMap) => boolean;
  generate: (s: SensorMap, roomId: string) => Omit<AIInsight, 'id' | 'timestamp'>;
}

const rules: Rule[] = [
  {
    check: (s) => s.temperature.currentValue > 30 && s.humidity.currentValue > 65 && s.motion.currentValue === 0,
    generate: (_, roomId) => ({
      roomId,
      event: 'Closed Hot Environment Detected',
      reasoning: 'Temperature exceeds 30°C with humidity above 65% while no motion is detected, indicating a sealed room with rising heat and moisture.',
      impact: 'Risk of heat stress, mold growth, and discomfort. Prolonged exposure can cause dehydration.',
      suggestion: 'Open windows or activate ventilation. Consider turning on air conditioning.',
      contributingSensors: ['temperature', 'humidity', 'motion'],
      severity: 'critical',
    }),
  },
  {
    check: (s) => s.airQuality.currentValue > 150 && s.door.currentValue === 0,
    generate: (_, roomId) => ({
      roomId,
      event: 'Poor Air Quality with Sealed Room',
      reasoning: 'AQI has risen above 150 (unhealthy) while the door remains closed, preventing fresh air circulation.',
      impact: 'Can cause respiratory irritation, headaches, and reduced cognitive function.',
      suggestion: 'Open doors/windows or activate air purifier immediately.',
      contributingSensors: ['airQuality', 'door'],
      severity: 'critical',
    }),
  },
  {
    check: (s) => s.temperature.currentValue > 30 && s.humidity.currentValue > 65,
    generate: (_, roomId) => ({
      roomId,
      event: 'Heat Discomfort Zone',
      reasoning: 'High temperature combined with elevated humidity creates a heat index above comfortable levels.',
      impact: 'Occupants may experience discomfort, fatigue, and reduced productivity.',
      suggestion: 'Reduce temperature via AC or increase air circulation to lower perceived heat.',
      contributingSensors: ['temperature', 'humidity'],
      severity: 'warning',
    }),
  },
  {
    check: (s) => s.airQuality.currentValue > 100,
    generate: (_, roomId) => ({
      roomId,
      event: 'Moderate Air Quality Concern',
      reasoning: 'AQI exceeds 100, entering the "Unhealthy for Sensitive Groups" range.',
      impact: 'Sensitive individuals (elderly, children, those with respiratory conditions) may be affected.',
      suggestion: 'Monitor air quality. Consider opening windows or using an air purifier.',
      contributingSensors: ['airQuality'],
      severity: 'warning',
    }),
  },
  {
    check: (s) => s.temperature.currentValue < 16,
    generate: (_, roomId) => ({
      roomId,
      event: 'Low Temperature Alert',
      reasoning: 'Room temperature has dropped below 16°C, which is below the recommended minimum for occupied spaces.',
      impact: 'Risk of hypothermia in vulnerable individuals. Pipes may freeze in extreme cases.',
      suggestion: 'Activate heating system. Check if windows or doors are open.',
      contributingSensors: ['temperature'],
      severity: 'warning',
    }),
  },
  {
    check: (s) => s.motion.currentValue === 1 && s.light.currentValue < 20,
    generate: (_, roomId) => ({
      roomId,
      event: 'Motion in Dark Room',
      reasoning: 'Motion detected while light levels are extremely low, suggesting someone is navigating in near-darkness.',
      impact: 'Fall risk and potential safety hazard due to poor visibility.',
      suggestion: 'Automate lights to turn on with motion detection. Check if lighting is functional.',
      contributingSensors: ['motion', 'light'],
      severity: 'info',
    }),
  },
  {
    check: (s) => s.humidity.currentValue < 25,
    generate: (_, roomId) => ({
      roomId,
      event: 'Low Humidity Warning',
      reasoning: 'Humidity has dropped below 25%, creating overly dry air conditions.',
      impact: 'May cause dry skin, irritated eyes, and respiratory discomfort. Static electricity risk.',
      suggestion: 'Use a humidifier to bring humidity to the 40-60% comfort range.',
      contributingSensors: ['humidity'],
      severity: 'info',
    }),
  },
];

let counter = 0;

export function generateInsights(roomId: string, sensors: SensorMap): AIInsight[] {
  const insights: AIInsight[] = [];

  for (const rule of rules) {
    if (rule.check(sensors)) {
      const data = rule.generate(sensors, roomId);
      insights.push({
        ...data,
        id: `insight-${roomId}-${counter++}`,
        timestamp: Date.now(),
      });
    }
  }

  // If no issues found, return an all-clear insight
  if (insights.length === 0) {
    insights.push({
      id: `insight-${roomId}-${counter++}`,
      roomId,
      event: 'All Systems Normal',
      reasoning: 'All sensor readings are within safe operating ranges. No anomalies detected.',
      impact: 'Environment is comfortable and safe for occupants.',
      suggestion: 'No action required. Continue monitoring.',
      contributingSensors: [],
      timestamp: Date.now(),
      severity: 'info',
    });
  }

  return insights;
}
