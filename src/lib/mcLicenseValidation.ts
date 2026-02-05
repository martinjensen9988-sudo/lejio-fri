/**
 * Motorcycle License Validation Logic
 * 
 * Danish license categories for motorcycles:
 * - AM (Knallertbevis): Scooter 30 (max 30 km/t)
 * - A1: Let MC (max 125cc, max 11kW)
 * - A2: Mellem MC (max 35kW)
 * - A: Stor MC (ingen begrænsning)
 * - B: Bil-kørekort (giver ret til scooter 45)
 */

export type MCCategory = 'scooter_30' | 'scooter_45' | 'a1' | 'a2' | 'a';
export type LicenseCategory = 'AM' | 'A1' | 'A2' | 'A' | 'B';

interface LicenseValidationResult {
  isValid: boolean;
  requiredCategory: string;
  message: string;
}

// Minimum age requirements
const MIN_AGE: Record<MCCategory, number> = {
  scooter_30: 15,
  scooter_45: 18,
  a1: 18,
  a2: 20,
  a: 24, // or 22 with 2 years A2 experience
};

// License hierarchy (what categories a license covers)
const LICENSE_HIERARCHY: Record<LicenseCategory, MCCategory[]> = {
  'AM': ['scooter_30'],
  'B': ['scooter_30', 'scooter_45'], // B-kørekort giver ret til stor knallert
  'A1': ['scooter_30', 'scooter_45', 'a1'],
  'A2': ['scooter_30', 'scooter_45', 'a1', 'a2'],
  'A': ['scooter_30', 'scooter_45', 'a1', 'a2', 'a'],
};

export const getRequiredLicenseForCategory = (mcCategory: MCCategory): LicenseCategory[] => {
  switch (mcCategory) {
    case 'scooter_30':
      return ['AM', 'A1', 'A2', 'A', 'B'];
    case 'scooter_45':
      return ['A1', 'A2', 'A', 'B'];
    case 'a1':
      return ['A1', 'A2', 'A'];
    case 'a2':
      return ['A2', 'A'];
    case 'a':
      return ['A'];
    default:
      return ['A'];
  }
};

export const validateLicenseForMC = (
  mcCategory: MCCategory,
  userLicenseCategories: LicenseCategory[],
  userAge: number
): LicenseValidationResult => {
  // Check age requirement
  const minAge = MIN_AGE[mcCategory];
  if (userAge < minAge) {
    return {
      isValid: false,
      requiredCategory: getRequiredLicenseForCategory(mcCategory).join(' eller '),
      message: `Du skal være mindst ${minAge} år for denne kategori`,
    };
  }

  // Check if user has a valid license
  const requiredLicenses = getRequiredLicenseForCategory(mcCategory);
  const hasValidLicense = userLicenseCategories.some(license => 
    requiredLicenses.includes(license)
  );

  if (!hasValidLicense) {
    return {
      isValid: false,
      requiredCategory: requiredLicenses.join(' eller '),
      message: `Kræver kørekortkategori: ${requiredLicenses.join(' eller ')}`,
    };
  }

  return {
    isValid: true,
    requiredCategory: requiredLicenses[0],
    message: 'Kørekort godkendt',
  };
};

export const getMCCategoryLabel = (category: MCCategory): string => {
  const labels: Record<MCCategory, string> = {
    scooter_30: 'Scooter 30 km/t',
    scooter_45: 'Scooter 45 km/t',
    a1: 'Let MC (A1)',
    a2: 'Mellem MC (A2)',
    a: 'Stor MC (A)',
  };
  return labels[category] || category;
};

export const getMCCategoryDescription = (category: MCCategory): string => {
  const descriptions: Record<MCCategory, string> = {
    scooter_30: 'Max 30 km/t - Kræver knallertbevis (AM) eller højere',
    scooter_45: 'Max 45 km/t - Kræver bil (B) eller MC-kørekort',
    a1: 'Max 125cc / 11kW - Kræver A1 kørekort',
    a2: 'Max 35kW - Kræver A2 kørekort (min. 20 år)',
    a: 'Ingen begrænsning - Kræver A kørekort (min. 24 år)',
  };
  return descriptions[category] || '';
};

// A2 power restriction check
export const validateA2Power = (engineKw: number): boolean => {
  return engineKw <= 35;
};

export const getMinAgeForCategory = (category: MCCategory): number => {
  return MIN_AGE[category];
};
