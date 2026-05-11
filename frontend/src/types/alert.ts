export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  roomId: string;
  roomName: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
}
