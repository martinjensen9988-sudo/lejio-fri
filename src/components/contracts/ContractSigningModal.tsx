import { useState } from 'react';
import { Contract } from '@/hooks/useContracts';
import { useAuth } from '@/hooks/useAuth';
import ContractPreview from './ContractPreview';
import SignaturePadComponent from './SignaturePad';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, FileCheck, AlertTriangle } from 'lucide-react';

interface ContractSigningModalProps {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (contractId: string, signature: string, acceptVanvidskorsel: boolean, role: 'lessor' | 'renter') => Promise<Contract | null>;
}

const ContractSigningModal = ({ contract, open, onOpenChange, onSign }: ContractSigningModalProps) => {
  const { user, profile } = useAuth();
  const [signature, setSignature] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedVanvidskorsel, setAcceptedVanvidskorsel] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const isLessor = user?.id === contract.lessor_id;
  // Check if user is renter by ID or by matching email
  const isRenter = user?.id === contract.renter_id || 
    (!contract.renter_id && profile?.email === contract.renter_email) ||
    profile?.email === contract.renter_email;
  
  const role: 'lessor' | 'renter' = isLessor ? 'lessor' : 'renter';
  
  // Check if this party has already signed
  const alreadySigned = role === 'lessor' ? !!contract.lessor_signature : !!contract.renter_signature;
  
  // Lessor can sign if they haven't signed yet, regardless of contract status (unless cancelled or fully signed)
  // Renter can sign if they haven't signed yet, regardless of contract status (unless cancelled or fully signed)
  const canSign = !alreadySigned && contract.status !== 'signed' && contract.status !== 'cancelled';

  const handleSign = async () => {
    if (!signature) return;
    
    setIsSigning(true);
    const result = await onSign(contract.id, signature, acceptedVanvidskorsel, role);
    setIsSigning(false);
    
    if (result) {
      onOpenChange(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Ikke angivet';
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[90vh] flex flex-col bg-card p-0 overflow-hidden"
        style={{
          // Safari-specific fixes for modal rendering
          WebkitBackfaceVisibility: 'hidden',
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
      >
        <DialogHeader className="p-6 pb-0 shrink-0 bg-card">
          <DialogTitle className="font-display text-2xl flex items-center gap-2 text-foreground">
            <FileCheck className="w-6 h-6 text-primary" />
            {alreadySigned ? 'Kontrakt allerede underskrevet' : 'Underskriv kontrakt'}
          </DialogTitle>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto p-6 pt-4 bg-card" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <div className="space-y-6">
            {/* Contract Preview */}
            <div className="border border-border rounded-xl overflow-hidden bg-white">
              <ContractPreview contract={contract} />
            </div>

            {/* Signing Section */}
            {!alreadySigned && canSign && (
              <div className="bg-muted/50 rounded-2xl p-6 space-y-6">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Din underskrift som {role === 'lessor' ? 'udlejer' : 'lejer'}
                </h3>

                {/* Vanvidskørsel acceptance (only for renter) */}
                {role === 'renter' && (
                  <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="space-y-3">
                        <p className="text-sm text-foreground">
                          Ved at acceptere denne kontrakt bekræfter jeg, at jeg er bekendt med, at jeg hæfter for 
                          køretøjets fulde værdi (<strong>{formatCurrency(contract.vanvidskørsel_liability_amount)}</strong>) 
                          i tilfælde af vanvidskørsel, der medfører konfiskation af køretøjet.
                        </p>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id="vanvidskorsel" 
                            checked={acceptedVanvidskorsel}
                            onCheckedChange={(checked) => setAcceptedVanvidskorsel(checked === true)}
                          />
                          <Label htmlFor="vanvidskorsel" className="text-sm font-medium text-foreground cursor-pointer">
                            Jeg accepterer vanvidskørselsklausulen
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms acceptance */}
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                    Jeg har læst og accepterer kontraktens vilkår
                  </Label>
                </div>

                {/* Signature Pad */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tegn din underskrift</Label>
                  <SignaturePadComponent 
                    onSave={setSignature}
                    disabled={!acceptedTerms || (role === 'renter' && !acceptedVanvidskorsel)}
                  />
                </div>

                {signature && (
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Din underskrift:</p>
                    <img src={signature} alt="Din underskrift" className="h-16 object-contain" />
                  </div>
                )}

                {/* Submit */}
                <Button
                  variant="warm"
                  size="lg"
                  className="w-full"
                  disabled={!signature || !acceptedTerms || (role === 'renter' && !acceptedVanvidskorsel) || isSigning}
                  onClick={handleSign}
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Underskriver...
                    </>
                  ) : (
                    'Underskriv kontrakt'
                  )}
                </Button>
              </div>
            )}

            {alreadySigned && (
              <div className="bg-mint/10 rounded-2xl p-6 text-center border border-mint/20">
                <FileCheck className="w-12 h-12 text-mint mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  Du har allerede underskrevet denne kontrakt
                </h3>
                <p className="text-sm text-muted-foreground">
                  {contract.status === 'signed' 
                    ? 'Kontrakten er fuldt underskrevet af begge parter.'
                    : 'Kontrakten afventer underskrift fra den anden part.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractSigningModal;
