import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ScanLine, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Car,
  ChevronRight
} from 'lucide-react';
import { useVehicleScan } from '@/hooks/useVehicleScan';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VehicleScanHistoryProps {
  bookingId?: string;
  vehicleId?: string;
}

const SEVERITY_CONFIG = {
  minor: { label: 'Mindre', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  moderate: { label: 'Moderat', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-100' },
  severe: { label: 'Alvorlig', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-100' },
};

export const VehicleScanHistory = ({ bookingId, vehicleId }: VehicleScanHistoryProps) => {
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [selectedSession, setSelectedSession] = useState<unknown>(null);
  const [sessionDetails, setSessionDetails] = useState<unknown>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { getScanSessionsForBooking, getScanSessionDetails, getScanDamagesForVehicle } = useVehicleScan();

  useEffect(() => {
    const loadSessions = async () => {
      if (bookingId) {
        const data = await getScanSessionsForBooking(bookingId);
        setSessions(data);
      } else if (vehicleId) {
        const data = await getScanDamagesForVehicle(vehicleId);
        setSessions(data);
      }
    };
    loadSessions();
  }, [bookingId, vehicleId]);

  const handleViewDetails = async (session: unknown) => {
    setSelectedSession(session);
    const details = await getScanSessionDetails(session.id);
    setSessionDetails(details);
    setShowDetails(true);
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ScanLine className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Ingen skanninger endnu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="w-5 h-5" />
            Skanningshistorik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  session.has_severe_damage ? "bg-red-100" :
                  session.total_damages_found > 0 ? "bg-amber-100" : "bg-green-100"
                )}>
                  {session.has_severe_damage ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : session.total_damages_found > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {session.scan_type === 'check_in' ? 'Check-in' : 'Check-out'} scanning
                    </span>
                    <Badge variant={session.total_damages_found > 0 ? 'destructive' : 'secondary'}>
                      {session.total_damages_found} skader
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(session.created_at), 'PPp', { locale: da })}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(session)}>
                <Eye className="w-4 h-4 mr-1" />
                Vis
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Skanningsdetaljer
            </DialogTitle>
          </DialogHeader>

          {sessionDetails && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-1">
                {/* Summary */}
                <Card className={cn(
                  "border-2",
                  sessionDetails.session.has_severe_damage ? "border-red-300 bg-red-50" :
                  sessionDetails.session.total_damages_found > 0 ? "border-amber-300 bg-amber-50" :
                  "border-green-300 bg-green-50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {sessionDetails.session.has_severe_damage ? (
                        <XCircle className="w-8 h-8 text-red-600" />
                      ) : sessionDetails.session.total_damages_found > 0 ? (
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {sessionDetails.session.total_damages_found === 0 
                            ? 'Ingen skader fundet' 
                            : `${sessionDetails.session.total_damages_found} skader fundet`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sessionDetails.areas.length} områder skannet
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Areas */}
                {sessionDetails.areas.map((area: unknown) => {
                  const areaDamages = sessionDetails.damages.filter(
                    (d: unknown) => d.scan_area_id === area.id
                  );
                  return (
                    <Card key={area.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{area.area_label}</span>
                          </div>
                          <Badge variant={areaDamages.length > 0 ? 'destructive' : 'secondary'}>
                            {areaDamages.length > 0 ? `${areaDamages.length} skader` : 'OK'}
                          </Badge>
                        </div>

                        {area.image_url && (
                          <img
                            src={area.image_url}
                            alt={area.area_label}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                        )}

                        {areaDamages.length > 0 && (
                          <div className="space-y-2">
                            {areaDamages.map((damage: unknown) => (
                              <div
                                key={damage.id}
                                className={cn(
                                  "p-2 rounded-lg border",
                                  SEVERITY_CONFIG[damage.severity as keyof typeof SEVERITY_CONFIG]?.bgLight || 'bg-muted'
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full mt-1.5",
                                    SEVERITY_CONFIG[damage.severity as keyof typeof SEVERITY_CONFIG]?.color || 'bg-gray-500'
                                  )} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm capitalize">
                                        {damage.damage_type}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {SEVERITY_CONFIG[damage.severity as keyof typeof SEVERITY_CONFIG]?.label || damage.severity}
                                      </Badge>
                                    </div>
                                    {damage.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {damage.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
