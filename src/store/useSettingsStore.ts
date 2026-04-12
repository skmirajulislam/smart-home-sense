import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SensorType } from '@/types/sensor';
import { SENSOR_CONFIGS } from '@/services/thresholds';

export interface RoomThresholds {
  [sensorType: string]: {
    warningHigh: number;
    criticalHigh: number;
    warningLow?: number;
    criticalLow?: number;
  };
}

export interface AlertPreference {
  enableNotifications: boolean;
  enableSound: boolean;
  enableToast: boolean;
  enableCriticalAlerts: boolean;
}

interface SettingsStore {
  roomThresholds: Record<string, RoomThresholds>;
  alertPreferences: AlertPreference;

  // Room threshold actions
  setRoomThreshold: (
    roomId: string,
    sensorType: SensorType,
    thresholds: {
      warningHigh: number;
      criticalHigh: number;
      warningLow?: number;
      criticalLow?: number;
    }
  ) => void;

  getRoomThreshold: (roomId: string, sensorType: SensorType) => RoomThresholds[string] | undefined;

  // Alert preference actions
  setAlertPreferences: (prefs: Partial<AlertPreference>) => void;
  getAlertPreferences: () => AlertPreference;

  // Reset actions
  resetRoomThresholds: (roomId: string) => void;
  resetAllThresholds: () => void;
}

const DEFAULT_ALERT_PREFERENCES: AlertPreference = {
  enableNotifications: true,
  enableSound: true,
  enableToast: true,
  enableCriticalAlerts: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      roomThresholds: {},
      alertPreferences: DEFAULT_ALERT_PREFERENCES,

      setRoomThreshold: (roomId, sensorType, thresholds) => {
        set((state) => ({
          roomThresholds: {
            ...state.roomThresholds,
            [roomId]: {
              ...state.roomThresholds[roomId],
              [sensorType]: thresholds,
            },
          },
        }));
      },

      getRoomThreshold: (roomId, sensorType) => {
        const state = get();
        return state.roomThresholds[roomId]?.[sensorType];
      },

      setAlertPreferences: (prefs) => {
        set((state) => ({
          alertPreferences: { ...state.alertPreferences, ...prefs },
        }));
      },

      getAlertPreferences: () => get().alertPreferences,

      resetRoomThresholds: (roomId) => {
        set((state) => {
          const { [roomId]: _, ...rest } = state.roomThresholds;
          return { roomThresholds: rest };
        });
      },

      resetAllThresholds: () => {
        set({ roomThresholds: {} });
      },
    }),
    { name: 'xiot-settings' }
  )
);

export function getDefaultThreshold(sensorType: SensorType) {
  const config = SENSOR_CONFIGS[sensorType];
  return {
    warningHigh: config.warningHigh,
    criticalHigh: config.criticalHigh,
    warningLow: config.warningLow,
    criticalLow: config.criticalLow,
  };
}
