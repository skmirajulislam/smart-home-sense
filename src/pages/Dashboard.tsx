import { useRoomStore } from '@/store/useRoomStore';
import { useSensorStore } from '@/store/useSensorStore';
import { useAlertStore } from '@/store/useAlertStore';
import { RoomCard } from '@/components/dashboard/RoomCard';
import { Activity, Box, AlertTriangle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const rooms = useRoomStore((s) => s.rooms);
  const roomSensors = useSensorStore((s) => s.roomSensors);
  const alerts = useAlertStore((s) => s.alerts);

  const totalSensors = rooms.length * 6;
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical' && !a.read).length;

  const allSafe = Object.values(roomSensors).every((sensors) =>
    Object.values(sensors).every((s) => s.status === 'safe')
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of your smart home environment</p>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Box} label="Rooms" value={rooms.length} />
        <StatCard icon={Activity} label="Active Sensors" value={totalSensors} />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={criticalAlerts} danger={criticalAlerts > 0} />
        <StatCard icon={Shield} label="System Status" value={allSafe ? 'Normal' : 'Alert'} danger={!allSafe} />
      </div>

      {/* Room Grid */}
      <h2 className="text-lg font-semibold mb-4">Room Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room, i) => (
          <RoomCard key={room.id} room={room} index={i} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, danger }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${danger ? 'text-rose-400' : 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-xl font-bold font-mono ${danger ? 'text-rose-400' : ''}`}>{value}</span>
    </motion.div>
  );
}
