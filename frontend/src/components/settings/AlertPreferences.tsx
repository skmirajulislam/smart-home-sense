import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Volume2, MessageSquare, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { motion } from 'framer-motion';

export function AlertPreferences() {
  const alertPreferences = useSettingsStore((s) => s.alertPreferences);
  const setAlertPreferences = useSettingsStore((s) => s.setAlertPreferences);

  const preferences = [
    {
      key: 'enableNotifications' as const,
      label: 'Desktop Notifications',
      description: 'Receive desktop notifications for alerts',
      icon: Bell,
    },
    {
      key: 'enableSound' as const,
      label: 'Alert Sounds',
      description: 'Play sound when critical alerts occur',
      icon: Volume2,
    },
    {
      key: 'enableToast' as const,
      label: 'Toast Messages',
      description: 'Show toast messages for all alerts',
      icon: MessageSquare,
    },
    {
      key: 'enableCriticalAlerts' as const,
      label: 'Critical Alerts Only',
      description: 'Only show critical severity alerts',
      icon: AlertTriangle,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Alert Preferences</CardTitle>
          <CardDescription>
            Configure how and when you receive alerts from your smart home system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferences.map((pref) => {
            const Icon = pref.icon;
            return (
              <motion.div
                key={pref.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between space-x-3 pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium cursor-pointer">{pref.label}</Label>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
                <Switch
                  checked={alertPreferences[pref.key]}
                  onCheckedChange={(checked) =>
                    setAlertPreferences({ [pref.key]: checked })
                  }
                  className="ml-auto"
                />
              </motion.div>
            );
          })}

          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <AlertDescription className="text-xs text-green-900 dark:text-green-200">
              Your preferences are automatically saved and will apply to all rooms.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </motion.div>
  );
}
