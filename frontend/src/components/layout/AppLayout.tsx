import { useEffect, useRef } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSensorStore } from '@/store/useSensorStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useAlertStore } from '@/store/useAlertStore';
import { toast } from 'sonner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const rooms = useRoomStore((s) => s.rooms);
  const initRoom = useSensorStore((s) => s.initRoom);
  const tick = useSensorStore((s) => s.tick);
  const roomAnalyses = useSensorStore((s) => s.roomAnalyses);
  const addAlert = useAlertStore((s) => s.addAlert);
  const lastAlertedPrediction = useRef<Record<string, string>>({});

  // Initialize sensor data for all rooms
  useEffect(() => {
    rooms.forEach((r) => initRoom(r.id));
  }, [rooms, initRoom]);

  // Tick every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void tick();
    }, 10000);
    return () => clearInterval(interval);
  }, [tick]);

  // Create alerts from ML warning/danger predictions.
  useEffect(() => {
    for (const room of rooms) {
      const analysis = roomAnalyses[room.id];
      if (!analysis) continue;

      if (analysis.prediction === 'Safe') {
        delete lastAlertedPrediction.current[room.id];
        continue;
      }

      const prevPrediction = lastAlertedPrediction.current[room.id];
      if (prevPrediction === analysis.prediction) {
        continue;
      }

      lastAlertedPrediction.current[room.id] = analysis.prediction;
      addAlert({
        roomId: room.id,
        roomName: room.name,
        severity: analysis.insight.severity,
        title: `${analysis.prediction} detected in ${room.name}`,
        description: analysis.insight.reasoning,
        sensorDetails: analysis.sensors,
        modelDetails: {
          prediction: analysis.prediction,
          predictionIndex: analysis.predictionIndex,
          probabilities: analysis.probabilities,
          shapValues: analysis.shapValues,
          modelSource: analysis.modelSource,
          llmSource: analysis.llmSource,
          aiAnalyzed: analysis.aiAnalyzed,
          trace: analysis.trace,
        },
        aiSummary: {
          event: analysis.insight.event,
          reasoning: analysis.insight.reasoning,
          impact: analysis.insight.impact,
          suggestion: analysis.insight.suggestion,
          contributingSensors: analysis.insight.contributingSensors,
        },
      });

      if (analysis.insight.severity === 'critical') {
        toast.error(`${room.name}: ${analysis.prediction} detected by ML model`);
      } else {
        toast.warning(`${room.name}: ${analysis.prediction} predicted by ML model`);
      }
    }
  }, [roomAnalyses, rooms, addAlert]);

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
