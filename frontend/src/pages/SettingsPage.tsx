import { useRoomStore } from '@/store/useRoomStore';
import { RoomThresholds } from '@/components/settings/RoomThresholds';
import { AlertPreferences } from '@/components/settings/AlertPreferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sliders, Bell, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const rooms = useRoomStore((s) => s.rooms);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Header */}
          <motion.div variants={item}>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Settings</h1>
              <p className="text-muted-foreground">
                Manage sensor thresholds, alert preferences, and system configuration
              </p>
            </div>
          </motion.div>

          {/* Information Card */}
          <motion.div variants={item}>
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-200">How Settings Work</CardTitle>
                    <CardDescription className="text-blue-800 dark:text-blue-300">
                      Configure sensor thresholds for each room individually. When sensor readings exceed these thresholds,
                      alerts will be triggered based on your alert preferences.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Alert Preferences Section */}
          <motion.div variants={item}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Alert Configuration</h2>
              </div>
              <Separator />
              <AlertPreferences />
            </div>
          </motion.div>

          {/* Room Thresholds Section */}
          <motion.div variants={item}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Room Sensor Thresholds</h2>
              </div>
              <Separator />

              {rooms.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No rooms configured. Add a room from the dashboard to configure thresholds.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      variants={item}
                      transition={{ delay: 0.1 * (index + 1) }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {room.name}
                            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {room.id}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <RoomThresholds roomId={room.id} roomName={room.name} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer Info */}
          <motion.div variants={item}>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground text-center">
                  All settings are automatically saved to your browser's local storage and persist across sessions.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
