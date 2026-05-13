import { create } from 'zustand';
import { SensorData, SensorType } from '@/types/sensor';
import { AIInsight } from '@/types/insight';
import { createInitialSensorData, simulateSensorUpdate } from '@/services/sensorSimulator';
import { AnalyzeRoomResult, analyzeTelemetryBatch, buildTelemetrySnapshot } from '@/services/backendApi';

interface SensorStore {
  roomSensors: Record<string, Record<SensorType, SensorData>>;
  roomInsights: Record<string, AIInsight[]>;
  roomAnalyses: Record<string, AnalyzeRoomResult | null>;
  initRoom: (roomId: string) => void;
  removeRoomData: (roomId: string) => void;
  tick: () => Promise<void>;
}

export const useSensorStore = create<SensorStore>()((set, get) => ({
  roomSensors: {},
  roomInsights: {},
  roomAnalyses: {},
  initRoom: (roomId) => {
    const state = get();
    if (!state.roomSensors[roomId]) {
      set((s) => ({
        roomSensors: { ...s.roomSensors, [roomId]: createInitialSensorData() },
        roomAnalyses: { ...s.roomAnalyses, [roomId]: null },
      }));
    }
  },
  removeRoomData: (roomId) => {
    set((s) => {
      const { [roomId]: _, ...rest } = s.roomSensors;
      const { [roomId]: __, ...restInsights } = s.roomInsights;
      const { [roomId]: ___, ...restAnalyses } = s.roomAnalyses;
      return { roomSensors: rest, roomInsights: restInsights, roomAnalyses: restAnalyses };
    });
  },
  tick: async () => {
    const current = get().roomSensors;
    const updated: Record<string, Record<SensorType, SensorData>> = {};

    for (const [roomId, sensors] of Object.entries(current)) {
      updated[roomId] = simulateSensorUpdate(sensors);
    }

    set((state) => ({
      roomSensors: updated,
      roomInsights: Object.entries(updated).reduce<Record<string, AIInsight[]>>((acc, [roomId]) => {
        acc[roomId] = state.roomInsights[roomId] ?? [];
        return acc;
      }, {}),
      roomAnalyses: Object.entries(updated).reduce<Record<string, AnalyzeRoomResult | null>>((acc, [roomId]) => {
        acc[roomId] = state.roomAnalyses[roomId] ?? null;
        return acc;
      }, {}),
    }));

    const snapshots = Object.entries(updated).map(([roomId, sensors]) => buildTelemetrySnapshot(roomId, sensors));
    if (snapshots.length === 0) return;

    try {
      const backendAnalyses = await analyzeTelemetryBatch(snapshots);
      set((state) => ({
        roomInsights: Object.entries(state.roomSensors).reduce<Record<string, AIInsight[]>>((acc, [roomId]) => {
          acc[roomId] = backendAnalyses[roomId]
            ? [backendAnalyses[roomId].insight]
            : [
                {
                  id: `insight-${roomId}-backend-unavailable`,
                  roomId,
                  event: 'Analysis Service Unavailable',
                  reasoning: 'The backend model service is currently unreachable, so no AI prediction could be produced.',
                  impact: 'Automated risk classification and explanation are temporarily unavailable.',
                  suggestion: 'Check that the backend API is running and reachable from the frontend application.',
                  contributingSensors: [],
                  timestamp: Date.now(),
                  severity: 'warning',
                },
              ];
          return acc;
        }, {}),
        roomAnalyses: Object.entries(state.roomSensors).reduce<Record<string, AnalyzeRoomResult | null>>((acc, [roomId]) => {
          acc[roomId] = backendAnalyses[roomId] ?? null;
          return acc;
        }, {}),
      }));
    } catch (error) {
      console.warn('Backend analyze API unavailable.', error);
      set((state) => ({
        roomInsights: Object.entries(state.roomSensors).reduce<Record<string, AIInsight[]>>((acc, [roomId]) => {
          acc[roomId] = [
            {
              id: `insight-${roomId}-backend-unavailable`,
              roomId,
              event: 'Analysis Service Unavailable',
              reasoning: 'The backend model service is currently unreachable, so no AI prediction could be produced.',
              impact: 'Automated risk classification and explanation are temporarily unavailable.',
              suggestion: 'Check that the backend API is running and reachable from the frontend application.',
              contributingSensors: [],
              timestamp: Date.now(),
              severity: 'warning',
            },
          ];
          return acc;
        }, {}),
        roomAnalyses: Object.entries(state.roomSensors).reduce<Record<string, AnalyzeRoomResult | null>>((acc, [roomId]) => {
          acc[roomId] = null;
          return acc;
        }, {}),
      }));
    }
  },
}));
