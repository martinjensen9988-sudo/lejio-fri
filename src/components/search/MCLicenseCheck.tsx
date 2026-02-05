import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bike, ShieldCheck, CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';
import { 
  MCCategory, 
  LicenseCategory, 
  validateLicenseForMC, 
  getMCCategoryLabel,
  getMCCategoryDescription,
  getMinAgeForCategory
} from '@/lib/mcLicenseValidation';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MCLicenseCheckProps {
  mcCategory: MCCategory | null;
  onValidationChange: (isValid: boolean) => void;
}

const LICENSE_OPTIONS: { value: LicenseCategory; label: string; description: string }[] = [
  { value: 'AM', label: 'AM (Knallertbevis)', description: 'Scooter 30 km/t' },
  { value: 'B', label: 'B (Bil-kørekort)', description: 'Inkl. scooter op til 45 km/t' },
  { value: 'A1', label: 'A1 (Let MC)', description: 'Max 125cc / 11kW' },
  { value: 'A2', label: 'A2 (Mellem MC)', description: 'Max 35kW' },
  { value: 'A', label: 'A (Stor MC)', description: 'Ingen begrænsning' },
];

export const MCLicenseCheck = ({ mcCategory, onValidationChange }: MCLicenseCheckProps) => {
  const [selectedLicenses, setSelectedLicenses] = useState<LicenseCategory[]>([]);
  const [userAge, setUserAge] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    requiredCategory: string;
  } | null>(null);

  useEffect(() => {
    if (!mcCategory) {
      setValidationResult(null);
      onValidationChange(true); // No MC = no validation needed
      return;
    }

    const age = userAge ? parseInt(userAge) : 0;
    
    if (selectedLicenses.length === 0 || !age) {
      setValidationResult(null);
      onValidationChange(false);
      return;
    }

    const result = validateLicenseForMC(mcCategory, selectedLicenses, age);
    setValidationResult(result);
    onValidationChange(result.isValid);
  }, [mcCategory, selectedLicenses, userAge, onValidationChange]);

  if (!mcCategory) {
    return null;
  }

  const toggleLicense = (license: LicenseCategory) => {
    setSelectedLicenses(prev => 
      prev.includes(license) 
        ? prev.filter(l => l !== license)
        : [...prev, license]
    );
  };

  const minAge = getMinAgeForCategory(mcCategory);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-muted/30 border">
      <div className="flex items-center gap-2">
        <Bike className="w-5 h-5 text-primary" />
        <h4 className="font-semibold">Kørekortverifikation</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>For din sikkerhed skal vi verificere at du har det korrekte kørekort til denne maskine.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Vehicle category info */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">
          {getMCCategoryLabel(mcCategory)}
        </AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
          {getMCCategoryDescription(mcCategory)}
        </AlertDescription>
      </Alert>

      {/* Age input */}
      <div className="space-y-2">
        <Label>Din alder</Label>
        <Input
          type="number"
          placeholder="F.eks. 25"
          value={userAge}
          onChange={(e) => setUserAge(e.target.value)}
          min={15}
          max={100}
        />
        {userAge && parseInt(userAge) < minAge && (
          <p className="text-xs text-destructive">
            Du skal være mindst {minAge} år for denne kategori
          </p>
        )}
      </div>

      {/* License selection */}
      <div className="space-y-2">
        <Label>Dine kørekortkategorier</Label>
        <div className="grid grid-cols-2 gap-2">
          {LICENSE_OPTIONS.map((license) => (
            <button
              key={license.value}
              type="button"
              onClick={() => toggleLicense(license.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedLicenses.includes(license.value)
                  ? 'bg-primary/10 border-primary ring-1 ring-primary'
                  : 'bg-background border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{license.label}</span>
                {selectedLicenses.includes(license.value) && (
                  <CheckCircle className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{license.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Validation result */}
      {validationResult && (
        <Alert className={validationResult.isValid 
          ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' 
          : 'bg-destructive/10 border-destructive/30'
        }>
          {validationResult.isValid ? (
            <ShieldCheck className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive" />
          )}
          <AlertTitle className={validationResult.isValid ? 'text-green-800 dark:text-green-400' : 'text-destructive'}>
            {validationResult.isValid ? 'Kørekort godkendt' : 'Kørekort ikke godkendt'}
          </AlertTitle>
          <AlertDescription className={validationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-destructive/80'}>
            {validationResult.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MCLicenseCheck;
