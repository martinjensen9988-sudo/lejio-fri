import { createContext, useContext, ReactNode } from 'react';

export interface LessorBranding {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  company_name?: string;
  favicon_url?: string;
}

interface BrandContextType {
  branding: LessorBranding;
  companyName: string;
  domain: string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({
  children,
  branding,
  domain,
}: {
  children: ReactNode;
  branding: LessorBranding;
  domain: string;
}) {
  const companyName = branding.company_name || 'Din platform';

  // Apply branding to document
  if (branding.primary_color) {
    document.documentElement.style.setProperty('--primary-color', branding.primary_color);
  }
  if (branding.secondary_color) {
    document.documentElement.style.setProperty('--secondary-color', branding.secondary_color);
  }

  // Set page title
  document.title = companyName;

  // Set favicon
  if (branding.favicon_url) {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = branding.favicon_url;
    }
  }

  return (
    <BrandContext.Provider value={{ branding, companyName, domain }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextType {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within BrandProvider');
  }
  return context;
}

export function useBrandColor(colorType: 'primary' | 'secondary' = 'primary'): string {
  const { branding } = useBrand();
  return colorType === 'primary' ? branding.primary_color : branding.secondary_color;
}

export function useBrandLogo(): string | undefined {
  const { branding } = useBrand();
  return branding.logo_url;
}

export function useBrandName(): string {
  const { companyName } = useBrand();
  return companyName;
}

export function useBrandDomain(): string {
  const { domain } = useBrand();
  return domain;
}
