import { useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

export const usePlatformFeePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const payFees = async (feeIds: string[]): Promise<PaymentResult> => {
    if (feeIds.length === 0) {
      return { success: false, error: 'Ingen gebyrer valgt' };
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('pay-platform-fees', {
        body: {
          feeIds,
          returnUrl: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return { success: true, paymentUrl: data.paymentUrl };
      }

      return { success: false, error: 'Ingen betalingslink modtaget' };
    } catch (err) {
      console.error('Platform fee payment error:', err);
      const message = err instanceof Error ? err.message : 'Ukendt fejl';
      toast.error(`Betalingsfejl: ${message}`);
      return { success: false, error: message };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    payFees,
  };
};
