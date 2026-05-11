import { create } from 'zustand';
import { SensorData, SensorType } from '@/types/sensor';
import { AIInsight } from '@/types/insight';
import { createInitialSensorData, simulateSensorUpdate } from '@/services/sensorSimulator';
import { generateInsights } from '@/services/aiEngine';
import { analyzeTelemetryBatch, buildTelemetrySnapshot } from '@/services/backendApi';

interface SensorStore {
  roomSensors: Record<string, Record<SensorType, SensorData>>;
  roomInsights: Record<string, AIInsight[]>;
  initRoom: (roomId: string) => void;
  removeRoomData: (roomId: string) => void;
  tick: () => Promise<void>;
}

export const useSensorStore = create<SensorStore>()((set, get) => ({
  roomSensors: {},
  roomInsights: {},
  initRoom: (roomId) => {
    const state = get();
    if (!state.roomSensors[roomId]) {
      set((s) => ({
        roomSensors: { ...s.roomSensors, [roomId]: createInitialSensorData() },
      }));
    }
  },
  removeRoomData: (roomId) => {
    set((s) => {
      const { [roomId]: _, ...rest } = s.roomSensors;
      const { [roomId]: __, ...restInsights } = s.roomInsights;
      return { roomSensors: rest, roomInsights: restInsights };
    });
  },
  tick: async () => {
    const current = get().roomSensors;
    const updated: Record<string, Record<SensorType, SensorData>> = {};
    const fallbackInsights: Record<string, AIInsight[]> = {};

    for (const [roomId, sensors] of Object.entries(current)) {
      updated[roomId] = simulateSensorUpdate(sensors);
      fallbackInsights[roomId] = generateInsights(roomId, updated[roomId]);
    }

    set({ roomSensors: updated, roomInsights: fallbackInsights });

    const snapshots = Object.entries(updated).map(([roomId, sensors]) => buildTelemetrySnapshot(roomId, sensors));
    if (snapshots.length === 0) return;

    try {
      const backendInsights = await analyzeTelemetryBatch(snapshots);
      set((state) => ({
        roomInsights: Object.entries(state.roomSensors).reduce<Record<string, AIInsight[]>>((acc, [roomId]) => {
          acc[roomId] = backendInsights[roomId] ? [backendInsights[roomId]] : fallbackInsights[roomId] ?? [];
          return acc;
        }, {}),
      }));
    } catch (error) {
      console.warn('Backend analyze API unavailable, using local insights.', error);
    }
  },
}));
