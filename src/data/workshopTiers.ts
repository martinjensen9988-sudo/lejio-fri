/**
 * Workshop Subscription Tiers
 * Defines pricing and module access for Garage Workshop System
 */

export type WorkshopTierType = 'basic' | 'professional' | 'premium';

export interface WorkshopTier {
  id: WorkshopTierType;
  name: string;
  priceMonthly: number;
  priceCurrency: string;
  description: string;
  badge?: string;
  modules: string[]; // Module IDs included in this tier
  features: string[];
  highlighted: boolean;
}

export const WORKSHOP_TIERS: Record<WorkshopTierType, WorkshopTier> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 299,
    priceCurrency: 'DKK',
    description: 'Lille værksted starter pakke',
    modules: [
      'garageplan',      // Planning & Overview
      'garageteam',      // Human Resources
      'garagechat',      // Automated Communications
    ],
    features: [
      'Smart opgaveplanlægning',
      'Teamoversigt & fravær',
      'Automatiske kunde-SMS',
      'Dashboard & statistik',
      'Grundlæggende support',
    ],
    highlighted: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 899,
    priceCurrency: 'DKK',
    description: 'Voksende værksted med fulde værktøjer',
    modules: [
      'garageplan',      // Planning & Overview
      'garageteam',      // Human Resources
      'garagechat',      // Automated Communications
      'garagebooks',     // Invoicing & Payments
      'garagesync',      // E-conomic Integration
      'garadeal',        // Car Sales
    ],
    features: [
      'Alt fra Basic +',
      'Automatisk fakturering & betalinger',
      'E-conomic integration',
      'Bilsalg & momsafregning',
      'Prioriteret support',
    ],
    highlighted: true,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 1699,
    priceCurrency: 'DKK',
    description: 'Alt included - fuld kraft til værkstedet',
    badge: 'Most Popular',
    modules: [
      // Basic
      'garageplan',
      'garageteam',
      'garagechat',
      // Professional
      'garagebooks',
      'garagesync',
      'garadeal',
      // Premium exclusive (Under udvikling)
      'garagequote',
      'garagebook',
      // Roadmap modules (at komme)
      'garagetech',
      'garageparts',
      'garagestock',
      'garagecommission',
      'garagerent',
      'garagetires',
      'garageservice',
      // Always included
      'garagehub',
    ],
    features: [
      'Alt fra Professional +',
      'Alle nuværende & kommende moduler',
      'Advanced tilbud & booking',
      'Reservedele & lagerstyring',
      'Dækhotel integration',
      'Kommissionssalg',
      'VIP support (prioritet)',
      'API adgang',
      'Unlimited alt',
    ],
    highlighted: true,
  },
};

/**
 * Get all modules for a specific tier
 */
export function getModulesForTier(tierId: WorkshopTierType): string[] {
  return WORKSHOP_TIERS[tierId]?.modules || [];
}

/**
 * Check if a module is available in specific tier
 */
export function isModuleInTier(moduleId: string, tierId: WorkshopTierType): boolean {
  return getModulesForTier(tierId).includes(moduleId);
}

/**
 * Get the minimum tier that includes a specific module
 */
export function getMinimumTierForModule(moduleId: string): WorkshopTierType | null {
  const tiers: WorkshopTierType[] = ['basic', 'professional', 'premium'];
  for (const tier of tiers) {
    if (isModuleInTier(moduleId, tier)) {
      return tier;
    }
  }
  return null;
}

/**
 * Get tier info by ID
 */
export function getTierInfo(tierId: WorkshopTierType): WorkshopTier | null {
  return WORKSHOP_TIERS[tierId] || null;
}

/**
 * Get all available tiers
 */
export function getAllTiers(): WorkshopTier[] {
  return Object.values(WORKSHOP_TIERS);
}
