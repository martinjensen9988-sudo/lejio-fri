import { RenterWarning, WARNING_REASON_LABELS } from '@/hooks/useRenterWarnings';
import { AlertTriangle, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface RenterWarningAlertProps {
  warnings: RenterWarning[];
}

const getSeverityColor = (severity: number) => {
  if (severity <= 2) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700';
  if (severity <= 3) return 'bg-orange-500/10 border-orange-500/30 text-orange-700';
  return 'bg-red-500/10 border-red-500/30 text-red-700';
};

const getSeverityBadge = (severity: number) => {
  if (severity <= 2) return 'bg-yellow-500';
  if (severity <= 3) return 'bg-orange-500';
  return 'bg-red-500';
};

export const RenterWarningAlert = ({ warnings }: RenterWarningAlertProps) => {
  if (warnings.length === 0) return null;

  const maxSeverity = Math.max(...warnings.map(w => w.severity));
  const containerClass = getSeverityColor(maxSeverity);

  return (
    <div className={`rounded-xl border-2 p-4 ${containerClass}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-current shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-bold text-lg">
              ⚠️ Advarsel! {warnings.length} {warnings.length === 1 ? 'registrering' : 'registreringer'} fundet
            </h4>
            <p className="text-sm opacity-80">
              Denne lejer har advarsler registreret af andre udlejere i LEJIO-systemet.
            </p>
          </div>

          <div className="space-y-2">
            {warnings.map((warning) => (
              <div
                key={warning.id}
                className="bg-background/50 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge className={getSeverityBadge(warning.severity)}>
                    {WARNING_REASON_LABELS[warning.reason]}
                  </Badge>
                  <span className="text-xs opacity-70">
                    {format(new Date(warning.created_at), 'dd. MMM yyyy', { locale: da })}
                  </span>
                </div>
                
                <p className="text-sm">{warning.description}</p>

                <div className="flex flex-wrap gap-4 text-xs opacity-80">
                  {warning.renter_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {warning.renter_name}
                    </span>
                  )}
                  {(warning.damage_amount > 0 || warning.unpaid_amount > 0) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {warning.damage_amount > 0 && `Skade: ${warning.damage_amount.toLocaleString('da-DK')} kr`}
                      {warning.damage_amount > 0 && warning.unpaid_amount > 0 && ' / '}
                      {warning.unpaid_amount > 0 && `Ubetalt: ${warning.unpaid_amount.toLocaleString('da-DK')} kr`}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Udløber: {format(new Date(warning.expires_at), 'dd. MMM yyyy', { locale: da })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs opacity-70">
            Overvej nøje om du vil godkende denne booking. Du kan kontakte LEJIO for mere information.
          </p>
        </div>
      </div>
    </div>
  );
};
