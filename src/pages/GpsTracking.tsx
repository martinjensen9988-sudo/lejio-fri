import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGpsDevices, GpsDeviceWithLatest } from '@/hooks/useGpsDevices';
import { useGeofences, useGeofenceAlerts } from '@/hooks/useGeofences';
import { useMessages } from '@/hooks/useMessages';
import Navigation from '@/components/Navigation';
import { GpsDeviceList } from '@/components/gps/GpsDeviceList';
import { GpsTrackingMap } from '@/components/gps/GpsTrackingMap';
import { GeofenceList } from '@/components/gps/GeofenceList';
import { GeofenceAlertsList } from '@/components/gps/GeofenceAlertsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, MapPin, Shield, Bell, Navigation as NavIcon, HelpCircle, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const GpsTracking = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { devices, isLoading } = useGpsDevices();
  const { geofences } = useGeofences();
  const { unreadCount } = useGeofenceAlerts();
  const { startConversation } = useMessages();
  const [selectedDevice, setSelectedDevice] = useState<GpsDeviceWithLatest | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const handleContactSupport = async () => {
    setStartingChat(true);
    try {
      const conversationId = await startConversation(user!.id, true);
      if (conversationId) {
        toast.success('Chat startet med support');
        navigate('/messages');
      }
    } catch (error) {
      toast.error('Kunne ikke starte chat');
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const hasDevices = devices.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">GPS-sporing</h1>
            <p className="text-muted-foreground">Sikkerhed og dokumentation for dine køretøjer</p>
          </div>
        </div>

        <Tabs defaultValue="tracking" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tracking" className="gap-2">
              <MapPin className="w-4 h-4" />
              Sporing
            </TabsTrigger>
            <TabsTrigger value="geofences" className="gap-2">
              <Shield className="w-4 h-4" />
              Zoner
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              Alarmer
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GpsTrackingMap
                  devices={devices}
                  selectedDevice={selectedDevice}
                  onSelectDevice={setSelectedDevice}
                  geofences={geofences}
                />
              </div>
              <div className="space-y-4">
                <GpsDeviceList
                  onSelectDevice={setSelectedDevice}
                  selectedDeviceId={selectedDevice?.id}
                  showAddButton={true}
                />
                
                {/* Help card */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm">
                          Brug for hjælp til opsætning? Vi kan sætte det op for dig.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleContactSupport} 
                          disabled={startingChat}
                        >
                          {startingChat ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <MessageCircle className="w-4 h-4 mr-2" />
                          )}
                          Få hjælp til opsætning
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="geofences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GeofenceList />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Hvad er en zone?
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    En zone (geofence) er et virtuelt område på kortet. Du får automatisk en alarm, når et køretøj forlader eller ankommer til zonen.
                  </p>
                  <p>
                    <strong>Eksempel:</strong> Opret en zone rundt om din adresse, så du får besked hvis bilen kører væk uden tilladelse.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <GeofenceAlertsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GpsTracking;