import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, MapPin, Navigation, Gauge, Clock, Plus, Settings } from 'lucide-react';
import { useGpsDevices, GpsDeviceWithLatest } from '@/hooks/useGpsDevices';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

interface GpsDeviceListProps {
  onSelectDevice?: (device: GpsDeviceWithLatest) => void;
  selectedDeviceId?: string;
  showAddButton?: boolean;
}

export const GpsDeviceList = ({ onSelectDevice, selectedDeviceId, showAddButton = true }: GpsDeviceListProps) => {
  const navigate = useNavigate();
  const { devices, isLoading, updateDevice, deleteDevice } = useGpsDevices();

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      teltonika: 'Teltonika',
      ruptela: 'Ruptela',
      autopi: 'AutoPi',
      generic: 'Generisk',
    };
    return labels[provider] || provider;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            GPS-enheder
          </CardTitle>
          {showAddButton && (
            <Button onClick={() => navigate('/gps/add-device')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Tilføj enhed
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Navigation className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen GPS-enheder tilføjet endnu</p>
              <p className="text-sm mt-2">Tilføj en enhed for at begynde sporing</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedDeviceId === device.id ? 'border-primary bg-accent/30' : ''
                }`}
                onClick={() => onSelectDevice?.(device)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {device.device_name || device.device_id}
                      </span>
                      <Badge variant={device.is_active ? 'default' : 'secondary'}>
                        {device.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Badge variant="outline">{getProviderLabel(device.provider)}</Badge>
                    </div>
                    {device.vehicle && (
                      <p className="text-sm text-muted-foreground">
                        {device.vehicle.make} {device.vehicle.model} ({device.vehicle.registration})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={device.is_active}
                      onCheckedChange={(checked) =>
                        updateDevice.mutate({ id: device.id, is_active: checked })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Er du sikker på at du vil slette denne enhed?')) {
                          deleteDevice.mutate(device.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {device.latest_position && (
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {device.latest_position.latitude.toFixed(5)}, {device.latest_position.longitude.toFixed(5)}
                      </span>
                    </div>
                    {device.latest_position.speed !== null && (
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        <span>{Math.round(device.latest_position.speed)} km/t</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDistanceToNow(new Date(device.latest_position.recorded_at), {
                          addSuffix: true,
                          locale: da,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {!device.latest_position && device.last_seen_at && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sidst set: {formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true, locale: da })}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
};
