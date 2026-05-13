import { useAlertStore } from '@/store/useAlertStore';
import { AlertTriangle, Bell, CheckCheck, Trash2, Info, ChevronDown, Brain, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { SENSOR_CONFIGS } from '@/services/thresholds';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
              const hasDetails = Boolean(alert.aiSummary || alert.modelDetails || alert.sensorDetails);
              const isExpanded = expandedId === alert.id;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    markRead(alert.id);
                    if (hasDetails) {
                      setExpandedId((prev) => (prev === alert.id ? null : alert.id));
                    }
                  }}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    alert.read ? 'bg-card/50 opacity-60' : 'bg-card'
                  )}
                >
                  <div className="flex items-start gap-3">
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
                    {hasDetails && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 mt-0.5 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    )}
                    {!alert.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>

                  <AnimatePresence initial={false}>
                    {hasDetails && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-7 mt-3 space-y-3 overflow-hidden"
                      >
                        {alert.aiSummary && (
                          <div className="rounded-md border bg-muted/20 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <Brain className="h-3.5 w-3.5 text-primary" />
                              AI Summary
                            </div>
                            <p className="text-xs">{alert.aiSummary.reasoning}</p>
                            <p className="text-xs text-muted-foreground">Impact: {alert.aiSummary.impact}</p>
                            <p className="text-xs text-muted-foreground">Action: {alert.aiSummary.suggestion}</p>
                            {alert.aiSummary.contributingSensors.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {alert.aiSummary.contributingSensors.map((sensor) => (
                                  <Badge key={sensor} variant="outline" className="text-[10px] py-0">
                                    {SENSOR_CONFIGS[sensor as keyof typeof SENSOR_CONFIGS]?.label ?? sensor}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {alert.sensorDetails && (
                          <div className="rounded-md border bg-muted/20 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                              <Activity className="h-3.5 w-3.5 text-primary" />
                              Sensor Snapshot
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <span>Temperature: {alert.sensorDetails.temperature.toFixed(1)}°C</span>
                              <span>Humidity: {alert.sensorDetails.humidity.toFixed(1)}%</span>
                              <span>AQI: {alert.sensorDetails.airQuality.toFixed(1)}</span>
                              <span>Gas: {alert.sensorDetails.gas.toFixed(1)}</span>
                              <span>Motion: {alert.sensorDetails.motion}</span>
                              <span>Door: {alert.sensorDetails.door}</span>
                              <span>Light: {alert.sensorDetails.light.toFixed(1)} lux</span>
                            </div>
                          </div>
                        )}

                        {alert.modelDetails && (
                          <div className="rounded-md border bg-muted/20 p-3 space-y-1 text-xs">
                            <p>Prediction: <span className="font-semibold">{alert.modelDetails.prediction}</span></p>
                            <p>Prediction Index: {alert.modelDetails.predictionIndex ?? 'n/a'}</p>
                            <p>AI Analyzed: {alert.modelDetails.aiAnalyzed ? 'Yes' : 'No (safe-class skipped)'}</p>
                            <p>Model Source: {alert.modelDetails.modelSource}</p>
                            <p>LLM Source: {alert.modelDetails.llmSource}</p>
                            {alert.modelDetails.trace && (
                              <p>
                                Model Input:{' '}
                                {Object.entries(alert.modelDetails.trace.modelInput)
                                  .map(([label, value]) => `${label} ${value}`)
                                  .join(' | ')}
                              </p>
                            )}
                            {alert.modelDetails.probabilities && (
                              <p>
                                Probabilities:{' '}
                                {Object.entries(alert.modelDetails.probabilities)
                                  .map(([label, score]) => `${label} ${(score * 100).toFixed(1)}%`)
                                  .join(' | ')}
                              </p>
                            )}
                            <p>
                              SHAP:{' '}
                              {Object.entries(alert.modelDetails.shapValues)
                                .map(([label, score]) => `${label} ${score}%`)
                                .join(' | ')}
                            </p>
                            {alert.modelDetails.trace && (
                              <p>Summarizer Output: {alert.modelDetails.trace.summarizerOutput}</p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
