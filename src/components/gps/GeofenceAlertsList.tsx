import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, MapPin, ArrowRightFromLine, ArrowRightToLine } from 'lucide-react';
import { useGeofenceAlerts, GeofenceAlert } from '@/hooks/useGeofences';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';

export const GeofenceAlertsList = () => {
  const { alerts, unreadCount, isLoading, markAsRead, markAllAsRead } = useGeofenceAlerts();

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Geofence-alarmer
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
            <Check className="w-4 h-4 mr-2" />
            Marker alle som læst
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ingen alarmer endnu</p>
            <p className="text-sm mt-2">Alarmer vises her når køretøjer krydser geofence-grænser</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border rounded-lg transition-colors ${
                !alert.is_read ? 'bg-destructive/5 border-destructive/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    alert.alert_type === 'exit' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                  }`}>
                    {alert.alert_type === 'exit' ? (
                      <ArrowRightFromLine className="w-4 h-4" />
                    ) : (
                      <ArrowRightToLine className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {alert.alert_type === 'exit' ? 'Køretøj forlod' : 'Køretøj ankom til'}{' '}
                        {alert.geofence?.name || 'geofence'}
                      </span>
                      {!alert.is_read && (
                        <Badge variant="destructive" className="text-xs">Ny</Badge>
                      )}
                    </div>
                    {alert.geofence?.vehicle && (
                      <p className="text-sm text-muted-foreground">
                        {alert.geofence.vehicle.make} {alert.geofence.vehicle.model} ({alert.geofence.vehicle.registration})
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: da })}
                      </span>
                    </div>
                  </div>
                </div>
                {!alert.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead.mutate(alert.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
