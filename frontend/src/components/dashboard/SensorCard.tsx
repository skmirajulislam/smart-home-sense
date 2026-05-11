import { SensorData, SensorType } from '@/types/sensor';
import { SENSOR_CONFIGS } from '@/services/thresholds';
import { Thermometer, Droplets, Wind, Activity, Sun, DoorOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const iconMap: Record<SensorType, React.ComponentType<{ className?: string }>> = {
  temperature: Thermometer,
  humidity: Droplets,
  airQuality: Wind,
  motion: Activity,
  light: Sun,
  door: DoorOpen,
};

const statusColors = {
  safe: 'border-emerald-500/40 bg-emerald-500/5',
  warning: 'border-amber-500/40 bg-amber-500/5',
  critical: 'border-rose-500/40 bg-rose-500/5',
};

const statusDot = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
};

const chartColors = {
  safe: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
};

interface SensorCardProps {
  sensor: SensorData;
}

export function SensorCard({ sensor }: SensorCardProps) {
  const Icon = iconMap[sensor.type];
  const config = SENSOR_CONFIGS[sensor.type];

  const displayValue =
    sensor.type === 'motion'
      ? sensor.currentValue === 1 ? 'Detected' : 'None'
      : sensor.type === 'door'
        ? sensor.currentValue === 1 ? 'Open' : 'Closed'
        : sensor.currentValue;

  const TrendIcon = sensor.trend === 'up' ? TrendingUp : sensor.trend === 'down' ? TrendingDown : Minus;

  const chartData = sensor.history.map((h) => ({ v: h.value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border-2 p-4 transition-all',
        statusColors[sensor.status]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn('h-2 w-2 rounded-full animate-pulse', statusDot[sensor.status])} />
          <span className="text-[10px] uppercase font-semibold text-muted-foreground">{sensor.status}</span>
        </div>
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <motion.span
            key={sensor.currentValue}
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl font-mono font-bold"
          >
            {displayValue}
          </motion.span>
          {sensor.type !== 'motion' && sensor.type !== 'door' && (
            <span className="text-sm text-muted-foreground ml-1">{sensor.unit}</span>
          )}
        </div>
        <TrendIcon className={cn(
          'h-4 w-4',
          sensor.trend === 'up' && 'text-rose-400',
          sensor.trend === 'down' && 'text-emerald-400',
          sensor.trend === 'stable' && 'text-muted-foreground'
        )} />
      </div>

      {sensor.type !== 'motion' && sensor.type !== 'door' && chartData.length > 2 && (
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${sensor.type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors[sensor.status]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColors[sensor.status]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={chartColors[sensor.status]}
                strokeWidth={1.5}
                fill={`url(#grad-${sensor.type})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
