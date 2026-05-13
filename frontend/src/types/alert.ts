export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertSensorDetails {
  temperature: number;
  humidity: number;
  airQuality: number;
  motion: number;
  light: number;
  door: number;
  gas: number;
}

export interface AlertModelDetails {
  prediction: string;
  predictionIndex: number | null;
  probabilities: Record<string, number> | null;
  shapValues: Record<string, number>;
  modelSource: string;
  llmSource: string;
  aiAnalyzed: boolean;
  trace?: {
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

export interface AlertAiSummary {
  event: string;
  reasoning: string;
  impact: string;
  suggestion: string;
  contributingSensors: string[];
}

export interface Alert {
  id: string;
  roomId: string;
  roomName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  sensorDetails?: AlertSensorDetails;
  modelDetails?: AlertModelDetails;
  aiSummary?: AlertAiSummary;
  timestamp: number;
  read: boolean;
}
