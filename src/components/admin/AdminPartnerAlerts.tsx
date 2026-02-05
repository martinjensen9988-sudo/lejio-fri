import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, Calendar, Clock, Users, 
  CheckCircle, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format, differenceInDays, addMonths } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FleetPartner {
  id: string;
  email: string;
  company_name: string | null;
  full_name: string | null;
  fleet_plan: string | null;
  fleet_contract_start_date: string | null;
  fleet_contract_months: number | null;
  fleet_contract_expires_at: string | null;
}

interface PartnerAlert {
  partner: FleetPartner;
  daysUntilExpiry: number;
  expiryDate: Date;
  alertLevel: 'warning' | 'critical' | 'expired';
}

export const AdminPartnerAlerts = () => {
  const [alerts, setAlerts] = useState<PartnerAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, company_name, full_name, fleet_plan, fleet_contract_start_date, fleet_contract_months, fleet_contract_expires_at')
        .not('fleet_plan', 'is', null);

      if (error) throw error;

      const today = new Date();
      const partnerAlerts: PartnerAlert[] = [];

      (data || []).forEach((partner: FleetPartner) => {
        let expiryDate: Date;

        if (partner.fleet_contract_expires_at) {
          expiryDate = new Date(partner.fleet_contract_expires_at);
        } else if (partner.fleet_contract_start_date && partner.fleet_contract_months) {
          expiryDate = addMonths(new Date(partner.fleet_contract_start_date), partner.fleet_contract_months);
        } else {
          // Default: 12 months from now if no contract info
          return;
        }

        const daysUntilExpiry = differenceInDays(expiryDate, today);

        // Only show alerts for contracts expiring within 90 days or already expired
        if (daysUntilExpiry <= 90) {
          let alertLevel: 'warning' | 'critical' | 'expired';
          if (daysUntilExpiry < 0) {
            alertLevel = 'expired';
          } else if (daysUntilExpiry <= 30) {
            alertLevel = 'critical';
          } else {
            alertLevel = 'warning';
          }

          partnerAlerts.push({
            partner,
            daysUntilExpiry,
            expiryDate,
            alertLevel,
          });
        }
      });

      // Sort by urgency (most urgent first)
      partnerAlerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      setAlerts(partnerAlerts);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Kunne ikke hente partnerdata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const getAlertStyles = (level: 'warning' | 'critical' | 'expired') => {
    switch (level) {
      case 'expired':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/20',
          icon: 'text-destructive',
          badge: 'destructive' as const,
        };
      case 'critical':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          icon: 'text-amber-500',
          badge: 'default' as const,
        };
      case 'warning':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          icon: 'text-blue-500',
          badge: 'secondary' as const,
        };
    }
  };

  const expiredCount = alerts.filter(a => a.alertLevel === 'expired').length;
  const criticalCount = alerts.filter(a => a.alertLevel === 'critical').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Kontraktudløb
            </CardTitle>
            <CardDescription>
              Partnere med kontrakter der udløber snart
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {expiredCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {expiredCount} udløbet
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge className="gap-1 bg-amber-500">
                <Clock className="w-3 h-3" />
                {criticalCount} snart
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Henter partnerdata...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-500" />
            <p>Ingen kontraktalarmer</p>
            <p className="text-sm">Alle partnere har mere end 90 dage til udløb</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const styles = getAlertStyles(alert.alertLevel);
              return (
                <div
                  key={alert.partner.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    styles.bg,
                    styles.border
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", styles.bg)}>
                      <AlertTriangle className={cn("w-5 h-5", styles.icon)} />
                    </div>
                    <div>
                      <p className="font-medium">
                        {alert.partner.company_name || alert.partner.full_name || 'Ukendt'}
                      </p>
                      <p className="text-sm text-muted-foreground">{alert.partner.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={styles.badge}>
                        {alert.alertLevel === 'expired' 
                          ? `Udløbet for ${Math.abs(alert.daysUntilExpiry)} dage siden`
                          : `${alert.daysUntilExpiry} dage tilbage`
                        }
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(alert.expiryDate, 'd. MMMM yyyy', { locale: da })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
