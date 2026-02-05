import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, MoreHorizontal, CheckCircle, 
  XCircle, TrendingDown, Car
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface CoverageShortfall {
  id: string;
  vehicle_id: string;
  lessor_id: string;
  month: string;
  required_amount: number;
  earned_amount: number;
  shortfall_amount: number;
  status: 'pending' | 'covered' | 'written_off';
  notes: string | null;
  created_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
  lessor?: {
    company_name: string | null;
    full_name: string | null;
  };
}

export const AdminCoverageShortfalls = () => {
  const [shortfalls, setShortfalls] = useState<CoverageShortfall[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShortfalls = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fleet_coverage_shortfalls')
        .select(`
          *,
          vehicle:vehicles(make, model, registration),
          lessor:profiles!fleet_coverage_shortfalls_lessor_id_fkey(company_name, full_name)
        `)
        .order('month', { ascending: false });

      if (error) throw error;
      setShortfalls((data || []) as unknown as CoverageShortfall[]);
    } catch (error) {
      console.error('Error fetching shortfalls:', error);
      toast.error('Kunne ikke hente dækningsmangler');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShortfalls();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'covered' | 'written_off') => {
    try {
      const { error } = await supabase
        .from('fleet_coverage_shortfalls')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Status opdateret til ${newStatus === 'covered' ? 'dækket' : 'afskrevet'}`);
      fetchShortfalls();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Kunne ikke opdatere status');
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy', { locale: da });
  };

  const totalShortfall = shortfalls
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.shortfall_amount, 0);

  const pendingCount = shortfalls.filter(s => s.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Manglende dækning
            </CardTitle>
            <CardDescription>
              Biler der ikke tjener nok til at dække låneafdrag
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <>
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {pendingCount} udestående
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {formatCurrency(totalShortfall)} kr mangler
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Henter data...
          </div>
        ) : shortfalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-500" />
            <p>Ingen dækningsmangler</p>
            <p className="text-sm">Alle køretøjer tjener nok til at dække deres afdrag</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Køretøj</TableHead>
                <TableHead>Udlejer</TableHead>
                <TableHead>Måned</TableHead>
                <TableHead className="text-right">Krævet</TableHead>
                <TableHead className="text-right">Tjent</TableHead>
                <TableHead className="text-right">Mangler</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortfalls.map((shortfall) => (
                <TableRow key={shortfall.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {shortfall.vehicle?.make} {shortfall.vehicle?.model}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {shortfall.vehicle?.registration}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {shortfall.lessor?.company_name || shortfall.lessor?.full_name || 'Ukendt'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatMonth(shortfall.month)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(shortfall.required_amount)} kr
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(shortfall.earned_amount)} kr
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    -{formatCurrency(shortfall.shortfall_amount)} kr
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        shortfall.status === 'covered' ? 'default' :
                        shortfall.status === 'written_off' ? 'secondary' : 'destructive'
                      }
                    >
                      {shortfall.status === 'pending' ? 'Udestående' :
                       shortfall.status === 'covered' ? 'Dækket' : 'Afskrevet'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shortfall.status === 'pending' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(shortfall.id, 'covered')}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Marker som dækket
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(shortfall.id, 'written_off')}>
                            <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                            Afskriv
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
