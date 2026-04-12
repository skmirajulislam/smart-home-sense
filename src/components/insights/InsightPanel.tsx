import { AIInsight } from '@/types/insight';
import { AlertTriangle, Brain, Shield, Lightbulb, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SENSOR_CONFIGS } from '@/services/thresholds';

const severityStyles = {
  info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: CheckCircle, iconColor: 'text-blue-400' },
  warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: AlertTriangle, iconColor: 'text-amber-400' },
  critical: { border: 'border-rose-500/30', bg: 'bg-rose-500/5', icon: AlertTriangle, iconColor: 'text-rose-400' },
};

export function InsightPanel({ insights }: { insights: AIInsight[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">AI Insights</h2>
      </div>

      <AnimatePresence mode="popLayout">
        {insights.map((insight) => {
          const style = severityStyles[insight.severity];
          const SevIcon = style.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={cn('rounded-xl border p-4 space-y-3', style.border, style.bg)}
            >
              <div className="flex items-start gap-2">
                <SevIcon className={cn('h-4 w-4 mt-0.5 shrink-0', style.iconColor)} />
                <h3 className="font-semibold text-sm">{insight.event}</h3>
              </div>

              <div className="space-y-2 pl-6">
                <InsightRow icon={Info} label="Why" text={insight.reasoning} />
                <InsightRow icon={Shield} label="Impact" text={insight.impact} />
                <InsightRow icon={Lightbulb} label="Action" text={insight.suggestion} />
              </div>

              {insight.contributingSensors.length > 0 && (
                <div className="flex gap-1.5 pl-6 flex-wrap">
                  {insight.contributingSensors.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px] py-0">
                      {SENSOR_CONFIGS[s].label}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function InsightRow({ icon: Icon, label, text }: { icon: React.ComponentType<{ className?: string }>; label: string; text: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <span className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</span>
        <p className="text-xs leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
