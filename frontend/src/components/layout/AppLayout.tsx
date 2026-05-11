import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSensorStore } from '@/store/useSensorStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useAlertStore } from '@/store/useAlertStore';
import { getThresholdStatus } from '@/services/thresholds';
import { SensorType } from '@/types/sensor';
import { toast } from 'sonner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const rooms = useRoomStore((s) => s.rooms);
  const initRoom = useSensorStore((s) => s.initRoom);
  const tick = useSensorStore((s) => s.tick);
  const roomSensors = useSensorStore((s) => s.roomSensors);
  const addAlert = useAlertStore((s) => s.addAlert);

  // Initialize sensor data for all rooms
  useEffect(() => {
    rooms.forEach((r) => initRoom(r.id));
  }, [rooms, initRoom]);

  // Tick every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 2500);
    return () => clearInterval(interval);
  }, [tick]);

  // Check for critical alerts on each update
  useEffect(() => {
    for (const room of rooms) {
      const sensors = roomSensors[room.id];
      if (!sensors) continue;
      for (const type of Object.keys(sensors) as SensorType[]) {
        const sensor = sensors[type];
        if (sensor.status === 'critical') {
          const alertKey = `${room.id}-${type}`;
          addAlert({
            roomId: room.id,
            roomName: room.name,
            severity: 'critical',
            title: `Critical: ${sensor.type} in ${room.name}`,
            description: `${sensor.type} reading of ${sensor.currentValue}${sensor.unit} exceeds safe limits.`,
          });
          toast.error(`${room.name}: ${sensor.type} critical (${sensor.currentValue}${sensor.unit})`);
        }
      }
    }
  }, [roomSensors]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-3 bg-card/50 backdrop-blur-sm justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">X</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight">XIOT</h1>
                <span className="text-xs text-muted-foreground hidden sm:block">Cognitive Smart Home</span>
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
