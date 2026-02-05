import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';

export interface PaymentSettings {
  id?: string;
  lessor_id: string;
  payment_gateway: string | null;
  gateway_api_key: string | null;
  gateway_merchant_id: string | null;
  bank_account: string | null;
  has_api_key?: boolean;
  has_merchant_id?: boolean;
}

export const usePaymentSettings = () => {
  const { user } = useAuth();
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPaymentSettings();
    } else {
      setPaymentSettings(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPaymentSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-settings');
      
      if (error) {
        console.error('Error fetching payment settings:', error);
        setPaymentSettings(null);
      } else if (data?.settings) {
        setPaymentSettings(data.settings as PaymentSettings);
      } else {
        setPaymentSettings(null);
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      setPaymentSettings(null);
    }
    setLoading(false);
  };

  const updatePaymentSettings = async (updates: Partial<PaymentSettings>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase.functions.invoke('save-payment-settings', {
        body: {
          payment_gateway: updates.payment_gateway,
          gateway_api_key: updates.gateway_api_key,
          gateway_merchant_id: updates.gateway_merchant_id,
          bank_account: updates.bank_account,
        }
      });

      if (error) {
        console.error('Error saving payment settings:', error);
        return { error };
      }

      // Update local state with masked values
      setPaymentSettings(prev => prev 
        ? { 
            ...prev, 
            ...updates,
            // Mark that we have values if they were provided
            has_api_key: !!updates.gateway_api_key || prev.has_api_key,
            has_merchant_id: !!updates.gateway_merchant_id || prev.has_merchant_id,
            // Show masked values
            gateway_api_key: updates.gateway_api_key ? '••••••••' + (updates.gateway_api_key as string).slice(-4) : prev.gateway_api_key,
            gateway_merchant_id: updates.gateway_merchant_id ? '••••••••' + (updates.gateway_merchant_id as string).slice(-4) : prev.gateway_merchant_id,
          } 
        : { 
            lessor_id: user.id, 
            payment_gateway: updates.payment_gateway || null, 
            gateway_api_key: updates.gateway_api_key ? '••••••••' + (updates.gateway_api_key as string).slice(-4) : null, 
            gateway_merchant_id: updates.gateway_merchant_id ? '••••••••' + (updates.gateway_merchant_id as string).slice(-4) : null, 
            bank_account: updates.bank_account || null,
            has_api_key: !!updates.gateway_api_key,
            has_merchant_id: !!updates.gateway_merchant_id,
          }
      );

      return { error: null };
    } catch (err) {
      console.error('Error saving payment settings:', err);
      return { error: err as Error };
    }
  };

  return {
    paymentSettings,
    loading,
    updatePaymentSettings,
    refetch: fetchPaymentSettings,
  };
};
