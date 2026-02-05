import { useState, useEffect } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Wallet, Check, Loader2 } from 'lucide-react';

interface ReferralCreditOptionProps {
  onCreditApplied: (credit: number, redemptionId?: string) => void;
  periodType: 'daily' | 'weekly' | 'monthly';
}

export const ReferralCreditOption = ({
  onCreditApplied,
  periodType,
}: ReferralCreditOptionProps) => {
  const { user } = useAuth();
  const { referralCode, getPendingDiscount, applyReferralCode, isLoading } = useReferral();
  const [pendingDiscount, setPendingDiscount] = useState<{ id: string; discount: number } | null>(null);
  const [useAvailableCredit, setUseAvailableCredit] = useState(false);
  const [creditToUse, setCreditToUse] = useState(0);
  const [inputCode, setInputCode] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);
  const [hasAppliedCode, setHasAppliedCode] = useState(false);

  // Check for pending first-time discount
  useEffect(() => {
    const checkPending = async () => {
      if (user && periodType === 'monthly') {
        const pending = await getPendingDiscount();
        if (pending) {
          setPendingDiscount(pending);
          onCreditApplied(pending.discount, pending.id);
        }
      }
    };
    checkPending();
  }, [user, periodType, getPendingDiscount, onCreditApplied]);

  const handleUseCredit = (checked: boolean) => {
    setUseAvailableCredit(checked);
    if (checked && referralCode) {
      const credit = Math.min(referralCode.available_credit, 500); // Max 500 kr per booking
      setCreditToUse(credit);
      onCreditApplied(credit);
    } else {
      setCreditToUse(0);
      onCreditApplied(0);
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    
    setApplyingCode(true);
    const result = await applyReferralCode(inputCode.trim());
    setApplyingCode(false);
    
    if (result.success && periodType === 'monthly') {
      setHasAppliedCode(true);
      // Refresh to get the new pending discount
      const pending = await getPendingDiscount();
      if (pending) {
        setPendingDiscount(pending);
        onCreditApplied(pending.discount, pending.id);
      }
    }
  };

  if (!user) return null;

  // Only show for monthly rentals (first-time referral discount)
  const showFirstTimeDiscount = periodType === 'monthly' && (pendingDiscount || hasAppliedCode);
  const hasCredit = referralCode && referralCode.available_credit > 0;

  if (!showFirstTimeDiscount && !hasCredit && !periodType) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Henvisningsrabat & Kredit</h4>
        </div>

        {/* First-time referral discount (for monthly only) */}
        {showFirstTimeDiscount && (
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Førstegangskunderabat aktiveret!
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  500 kr. rabat på denne booking
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-600 text-white">
              -500 kr
            </Badge>
          </div>
        )}

        {/* Apply referral code (for monthly without pending discount) */}
        {periodType === 'monthly' && !pendingDiscount && !hasAppliedCode && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Har du en henvisningskode?</Label>
            <div className="flex gap-2">
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="LEJIO-XXXXXX"
                className="font-mono uppercase"
              />
              <Button
                variant="outline"
                onClick={handleApplyCode}
                disabled={!inputCode.trim() || applyingCode}
              >
                {applyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Anvend'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Få 500 kr. rabat på din første månedsleasing
            </p>
          </div>
        )}

        {/* Use available credit */}
        {hasCredit && (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="use-credit"
              checked={useAvailableCredit}
              onCheckedChange={handleUseCredit}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="use-credit" className="cursor-pointer flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Brug henvisningskredit
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Du har {referralCode.available_credit} kr. tilgængelig kredit
              </p>
            </div>
            {useAvailableCredit && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                -{creditToUse} kr
              </Badge>
            )}
          </div>
        )}

        {/* No options available message */}
        {!showFirstTimeDiscount && !hasCredit && periodType !== 'monthly' && (
          <p className="text-sm text-muted-foreground">
            Henvisningsrabat gælder kun for månedsleasing
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCreditOption;