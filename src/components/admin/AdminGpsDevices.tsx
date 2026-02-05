import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface GpsDevice {
  id: string;
  device_id: string;
  device_name: string | null;
  provider: string;
  is_active: boolean;
  last_seen_at: string | null;
  webhook_secret: string | null;
  vehicle_id: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
    owner_id: string;
  };
  owner?: {
    email: string;
    company_name: string | null;
    full_name: string | null;
  };
}

const AdminGpsDevices = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<GpsDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('gps_devices')
        .select(`
          *,
          vehicle:vehicles(make, model, registration, owner_id)
        `)
        .order('created_at', { ascending: false });

      if (devicesError) {
        console.error('Error fetching devices:', devicesError);
        toast.error('Kunne ikke hente GPS enheder');
        setDevices([]);
      } else if (devicesData) {
        const ownerIds = [...new Set(devicesData.map(d => d.vehicle?.owner_id).filter(Boolean))] as string[];

        if (ownerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email, company_name, full_name')
            .in('id', ownerIds);

          const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          const devicesWithOwners = devicesData.map(device => ({
            ...device,
            owner: device.vehicle?.owner_id ? profileMap.get(device.vehicle.owner_id) : undefined,
          }));

          setDevices(devicesWithOwners);
        } else {
          setDevices(devicesData);
        }
      }
    } catch (err: unknown) {
      console.error('AdminGpsDevices fetchData failed:', err);
      toast.error(err?.message || 'Kunne ikke hente GPS data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Er du sikker på, at du vil slette denne GPS-enhed?')) return;

    const { error } = await supabase
      .from('gps_devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      toast.error('Kunne ikke slette GPS-enhed');
    } else {
      toast.success('GPS-enhed slettet');
      fetchData();
    }
  };

  const filteredDevices = devices.filter(d =>
    d.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.device_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.vehicle?.registration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.owner?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              GPS-enheder
            </CardTitle>
            <CardDescription>Administrer GPS-trackere for udlejere</CardDescription>
          </div>
          <Button onClick={() => navigate('/admin/gps/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj GPS-enhed
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Søg efter device ID, nummerplade, udlejer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ingen GPS-enheder fundet</p>
            <Button className="mt-4" onClick={() => navigate('/admin/gps/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj GPS-enhed
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enhed</TableHead>
                <TableHead>Køretøj</TableHead>
                <TableHead>Udlejer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sidst set</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{device.device_name || device.device_id}</p>
                      <p className="text-sm text-muted-foreground">{device.provider}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {device.vehicle ? (
                      <div>
                        <p>{device.vehicle.make} {device.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{device.vehicle.registration}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.owner ? (
                      <div>
                        <p>{device.owner.company_name || device.owner.full_name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{device.owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={device.is_active ? 'default' : 'secondary'}>
                      {device.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.last_seen_at ? (
                      format(new Date(device.last_seen_at), 'dd. MMM yyyy HH:mm', { locale: da })
                    ) : (
                      <span className="text-muted-foreground">Aldrig</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(device.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminGpsDevices;
