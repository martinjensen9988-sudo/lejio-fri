import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDriverLicenseStatus } from '@/hooks/useDriverLicenseStatus';
import { CheckCircle, Clock, XCircle, HelpCircle, Loader2, FileCheck } from 'lucide-react';

interface DriverLicenseStatusBadgeProps {
  renterEmail?: string | null;
  renterId?: string | null;
  renterLicenseNumber?: string | null;
  size?: 'sm' | 'md';
}

const DriverLicenseStatusBadge = ({ renterEmail, renterId, renterLicenseNumber, size = 'sm' }: DriverLicenseStatusBadgeProps) => {
  const { getLicenseStatusByEmail, getLicenseStatusByUserId, isLoading } = useDriverLicenseStatus();
  const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected' | 'from_booking' | null>(null);
  const [licenseNumber, setLicenseNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      let result = null;
      
      if (renterId) {
        result = await getLicenseStatusByUserId(renterId);
      } else if (renterEmail) {
        result = await getLicenseStatusByEmail(renterEmail);
      }
      
      if (result && result.status !== 'none') {
        setStatus(result.status);
        setLicenseNumber(result.licenseNumber);
      } else if (renterLicenseNumber) {
        // Fallback: if no driver_licenses record but booking has license number
        setStatus('from_booking');
        setLicenseNumber(renterLicenseNumber);
      } else {
        setStatus('none');
        setLicenseNumber(null);
      }
    };

    fetchStatus();
  }, [renterEmail, renterId, renterLicenseNumber, getLicenseStatusByEmail, getLicenseStatusByUserId]);

  if (isLoading) {
    return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
  }

  if (!status || status === 'none') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`gap-1 ${size === 'sm' ? 'text-xs' : ''}`}>
              <HelpCircle className="w-3 h-3" />
              Ingen kørekort
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Lejeren har ikke indsendt kørekort</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // License number from booking data (not verified through driver_licenses table)
  if (status === 'from_booking') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 ${size === 'sm' ? 'text-xs' : ''}`}>
              <FileCheck className="w-3 h-3" />
              Kørekort oplyst
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kørekortnummer oplyst ved booking</p>
            {licenseNumber && <p className="text-xs mt-1 font-mono">Nr: {licenseNumber}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'pending') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 ${size === 'sm' ? 'text-xs' : ''}`}>
              <Clock className="w-3 h-3" />
              Afventer verificering
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kørekort er indsendt og afventer verificering</p>
            {licenseNumber && <p className="text-xs mt-1">Nr: {licenseNumber}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'verified') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`gap-1 bg-green-500/10 text-green-600 border-green-500/20 ${size === 'sm' ? 'text-xs' : ''}`}>
              <CheckCircle className="w-3 h-3" />
              Verificeret
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kørekort er verificeret</p>
            {licenseNumber && <p className="text-xs mt-1">Nr: {licenseNumber}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === 'rejected') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`gap-1 bg-red-500/10 text-red-600 border-red-500/20 ${size === 'sm' ? 'text-xs' : ''}`}>
              <XCircle className="w-3 h-3" />
              Afvist
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kørekort er blevet afvist</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};

export default DriverLicenseStatusBadge;
