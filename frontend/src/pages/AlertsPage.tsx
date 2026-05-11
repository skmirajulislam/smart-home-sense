import { useAlertStore } from '@/store/useAlertStore';
import { AlertTriangle, Bell, CheckCheck, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const severityIcon = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

const severityColor = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  critical: 'text-rose-400',
};

export function AlertsPage() {
  const alerts = useAlertStore((s) => s.alerts);
  const markAllRead = useAlertStore((s) => s.markAllRead);
  const clearAlerts = useAlertStore((s) => s.clearAlerts);
  const markRead = useAlertStore((s) => s.markRead);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Alert History</h1>
          <span className="text-sm text-muted-foreground">({alerts.length})</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-3 w-3 mr-1" /> Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={clearAlerts}>
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No alerts yet. System is running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {alerts.map((alert) => {
              const Icon = severityIcon[alert.severity];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => markRead(alert.id)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    alert.read ? 'bg-card/50 opacity-60' : 'bg-card'
                  )}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', severityColor[alert.severity])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{alert.title}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  </div>
                  {!alert.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
