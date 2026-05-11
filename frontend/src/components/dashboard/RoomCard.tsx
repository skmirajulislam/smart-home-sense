import { Room } from '@/types/room';
import { useSensorStore } from '@/store/useSensorStore';
import { SensorType } from '@/types/sensor';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Sofa, Bed, CookingPot, Box, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sofa, Bed, CookingPot, Box,
};

const statusDot = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
};

export function RoomCard({ room, index }: { room: Room; index: number }) {
  const sensors = useSensorStore((s) => s.roomSensors[room.id]);
  const Icon = iconMap[room.icon] || Box;

  if (!sensors) return null;

  const sensorList = Object.values(sensors);
  const worstStatus = sensorList.some((s) => s.status === 'critical')
    ? 'critical'
    : sensorList.some((s) => s.status === 'warning')
      ? 'warning'
      : 'safe';

  const criticalCount = sensorList.filter((s) => s.status === 'critical').length;
  const warningCount = sensorList.filter((s) => s.status === 'warning').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/room/${room.id}`} className="block group">
        <div className={cn(
          'rounded-xl border-2 p-5 transition-all hover:shadow-lg hover:scale-[1.02]',
          worstStatus === 'critical' && 'border-rose-500/40 bg-rose-500/5',
          worstStatus === 'warning' && 'border-amber-500/40 bg-amber-500/5',
          worstStatus === 'safe' && 'border-border bg-card',
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{room.name}</h3>
                <p className="text-xs text-muted-foreground">6 sensors active</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {sensorList.slice(0, 4).map((s) => (
              <div key={s.type} className="flex items-center gap-1.5">
                <div className={cn('h-1.5 w-1.5 rounded-full', statusDot[s.status])} />
                <span className="text-xs text-muted-foreground truncate">
                  {s.type === 'motion' ? (s.currentValue ? 'Motion' : 'Still') :
                   s.type === 'door' ? (s.currentValue ? 'Open' : 'Closed') :
                   `${s.currentValue}${s.unit}`}
                </span>
              </div>
            ))}
          </div>

          {(criticalCount > 0 || warningCount > 0) && (
            <div className="mt-3 flex gap-2">
              {criticalCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                  {warningCount} warning
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
