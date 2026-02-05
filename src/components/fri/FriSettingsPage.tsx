import { useState, useEffect } from 'react';
import { useFriSettings } from '@/hooks/useFriSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Zap, Shield } from 'lucide-react';

interface FriSettingsPageProps {
  userId: string | null;
}

export function FriSettingsPage({ userId }: FriSettingsPageProps) {
  const {
    account,
    loading,
    error,
    success,
    updateAccount,
    updateBranding,
    isTrialExpired,
    getTrialDaysRemaining,
    dismissError,
    dismissSuccess,
  } = useFriSettings(userId);

  // Account settings form
  const [accountForm, setAccountForm] = useState({
    company_name: '',
    custom_domain: '',
    cvr_number: '',
  });

  const [brandingForm, setBrandingForm] = useState({
    primary_color: '',
    logo_url: '',
  });

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  // Update forms when account data loads
  useEffect(() => {
    if (account) {
      setAccountForm({
        company_name: account.company_name,
        custom_domain: account.custom_domain || '',
        cvr_number: account.cvr_number || '',
      });
      setBrandingForm({
        primary_color: account.branding?.primary_color || '',
        logo_url: account.branding?.logo_url || '',
      });
    }
  }, [account?.id]);

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await updateAccount(accountForm);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      await updateBranding(brandingForm);
    } finally {
      setSavingBranding(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Indlæser indstillinger...</div>;
  }

  if (!account) {
    return <div className="text-center py-12 text-gray-600">Kunne ikke indlæse indstillinger</div>;
  }

  const trialDaysRemaining = getTrialDaysRemaining();
  const trialExpired = isTrialExpired();

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Fejl</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={dismissError} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button onClick={dismissSuccess} className="text-green-600 hover:text-green-800">
            ✕
          </button>
        </div>
      )}

      {/* Trial Status */}
      {account.subscription_tier === 'trial' && (
        <div className={`rounded-lg border-2 p-6 flex gap-4 items-start ${
          trialExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <Clock className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
            trialExpired ? 'text-red-600' : 'text-blue-600'
          }`} />
          <div className="flex-1">
            <h3 className={`font-semibold text-lg ${
              trialExpired ? 'text-red-900' : 'text-blue-900'
            }`}>
              {trialExpired ? 'Prøveperiode udløbet' : 'Prøveperiode aktiv'}
            </h3>
            <p className={`text-sm mt-1 ${
              trialExpired ? 'text-red-700' : 'text-blue-700'
            }`}>
              {trialExpired
                ? 'Din prøveperiode er udløbet. Opgrader til at fortsætte.'
                : `Du har ${trialDaysRemaining} dage tilbage af din prøveperiode.`}
            </p>
            <Button className="mt-3">
              {trialExpired ? 'Opgrader nu' : 'Se abonnementer'}
            </Button>
          </div>
        </div>
      )}

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Kontoindstillinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Virksomhedsnavn *
              </label>
              <Input
                value={accountForm.company_name}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, company_name: e.target.value })
                }
                placeholder="Din virksomhed"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brugerdefineret domæne
              </label>
              <Input
                value={accountForm.custom_domain}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, custom_domain: e.target.value })
                }
                placeholder="fx. udlejning.eksempel.dk"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dit unikke domæne for hvid-label-løsning
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVR-nummer
              </label>
              <Input
                value={accountForm.cvr_number}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, cvr_number: e.target.value })
                }
                placeholder="12345678"
              />
            </div>

            <div className="border-t pt-4">
              <Button type="submit" disabled={savingAccount}>
                {savingAccount ? 'Gemmer...' : 'Gem kontoindstillinger'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateBranding} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primær farve
              </label>
              <div className="flex gap-3">
                <Input
                  type="color"
                  value={brandingForm.primary_color}
                  onChange={(e) =>
                    setBrandingForm({ ...brandingForm, primary_color: e.target.value })
                  }
                  className="w-20"
                />
                <Input
                  type="text"
                  value={brandingForm.primary_color}
                  onChange={(e) =>
                    setBrandingForm({ ...brandingForm, primary_color: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bruges til knapper, links og vigtige elementer
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <Input
                type="url"
                value={brandingForm.logo_url}
                onChange={(e) =>
                  setBrandingForm({ ...brandingForm, logo_url: e.target.value })
                }
                placeholder="https://eksempel.dk/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Direkte link til dit logo-billede
              </p>
            </div>

            {brandingForm.logo_url && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Logoforhåndsvisning:</p>
                <img
                  src={brandingForm.logo_url}
                  alt="Logo preview"
                  className="h-12 max-w-xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="border-t pt-4">
              <Button type="submit" disabled={savingBranding}>
                {savingBranding ? 'Gemmer...' : 'Gem branding'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Abonnementstype:</span>
              <span className="font-semibold capitalize">
                {account.subscription_tier === 'trial' ? 'Prøveperiode' : account.subscription_tier}
              </span>
            </div>

            {account.subscription_started_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Abonnement startet:</span>
                <span className="font-semibold">
                  {new Date(account.subscription_started_at).toLocaleDateString('da-DK')}
                </span>
              </div>
            )}

            {account.trial_expires_at && account.subscription_tier === 'trial' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Prøveperiode udløber:</span>
                <span className="font-semibold">
                  {new Date(account.trial_expires_at).toLocaleDateString('da-DK')}
                </span>
              </div>
            )}

            <div className="pt-3 border-t">
              <Button variant="outline" className="w-full">
                Se abonnementsmuligheder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Kontoinformation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Konto-ID:</span>
              <span className="font-mono text-gray-900">{account.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Oprettet:</span>
              <span className="text-gray-900">
                {new Date(account.created_at).toLocaleDateString('da-DK')}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Senest opdateret:</span>
              <span className="text-gray-900">
                {new Date(account.updated_at).toLocaleDateString('da-DK')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Farlig zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Disse handlinger kan ikke fortrydes. Vær venligst forsigtig.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Slet konto
              </Button>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                Download data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
