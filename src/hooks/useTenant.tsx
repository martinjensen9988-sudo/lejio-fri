import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  domain: string;
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  ownerEmail: string;
  primaryColor: string;
  logoUrl?: string;
  trialEndDate: Date;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  subdomain: string | null;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Extract subdomain from current hostname
 * Examples:
 * - martinbiludlejning.lejio-fri.dk → martinbiludlejning
 * - lejio-fri.dk → null (root domain)
 * - localhost:5173 → null (local dev)
 * - gray-hill-06c5ae603.6.azurestaticapps.net → null (Azure SWA root)
 */
function extractSubdomain(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Local development
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    return null;
  }

  // Azure Static Web Apps deployment domain - ignore
  if (hostname.includes('azurestaticapps.net')) {
    return null;
  }

  // Production: *.lejio-fri.dk
  if (hostname.endsWith('lejio-fri.dk')) {
    const subdomain = parts[0];
    return subdomain !== 'www' ? subdomain : null;
  }

  // Custom domain (future): *.example.com
  if (parts.length > 1 && !hostname.includes('localhost')) {
    return parts[0];
  }

  return null;
}

interface TenantProviderProps {
  children: React.ReactNode;
  apiBaseUrl: string;
}

export function TenantProvider({ children, apiBaseUrl }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subdomain = extractSubdomain();
  const tenantId = tenant?.id || null;

  const fetchTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // IMPORTANT: Never fetch tenant for Azure SWA domains or if no subdomain
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      if (!subdomain || hostname.includes('azurestaticapps.net')) {
        // Root domain, Azure SWA, or local dev - no tenant context
        setTenant(null);
        setIsLoading(false);
        return;
      }

      // Fetch tenant from Azure Function
      const response = await fetch(`${apiBaseUrl}/Tenant?subdomain=${subdomain}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tenant: ${response.statusText}`);
      }

      const data = await response.json();

      setTenant({
        id: data.id,
        name: data.name,
        slug: data.slug,
        subdomain: data.subdomain,
        domain: data.domain,
        plan: data.plan,
        status: data.status,
        ownerEmail: data.owner_email,
        primaryColor: data.primary_color || '#3b82f6',
        logoUrl: data.logo_url,
        trialEndDate: new Date(data.trial_end_date),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tenant on mount and when subdomain changes
  useEffect(() => {
    fetchTenant();
  }, [subdomain]);

  const value: TenantContextType = {
    tenant,
    tenantId,
    subdomain,
    isLoading,
    error,
    refreshTenant: fetchTenant,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

// Hook to get tenant for API calls
export function useTenantHeaders() {
  const { tenantId } = useTenant();
  return {
    'X-Tenant-ID': tenantId || '',
  };
}
