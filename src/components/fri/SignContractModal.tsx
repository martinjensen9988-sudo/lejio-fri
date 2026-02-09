import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, Shield, Globe } from 'lucide-react';
import { ContractSignature } from '@/hooks/useDealerListings';

interface SignContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractType: string;
  customerName: string;
  customerEmail: string;
  onSign: (input: { contractId: string; customerName: string; customerEmail: string }) => Promise<any>;
  isLoading?: boolean;
  lastSignature?: ContractSignature | null;
}

export function SignContractModal({
  open,
  onOpenChange,
  contractId,
  contractType,
  customerName,
  customerEmail,
  onSign,
  isLoading = false,
  lastSignature
}: SignContractModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const canSign = agreed && verifiedName === customerName && verifiedEmail === customerEmail;

  const handleSign = async () => {
    if (!canSign) return;
    try {
      await onSign({ contractId, customerName, customerEmail });
      setAgreed(false);
      setVerifiedName('');
      setVerifiedEmail('');
      onOpenChange(false);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-600" />
            Digital Underskrift
          </DialogTitle>
          <DialogDescription>
            Kontrakttype: {contractType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Din underskrift vil blive logget med IP-adresse, enhedsoplysninger og tidspunkt for sikkerhed og juridisk gyldighed.
            </AlertDescription>
          </Alert>

          {/* Contract Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Navn</span>
                  <span className="font-semibold">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-semibold">{customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kontrakttype</span>
                  <span className="font-semibold">{contractType}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Signature Info */}
          {lastSignature && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm space-y-2">
                  <div className="text-gray-600 font-semibold mb-3">Seneste underskrift</div>
                  <div className="flex items-center gap-2 font-mono text-xs bg-gray-100 p-2 rounded">
                    <Globe className="w-3 h-3" />
                    {lastSignature.ipAddress}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(lastSignature.signatureTimestamp).toLocaleString('da-DK')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {lastSignature.browser} - {lastSignature.os}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Fields */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Bekræft dit navn
              </label>
              <Input
                placeholder={customerName}
                value={verifiedName}
                onChange={(e) => setVerifiedName(e.target.value)}
                className={verifiedName !== customerName && verifiedName ? 'border-red-300' : ''}
              />
              {verifiedName && verifiedName !== customerName && (
                <p className="text-xs text-red-600 mt-1">Navn stemmer ikke overens</p>
              )}
              {verifiedName === customerName && (
                <p className="text-xs text-green-600 mt-1">✓ Bekræftet</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Bekræft din email
              </label>
              <Input
                placeholder={customerEmail}
                value={verifiedEmail}
                onChange={(e) => setVerifiedEmail(e.target.value)}
                className={verifiedEmail !== customerEmail && verifiedEmail ? 'border-red-300' : ''}
              />
              {verifiedEmail && verifiedEmail !== customerEmail && (
                <p className="text-xs text-red-600 mt-1">Email stemmer ikke overens</p>
              )}
              {verifiedEmail === customerEmail && (
                <p className="text-xs text-green-600 mt-1">✓ Bekræftet</p>
              )}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
              Jeg erklærer mig enig i at underskrive denne kontrakt digitalt. Jeg bekræfter at alle oplysninger er korrekte og at jeg har læst og forstået kontraktens betingelser.
            </label>
          </div>

          {/* Signature Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-xs space-y-2 text-yellow-900">
                <div className="font-semibold mb-2">Din underskrift vil logge:</div>
                <div>• IP-adresse: <span className="font-mono">Dynamisk</span></div>
                <div>• Tidspunkt: <span className="font-mono">Nøjagtigt til millisekund</span></div>
                <div>• Browser: <span className="font-mono">Registreres automatisk</span></div>
                <div>• Enhed: <span className="font-mono">Type og OS registreres</span></div>
                <div>• Unik signaturkode: <span className="font-mono">Genereres nu</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuller
          </Button>
          <Button
            onClick={handleSign}
            disabled={!canSign || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Signerer...' : 'Accepter & Underskriv'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
