import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface LessorAccount {
  id: string;
  user_id: string;
  company_name: string;
  custom_domain?: string;
  cvr_number?: string;
  subscription_tier: 'trial' | 'professional' | 'business' | 'enterprise';
  trial_expires_at?: string;
  subscription_started_at?: string;
  stripe_customer_id?: string;
  branding: {
    primary_color?: string;
    logo_url?: string;
    company_name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface UpdateAccountInput {
  company_name?: string;
  custom_domain?: string;
  cvr_number?: string;
}

export interface UpdateBrandingInput {
  primary_color?: string;
  logo_url?: string;
}

export function useFriSettings(userId: string | null) {
  const [account, setAccount] = useState<LessorAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  const mapSubscriptionTier = (status?: string): LessorAccount['subscription_tier'] => {
    if (status === 'trial') return 'trial';
    if (status === 'active') return 'business';
    if (status === 'suspended') return 'business';
    if (status === 'cancelled') return 'trial';
    return 'trial';
  };

  // Fetch account settings
  const fetch = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const safeUserId = escapeSqlValue(userId);
      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT * FROM fri_lessors WHERE id='${safeUserId}'`,
      });

      const rows = normalizeRows(response);
      const data = rows?.[0];

      if (data) {
        setAccount({
          id: data.id,
          user_id: data.id,
          company_name: data.company_name || '',
          custom_domain: data.custom_domain || undefined,
          cvr_number: data.cvr_number || undefined,
          subscription_tier: mapSubscriptionTier(data.subscription_status),
          trial_expires_at: data.trial_end_date || undefined,
          subscription_started_at: data.created_at || undefined,
          stripe_customer_id: data.stripe_customer_id || undefined,
          branding: {
            primary_color: data.primary_color || undefined,
            logo_url: data.logo_url || undefined,
            company_name: data.company_name || undefined,
          },
          created_at: data.created_at,
          updated_at: data.updated_at || data.created_at,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-fetch when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetch();
    }
  }, [userId, fetch]);

  // Update account settings
  const updateAccount = useCallback(
    async (input: UpdateAccountInput) => {
      if (!userId) throw new Error('User ID is required');

      try {
        setError(null);
        setSuccess(null);

        const updates = {
          company_name: input.company_name || account?.company_name || '',
          custom_domain: input.custom_domain || account?.custom_domain || null,
          cvr_number: input.cvr_number || account?.cvr_number || null,
          updated_at: new Date().toISOString(),
        };

        const setClauses = Object.entries(updates)
          .map(([key, value]) => {
            if (value === undefined) return null;
            if (value === null) return `${key}=NULL`;
            if (typeof value === 'number') return `${key}=${value}`;
            return `${key}='${escapeSqlValue(String(value))}'`;
          })
          .filter(Boolean)
          .join(', ');

        await azureApi.post('/db/query', {
          query: `UPDATE fri_lessors SET ${setClauses} WHERE id='${escapeSqlValue(userId)}'`,
        });

        await fetch();
        setSuccess('Indstillinger gemt');
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        throw err;
      }
    },
    [userId, account]
  );

  // Update branding
  const updateBranding = useCallback(
    async (input: UpdateBrandingInput) => {
      if (!userId || !account) throw new Error('User ID and account are required');

      try {
        setError(null);
        setSuccess(null);

        const newBranding = {
          ...account.branding,
          ...input,
        };

        const setClauses = [
          `primary_color=${newBranding.primary_color ? `'${escapeSqlValue(newBranding.primary_color)}'` : 'NULL'}`,
          `logo_url=${newBranding.logo_url ? `'${escapeSqlValue(newBranding.logo_url)}'` : 'NULL'}`,
          `updated_at='${escapeSqlValue(new Date().toISOString())}'`,
        ].join(', ');

        await azureApi.post('/db/query', {
          query: `UPDATE fri_lessors SET ${setClauses} WHERE id='${escapeSqlValue(userId)}'`,
        });

        await fetch();
        setSuccess('Branding gemt');
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update branding';
        setError(message);
        throw err;
      }
    },
    [userId, account]
  );

  // Check if trial is expired
  const isTrialExpired = (): boolean => {
    if (account?.subscription_tier !== 'trial' || !account?.trial_expires_at) {
      return false;
    }
    return new Date(account.trial_expires_at) < new Date();
  };

  // Get days remaining in trial
  const getTrialDaysRemaining = (): number => {
    if (account?.subscription_tier !== 'trial' || !account?.trial_expires_at) {
      return 0;
    }
    const now = new Date();
    const expiresAt = new Date(account.trial_expires_at);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Dismiss error
  const dismissError = () => setError(null);
  const dismissSuccess = () => setSuccess(null);

  return {
    account,
    loading,
    error,
    success,
    refetch: fetch,
    updateAccount,
    updateBranding,
    isTrialExpired,
    getTrialDaysRemaining,
    dismissError,
    dismissSuccess,
  };
}
