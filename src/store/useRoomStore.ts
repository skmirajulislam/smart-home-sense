import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Room } from '@/types/room';

interface RoomStore {
  rooms: Room[];
  activeRoomId: string | null;
  addRoom: (name: string, icon: string) => void;
  removeRoom: (id: string) => void;
  renameRoom: (id: string, name: string) => void;
  setActiveRoom: (id: string | null) => void;
}

const DEFAULT_ROOMS: Room[] = [
  { id: 'living-room', name: 'Living Room', icon: 'Sofa' },
  { id: 'bedroom', name: 'Bedroom', icon: 'Bed' },
  { id: 'kitchen', name: 'Kitchen', icon: 'CookingPot' },
];

export const useRoomStore = create<RoomStore>()(
  persist(
    (set) => ({
      rooms: DEFAULT_ROOMS,
      activeRoomId: null,
      addRoom: (name, icon) =>
        set((state) => ({
          rooms: [...state.rooms, { id: `room-${Date.now()}`, name, icon }],
        })),
      removeRoom: (id) =>
        set((state) => ({
          rooms: state.rooms.filter((r) => r.id !== id),
          activeRoomId: state.activeRoomId === id ? null : state.activeRoomId,
        })),
      renameRoom: (id, name) =>
        set((state) => ({
          rooms: state.rooms.map((r) => (r.id === id ? { ...r, name } : r)),
        })),
      setActiveRoom: (id) => set({ activeRoomId: id }),
    }),
    { name: 'xiot-rooms' }
  )
);
