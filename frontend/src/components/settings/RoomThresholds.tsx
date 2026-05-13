import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettingsStore, getDefaultThreshold } from '@/store/useSettingsStore';
import { SENSOR_CONFIGS } from '@/services/thresholds';
import { SensorType } from '@/types/sensor';
import { motion } from 'framer-motion';

interface RoomThresholdsProps {
  roomId: string;
  roomName: string;
}

export function RoomThresholds({ roomId, roomName }: RoomThresholdsProps) {
  const setRoomThreshold = useSettingsStore((s) => s.setRoomThreshold);
  const getRoomThreshold = useSettingsStore((s) => s.getRoomThreshold);
  const [savedMessage, setSavedMessage] = useState(false);

  const sensorTypes: SensorType[] = ['temperature', 'humidity', 'airQuality', 'gas', 'light'];

  const handleThresholdChange = (
    sensorType: SensorType,
    field: string,
    value: number
  ) => {
    const current = getRoomThreshold(roomId, sensorType) || getDefaultThreshold(sensorType);
    setRoomThreshold(roomId, sensorType, {
      ...current,
      [field]: value,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const resetToDefaults = (sensorType: SensorType) => {
    const defaults = getDefaultThreshold(sensorType);
    setRoomThreshold(roomId, sensorType, defaults);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{roomName}</h3>
          <p className="text-sm text-muted-foreground">Configure sensor thresholds for this room</p>
        </div>
        {savedMessage && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
          >
            <Check className="h-4 w-4" />
            Saved
          </motion.div>
        )}
      </div>

      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="temperature">Temp</TabsTrigger>
          <TabsTrigger value="humidity">Humidity</TabsTrigger>
          <TabsTrigger value="airQuality">Air Quality</TabsTrigger>
          <TabsTrigger value="gas">Gas</TabsTrigger>
          <TabsTrigger value="light">Light</TabsTrigger>
        </TabsList>

        {sensorTypes.map((sensorType) => {
          const config = SENSOR_CONFIGS[sensorType];
          const thresholds = getRoomThreshold(roomId, sensorType) || getDefaultThreshold(sensorType);

          return (
            <TabsContent key={sensorType} value={sensorType} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <CardDescription>Unit: {config.unit || 'N/A'}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetToDefaults(sensorType)}
                    >
                      Reset to Default
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Warning Thresholds */}
                  <div className="space-y-4 pb-6 border-b">
                    <h4 className="font-medium text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warning Thresholds
                    </h4>

                    {thresholds.warningLow !== undefined && (
                      <div className="space-y-2">
                        <Label className="text-xs">Warning Low ({config.unit})</Label>
                        <div className="flex gap-3 items-center">
                          <Slider
                            value={[thresholds.warningLow]}
                            onValueChange={(val) =>
                              handleThresholdChange(sensorType, 'warningLow', val[0])
                            }
                            min={config.min}
                            max={config.max}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={thresholds.warningLow}
                            onChange={(e) =>
                              handleThresholdChange(
                                sensorType,
                                'warningLow',
                                parseFloat(e.target.value)
                              )
                            }
                            min={config.min}
                            max={config.max}
                            className="w-16 h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">Warning High ({config.unit})</Label>
                      <div className="flex gap-3 items-center">
                        <Slider
                          value={[thresholds.warningHigh]}
                          onValueChange={(val) =>
                            handleThresholdChange(sensorType, 'warningHigh', val[0])
                          }
                          min={config.min}
                          max={config.max}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={thresholds.warningHigh}
                          onChange={(e) =>
                            handleThresholdChange(
                              sensorType,
                              'warningHigh',
                              parseFloat(e.target.value)
                            )
                          }
                          min={config.min}
                          max={config.max}
                          className="w-16 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Critical Thresholds */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Critical Thresholds
                    </h4>

                    {thresholds.criticalLow !== undefined && (
                      <div className="space-y-2">
                        <Label className="text-xs">Critical Low ({config.unit})</Label>
                        <div className="flex gap-3 items-center">
                          <Slider
                            value={[thresholds.criticalLow]}
                            onValueChange={(val) =>
                              handleThresholdChange(sensorType, 'criticalLow', val[0])
                            }
                            min={config.min}
                            max={config.max}
                            step={1}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={thresholds.criticalLow}
                            onChange={(e) =>
                              handleThresholdChange(
                                sensorType,
                                'criticalLow',
                                parseFloat(e.target.value)
                              )
                            }
                            min={config.min}
                            max={config.max}
                            className="w-16 h-8 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">Critical High ({config.unit})</Label>
                      <div className="flex gap-3 items-center">
                        <Slider
                          value={[thresholds.criticalHigh]}
                          onValueChange={(val) =>
                            handleThresholdChange(sensorType, 'criticalHigh', val[0])
                          }
                          min={config.min}
                          max={config.max}
                          step={1}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={thresholds.criticalHigh}
                          onChange={(e) =>
                            handleThresholdChange(
                              sensorType,
                              'criticalHigh',
                              parseFloat(e.target.value)
                            )
                          }
                          min={config.min}
                          max={config.max}
                          className="w-16 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <AlertDescription className="text-xs text-blue-900 dark:text-blue-200">
                      Thresholds are automatically saved. Critical values will trigger immediate alerts.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
