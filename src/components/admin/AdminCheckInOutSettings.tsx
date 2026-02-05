import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, Camera, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface Lessor {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  check_in_out_enabled: boolean;
}

export const AdminCheckInOutSettings = () => {
  const [lessors, setLessors] = useState<Lessor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLessors();
  }, []);

  const fetchLessors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, check_in_out_enabled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessors(data || []);
    } catch (err) {
      console.error('Error fetching lessors:', err);
      toast.error('Kunne ikke hente udlejere');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCheckInOut = async (lessorId: string, enabled: boolean) => {
    setUpdatingId(lessorId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ check_in_out_enabled: enabled })
        .eq('id', lessorId);

      if (error) throw error;

      setLessors(prev => prev.map(l => 
        l.id === lessorId ? { ...l, check_in_out_enabled: enabled } : l
      ));

      toast.success(`Check-in/out ${enabled ? 'aktiveret' : 'deaktiveret'}`);
    } catch (err) {
      console.error('Error updating check-in/out status:', err);
      toast.error('Kunne ikke opdatere indstilling');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLessors = lessors.filter(lessor => {
    const query = searchQuery.toLowerCase();
    return (
      lessor.email.toLowerCase().includes(query) ||
      (lessor.full_name?.toLowerCase().includes(query)) ||
      (lessor.company_name?.toLowerCase().includes(query))
    );
  });

  const enabledCount = lessors.filter(l => l.check_in_out_enabled).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Check-in/Check-out Modul
          </CardTitle>
          <CardDescription>
            Aktiver eller deaktiver check-in/check-out funktionen for individuelle udlejere.
            Når aktiveret kan udlejere bruge AI-baseret dashboard-analyse og automatisk afregning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {enabledCount} af {lessors.length} aktiveret
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg efter udlejer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Udlejer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Check-in/out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessors.map((lessor) => (
                  <TableRow key={lessor.id}>
                    <TableCell className="font-medium">
                      {lessor.company_name || lessor.full_name || 'Ikke angivet'}
                    </TableCell>
                    <TableCell>{lessor.email}</TableCell>
                    <TableCell>
                      {lessor.check_in_out_enabled ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktiveret
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Deaktiveret
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {updatingId === lessor.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        <Switch
                          checked={lessor.check_in_out_enabled}
                          onCheckedChange={(checked) => toggleCheckInOut(lessor.id, checked)}
                          disabled={updatingId === lessor.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLessors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Ingen udlejere fundet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
