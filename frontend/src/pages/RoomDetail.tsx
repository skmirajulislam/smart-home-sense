import { useParams, Navigate } from 'react-router-dom';
import { useRoomStore } from '@/store/useRoomStore';
import { useSensorStore } from '@/store/useSensorStore';
import { SensorCard } from '@/components/dashboard/SensorCard';
import { InsightPanel } from '@/components/insights/InsightPanel';
import { SensorType } from '@/types/sensor';
import { Sofa, Bed, CookingPot, Box } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sofa, Bed, CookingPot, Box,
};

const SENSOR_ORDER: SensorType[] = ['temperature', 'humidity', 'airQuality', 'motion', 'light', 'door'];

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const rooms = useRoomStore((s) => s.rooms);
  const sensors = useSensorStore((s) => (id ? s.roomSensors[id] : undefined));
  const insights = useSensorStore((s) => (id ? s.roomInsights[id] : undefined));

  const room = rooms.find((r) => r.id === id);
  if (!room) return <Navigate to="/" replace />;
  if (!sensors) return <div className="p-6 text-muted-foreground">Loading sensors...</div>;

  const Icon = iconMap[room.icon] || Box;

  // Build chart data from temperature, humidity, airQuality histories
  const chartData = sensors.temperature.history.map((_, i) => ({
    idx: i,
    Temp: sensors.temperature.history[i]?.value ?? 0,
    Humidity: sensors.humidity.history[i]?.value ?? 0,
    AQI: sensors.airQuality.history[i]?.value ?? 0,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-sm text-muted-foreground">Real-time sensor monitoring & AI analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {SENSOR_ORDER.map((type) => (
              <SensorCard key={type} sensor={sensors[type]} />
            ))}
          </div>

          {/* Historical Chart */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Sensor Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="idx" tick={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Temp" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Humidity" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="AQI" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="lg:col-span-1">
          <InsightPanel insights={insights || []} />
        </div>
      </div>
    </div>
  );
}
