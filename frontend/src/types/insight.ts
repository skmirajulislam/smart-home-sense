import { SensorType } from './sensor';

export interface AIInsight {
  id: string;
  roomId: string;
  event: string;
  reasoning: string;
  impact: string;
  suggestion: string;
  contributingSensors: SensorType[];
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
}
