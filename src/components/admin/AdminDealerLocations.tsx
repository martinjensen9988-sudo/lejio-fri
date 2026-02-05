import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  MapPin, Search, Loader2, Building2, Users, ChevronRight
} from 'lucide-react';
import { DealerLocationsManager } from '@/components/dealer/DealerLocationsManager';

interface Partner {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  user_type: string;
}

const AdminDealerLocations = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [locationCounts, setLocationCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      // Fetch partners (dealers)
      const { data: partnersData, error: partnersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, user_type')
        .in('user_type', ['professionel', 'privat'])
        .order('company_name');

      if (partnersError) throw partnersError;
      setPartners(partnersData || []);

      // Fetch location counts per partner
      interface LocationRecord {
        partner_id: string;
      }
      const { data: locationsData, error: locationsError } = await supabase
        .from('dealer_locations')
        .select('partner_id');

      if (locationsError) throw locationsError;

      const counts: Record<string, number> = {};
      ((locationsData || []) as LocationRecord[]).forEach(loc => {
        counts[loc.partner_id] = (counts[loc.partner_id] || 0) + 1;
      });
      setLocationCounts(counts);

    } catch (err) {
      console.error('Error fetching data:', err instanceof Error ? err.message : 'Unknown error');
      toast.error('Kunne ikke hente data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = 
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || p.user_type === filterType;
    
    return matchesSearch && matchesType;
  });

  // If a partner is selected, show their locations
  if (selectedPartnerId) {
    const partner = partners.find(p => p.id === selectedPartnerId);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSelectedPartnerId(null)}>
            ← Tilbage
          </Button>
          <span className="text-muted-foreground">|</span>
          <span className="font-medium">{partner?.company_name || partner?.full_name || partner?.email}</span>
        </div>
        
        <DealerLocationsManager partnerId={selectedPartnerId} isAdmin />
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partners.length}</p>
                <p className="text-sm text-muted-foreground">Partnere</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(locationCounts).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Lokationer i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(locationCounts).length}
                </p>
                <p className="text-sm text-muted-foreground">Partnere med lokationer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Forhandler Lokationer</CardTitle>
          <CardDescription>Administrer lokationer for alle forhandlere</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg efter partner..."
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="professionel">Professionel</SelectItem>
                <SelectItem value="privat">Privat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Lokationer</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow 
                  key={partner.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedPartnerId(partner.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {partner.company_name || partner.full_name || 'Unavngivet'}
                      </p>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.user_type === 'professionel' ? 'default' : 'secondary'}>
                      {partner.user_type === 'professionel' ? 'Professionel' : 'Privat'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <MapPin className="w-3 h-3 mr-1" />
                      {locationCounts[partner.id] || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {filteredPartners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Ingen partnere fundet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDealerLocations;
