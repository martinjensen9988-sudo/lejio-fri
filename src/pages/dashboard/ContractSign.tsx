import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Contract, useContracts } from '@/hooks/useContracts';
import { useAuth } from '@/hooks/useAuth';
import ContractPreview from '@/components/contracts/ContractPreview';
import SignaturePadComponent from '@/components/contracts/SignaturePad';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

const ContractSignPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contracts, signContract, isLoading } = useContracts();
  const [signature, setSignature] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedVanvidskorsel, setAcceptedVanvidskorsel] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const contract = contracts.find(c => c.id === id);

  if (isLoading) {
    return (
      <DashboardLayout activeTab="bookings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout activeTab="bookings">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Kontrakt ikke fundet</h2>
          <Button variant="outline" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til bookinger
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isLessor = user?.id === contract.lessor_id;
  const isRenter = user?.id === contract.renter_id || !contract.renter_id;
  const role: 'lessor' | 'renter' = isLessor ? 'lessor' : 'renter';
  
  const alreadySigned = role === 'lessor' ? !!contract.lessor_signature : !!contract.renter_signature;
  const canSign = role === 'renter' 
    ? contract.status === 'pending_renter_signature' || contract.status === 'pending_lessor_signature'
    : contract.status === 'pending_lessor_signature' || contract.status === 'pending_renter_signature';

  const handleSign = async () => {
    if (!signature) return;
    
    setIsSigning(true);
    const result = await signContract(contract.id, signature, acceptedVanvidskorsel, role);
    setIsSigning(false);
    
    if (result) {
      navigate('/dashboard/bookings');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Ikke angivet';
    return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
  };

  return (
    <DashboardLayout activeTab="bookings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-primary" />
              {alreadySigned ? 'Kontrakt allerede underskrevet' : 'Underskriv kontrakt'}
            </h1>
            <p className="text-muted-foreground">Kontrakt #{contract.contract_number}</p>
          </div>
        </div>

        {/* Contract Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Kontraktdetaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <ContractPreview contract={contract} />
          </CardContent>
        </Card>

        {/* Signing Section */}
        {!alreadySigned && canSign && (
          <Card>
            <CardHeader>
              <CardTitle>
                Din underskrift som {role === 'lessor' ? 'udlejer' : 'lejer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Annuller
                </Button>
                <Button
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
            </CardContent>
          </Card>
        )}

        {alreadySigned && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="w-12 h-12 text-mint mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Du har allerede underskrevet denne kontrakt
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {contract.status === 'signed' 
                  ? 'Kontrakten er fuldt underskrevet af begge parter.'
                  : 'Kontrakten afventer underskrift fra den anden part.'}
              </p>
              <Button variant="outline" onClick={() => navigate('/dashboard/bookings')}>
                Tilbage til bookinger
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContractSignPage;
