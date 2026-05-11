import { create } from 'zustand';
import { SensorData, SensorType } from '@/types/sensor';
import { AIInsight } from '@/types/insight';
import { createInitialSensorData, simulateSensorUpdate } from '@/services/sensorSimulator';
import { generateInsights } from '@/services/aiEngine';

interface SensorStore {
  roomSensors: Record<string, Record<SensorType, SensorData>>;
  roomInsights: Record<string, AIInsight[]>;
  initRoom: (roomId: string) => void;
  removeRoomData: (roomId: string) => void;
  tick: () => void;
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
  tick: () => {
    set((s) => {
      const updated: Record<string, Record<SensorType, SensorData>> = {};
      const insights: Record<string, AIInsight[]> = {};
      for (const [roomId, sensors] of Object.entries(s.roomSensors)) {
        updated[roomId] = simulateSensorUpdate(sensors);
        insights[roomId] = generateInsights(roomId, updated[roomId]);
      }
      return { roomSensors: updated, roomInsights: insights };
    });
  },
}));
