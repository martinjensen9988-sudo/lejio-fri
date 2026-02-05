import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Eye, Calendar, 
  CheckCircle, Clock, ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface FleetContract {
  id: string;
  contract_number: string;
  created_at: string;
  signed_at: string | null;
  contract_url: string | null;
  status: string;
  booking?: {
    vehicle?: {
      make: string;
      model: string;
      registration: string;
    };
  };
}

export const FleetDocumentsCard = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<FleetContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContracts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          created_at,
          signed_at,
          contract_url,
          status,
          booking:bookings(
            vehicle:vehicles(make, model, registration)
          )
        `)
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setContracts((data || []) as unknown as FleetContract[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Kunne ikke hente kontrakter');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  const handleDownload = async (contractUrl: string | null, contractNumber: string) => {
    if (!contractUrl) {
      toast.error('Kontraktfil ikke tilgængelig');
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('contracts')
        .createSignedUrl(contractUrl, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast.error('Kunne ikke hente kontrakt');
      }
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast.error('Kunne ikke downloade kontrakt');
    }
  };

  return (
    <Card className="bg-card rounded-2xl shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Dokumenter
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            Henter dokumenter...
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Ingen kontrakter endnu</p>
            <p className="text-sm">Dine underskrevne Fleet-kontrakter vises her</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{contract.contract_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.booking?.vehicle && (
                        <span>
                          {contract.booking.vehicle.make} {contract.booking.vehicle.model} ({contract.booking.vehicle.registration})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(contract.created_at), 'd. MMM yyyy', { locale: da })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={contract.signed_at ? 'default' : 'outline'}
                    className="gap-1"
                  >
                    {contract.signed_at ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Underskrevet
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Afventer
                      </>
                    )}
                  </Badge>
                  {contract.contract_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(contract.contract_url, contract.contract_number)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
