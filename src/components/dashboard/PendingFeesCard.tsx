import { useState, useEffect } from 'react';
import { Receipt, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformFeePayment } from '@/hooks/usePlatformFeePayment';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

interface PlatformFee {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const PendingFeesCard = () => {
  const { user, profile } = useAuth();
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const { isProcessing, payFees } = usePlatformFeePayment();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for payment status in URL
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Betaling gennemført! Dine gebyrer er nu betalt.');
    } else if (paymentStatus === 'cancelled') {
      toast.info('Betaling annulleret');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile?.user_type === 'privat') {
      fetchFees();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchFees = async () => {
    const { data, error } = await supabase
      .from('platform_fees')
      .select('id, amount, currency, status, created_at')
      .eq('lessor_id', user?.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) {
      setFees(data || []);
    }
    setLoading(false);
  };

  const handlePayAllFees = async () => {
    const feeIds = fees.map(f => f.id);
    await payFees(feeIds);
  };

  // Only show for private users
  if (profile?.user_type !== 'privat') {
    return null;
  }

  const totalPending = fees.reduce((sum, f) => sum + f.amount, 0);

  if (loading) {
    return null;
  }

  if (fees.length === 0) {
    return null;
  }

  return (
    <Card className="border-warm/30 bg-warm/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-warm/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-warm" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Afventende gebyrer
                <Badge variant="outline" className="text-warm border-warm">
                  {fees.length}
                </Badge>
              </CardTitle>
              <CardDescription>Platform gebyr på 49 kr per booking</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-warm">{totalPending.toLocaleString('da-DK')} kr</p>
            <p className="text-sm text-muted-foreground">skyldes</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fees.slice(0, 3).map((fee) => (
            <div 
              key={fee.id} 
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warm" />
                <span className="text-sm">Booking gebyr</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(fee.created_at), 'dd. MMM', { locale: da })}
                </span>
                <span className="font-medium">{fee.amount} {fee.currency}</span>
              </div>
            </div>
          ))}
          {fees.length > 3 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              + {fees.length - 3} flere gebyrer
            </p>
          )}
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={handlePayAllFees}
            disabled={isProcessing}
            className="w-full bg-warm hover:bg-warm/90 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Behandler...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Betal {totalPending} kr nu
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingFeesCard;
