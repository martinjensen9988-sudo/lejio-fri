import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, MapPin, Shield, CircleDot } from 'lucide-react';
import { useGeofences, Geofence } from '@/hooks/useGeofences';

interface GeofenceListProps {
  onSelectGeofence?: (geofence: Geofence) => void;
  selectedGeofenceId?: string;
}

export const GeofenceList = ({ onSelectGeofence, selectedGeofenceId }: GeofenceListProps) => {
  const navigate = useNavigate();
  const { geofences, isLoading, updateGeofence, deleteGeofence } = useGeofences();

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
            <Shield className="w-5 h-5" />
            Geofences
          </CardTitle>
          <Button onClick={() => navigate('/gps/add-geofence')} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ny geofence
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {geofences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen geofences oprettet</p>
              <p className="text-sm mt-2">Opret en geofence for at modtage alarmer</p>
            </div>
          ) : (
            geofences.map((geofence) => (
              <div
                key={geofence.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedGeofenceId === geofence.id ? 'border-primary bg-accent/30' : ''
                }`}
                onClick={() => onSelectGeofence?.(geofence)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{geofence.name}</span>
                      <Badge variant={geofence.is_active ? 'default' : 'secondary'}>
                        {geofence.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    {geofence.vehicle && (
                      <p className="text-sm text-muted-foreground">
                        {geofence.vehicle.make} {geofence.vehicle.model} ({geofence.vehicle.registration})
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <CircleDot className="w-3 h-3" />
                        Radius: {geofence.radius_meters}m
                      </span>
                      {geofence.alert_on_exit && (
                        <Badge variant="outline" className="text-xs">Udkørsel</Badge>
                      )}
                      {geofence.alert_on_enter && (
                        <Badge variant="outline" className="text-xs">Indkørsel</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={geofence.is_active}
                      onCheckedChange={(checked) =>
                        updateGeofence.mutate({ id: geofence.id, is_active: checked })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Er du sikker på at du vil slette denne geofence?')) {
                          deleteGeofence.mutate(geofence.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
};
