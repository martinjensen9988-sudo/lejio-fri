import { useState, useEffect, useCallback } from 'react';
import { api as azureApi } from '@/integrations/api/client';

export interface LessorAccount {
  id: string;
  user_id: string;
  company_name: string;
  custom_domain?: string;
  cvr_number?: string;
  subscription_tier: string;
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

export interface UpdateSubscriptionInput {
  subscription_tier: string;
}

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

const mapTier = (status?: string, tier?: string): LessorAccount['subscription_tier'] => {
  if (tier) return tier;
  if (status === 'trial') return 'trial';
  if (status === 'active') return 'dealer_plus';
  if (status === 'suspended') return 'dealer_plus';
  return 'trial';
};

export function useFriSettings(userId: string | null) {
  const [account, setAccount] = useState<LessorAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT * FROM fri_lessors WHERE id='${esc(userId)}'`,
      });
      const rows = normalizeRows(response);
      const data = rows?.[0];
      if (data) {
        setAccount({
          id: data.id, user_id: data.id,
          company_name: data.company_name || '',
          custom_domain: data.custom_domain || undefined,
          cvr_number: data.cvr_number || undefined,
          subscription_tier: mapTier(data.subscription_status, data.subscription_tier),
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
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (userId) fetchSettings(); }, [userId, fetchSettings]);

  const updateAccount = useCallback(async (input: UpdateAccountInput) => {
    if (!userId) throw new Error('User ID is required');
    setError(null);
    setSuccess(null);
    const setClauses: string[] = [];
    if (input.company_name) setClauses.push(`company_name='${esc(input.company_name)}'`);
    if (input.custom_domain !== undefined) setClauses.push(input.custom_domain ? `custom_domain='${esc(input.custom_domain)}'` : `custom_domain=NULL`);
    if (input.cvr_number !== undefined) setClauses.push(input.cvr_number ? `cvr_number='${esc(input.cvr_number)}'` : `cvr_number=NULL`);
    setClauses.push(`updated_at=NOW()`);
    await azureApi.post('/db-query', {
      query: `UPDATE fri_lessors SET ${setClauses.join(', ')} WHERE id='${esc(userId)}'`,
    });
    await fetchSettings();
    setSuccess('Indstillinger gemt');
    return null;
  }, [userId, fetchSettings]);

  const updateBranding = useCallback(async (input: UpdateBrandingInput) => {
    if (!userId) throw new Error('User ID is required');
    setError(null);
    setSuccess(null);
    const setClauses: string[] = [];
    if (input.primary_color !== undefined) setClauses.push(input.primary_color ? `primary_color='${esc(input.primary_color)}'` : `primary_color=NULL`);
    if (input.logo_url !== undefined) setClauses.push(input.logo_url ? `logo_url='${esc(input.logo_url)}'` : `logo_url=NULL`);
    setClauses.push(`updated_at=NOW()`);
    await azureApi.post('/db-query', {
      query: `UPDATE fri_lessors SET ${setClauses.join(', ')} WHERE id='${esc(userId)}'`,
    });
    await fetchSettings();
    setSuccess('Branding gemt');
    return null;
  }, [userId, fetchSettings]);

  const updateSubscriptionTier = useCallback(async (input: UpdateSubscriptionInput) => {
    if (!userId) throw new Error('User ID is required');
    if (!input.subscription_tier) throw new Error('Subscription tier is required');
    setError(null);
    setSuccess(null);
    try {
      console.log('[useFriSettings] Updating subscription tier to:', input.subscription_tier);
      const response = await azureApi.post('/update-subscription-tier', {
        subscription_tier: input.subscription_tier,
      });
      console.log('[useFriSettings] Update response:', response);
      await fetchSettings();
      console.log('[useFriSettings] Settings refetched after update');
      setSuccess('Plan opdateret');
    } catch (err) {
      console.error('[useFriSettings] Update error:', err);
      throw err;
    }
    return null;
  }, [userId, fetchSettings]);

  const isTrialExpired = (): boolean => {
    if (account?.subscription_tier !== 'trial' || !account?.trial_expires_at) return false;
    return new Date(account.trial_expires_at) < new Date();
  };

  const getTrialDaysRemaining = (): number => {
    if (account?.subscription_tier !== 'trial' || !account?.trial_expires_at) return 0;
    const diffTime = new Date(account.trial_expires_at).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const dismissError = () => setError(null);
  const dismissSuccess = () => setSuccess(null);

  return { account, loading, error, success, refetch: fetchSettings, updateAccount, updateBranding, updateSubscriptionTier, isTrialExpired, getTrialDaysRemaining, dismissError, dismissSuccess };
}
