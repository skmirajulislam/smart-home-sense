import { create } from 'zustand';
import { Alert, AlertSeverity } from '@/types/alert';

interface AlertStore {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAlerts: () => void;
  unreadCount: () => number;
}

let alertCounter = 0;

export const useAlertStore = create<AlertStore>()((set, get) => ({
  alerts: [],
  addAlert: (alert) =>
    set((s) => ({
      alerts: [
        {
          ...alert,
          id: `alert-${alertCounter++}`,
          timestamp: Date.now(),
          read: false,
        },
        ...s.alerts,
      ].slice(0, 100),
    })),
  markRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),
  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
    })),
  clearAlerts: () => set({ alerts: [] }),
  unreadCount: () => get().alerts.filter((a) => !a.read).length,
}));
