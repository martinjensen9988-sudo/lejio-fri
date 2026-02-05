import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useFriAuth } from '@/hooks/useFriAuth';
import { createLessorAccount } from '@/hooks/useLessorAccount';
import { Crown } from 'lucide-react';

export function FriSignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, user } = useFriAuth();

  const selectedTier = searchParams.get('tier') || 'business';

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    cvr: '',
    domain: '',
    primaryColor: '#0066cc',
  });

  const [step, setStep] = useState<'credentials' | 'company' | 'branding'>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp(formData.email, formData.password);
      setStep('company');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) {
      setError('Virksomhedsnavn er påkrævet');
      return;
    }
    if (!formData.domain) {
      setError('Domæne er påkrævet');
      return;
    }
    setError(null);
    setStep('branding');
  };

  const handleBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user) throw new Error('No user found');

      // Create lessor account
      await createLessorAccount({
        user_id: user.id,
        company_name: formData.companyName,
        custom_domain: formData.domain,
        cvr_number: formData.cvr || undefined,
        primary_color: formData.primaryColor,
      });

      // Redirect to dashboard
      navigate('/fri/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center px-4 py-8 relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_45%)]" />
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/fri" className="inline-flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Din platform</h1>
          <p className="text-amber-200/80">Kom i gang med din bilutlejningsplatform</p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">
              {step === 'credentials' && 'Opret konto'}
              {step === 'company' && 'Om din virksomhed'}
              {step === 'branding' && 'Tilpas dit udseende'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Credentials */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-1">
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="din@email.dk"
                    required
                    autoComplete="email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-1">
                    Adgangskode
                  </label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 8 tegn"
                    required
                    autoComplete="new-password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-100">
                    ✓ <strong>14 dages gratis prøveperiode</strong> inkluderet
                  </p>
                  <p className="text-sm text-amber-200/80 mt-1">
                    Plan: <strong>{selectedTier === 'professional' ? 'Professional (kr. 599/måned)' : selectedTier === 'business' ? 'Business (kr. 999/måned)' : 'Enterprise (kr. 1.499/måned)'}</strong>
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110" disabled={loading}>
                  {loading ? 'Opretter...' : 'Næste'}
                </Button>
              </form>
            )}

            {/* Step 2: Company */}
            {step === 'company' && (
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-white/80 mb-1">
                    Virksomhedsnavn
                  </label>
                  <Input
                    id="company-name"
                    name="company-name"
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="f.eks. Biluthyr ApS"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-white/80 mb-1">
                    Dit domæne
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="domain"
                      name="domain"
                      type="text"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      placeholder="biluthyr"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <span className="text-white/60">.ditdomæne.dk</span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Dit dashboard bliver: biluthyr.ditdomæne.dk
                  </p>
                </div>

                <div>
                  <label htmlFor="cvr" className="block text-sm font-medium text-white/80 mb-1">
                    CVR-nummer (valgfrit)
                  </label>
                  <Input
                    id="cvr"
                    name="cvr"
                    type="text"
                    value={formData.cvr}
                    onChange={(e) =>
                      setFormData({ ...formData, cvr: e.target.value })
                    }
                    placeholder="12345678"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => setStep('credentials')}
                  >
                    Tilbage
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">
                    Næste
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Branding */}
            {step === 'branding' && (
              <form onSubmit={handleBrandingSubmit} className="space-y-4">
                <div>
                  <label htmlFor="primary-color" className="block text-sm font-medium text-white/80 mb-1">
                    Primær farve
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="primary-color"
                      name="primary-color"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="w-12 h-12 border border-white/20 rounded cursor-pointer bg-transparent"
                    />
                    <span className="text-white/70 text-sm">{formData.primaryColor}</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-white/70 mb-2">Preview:</p>
                  <div
                    className="h-20 rounded flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    {formData.companyName || 'Din virksomhed'}
                  </div>
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded p-3">
                  <p className="text-sm text-amber-100">
                    Logo og mere branding kan tilpasses senere i indstillinger.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded text-red-200 text-sm p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    onClick={() => setStep('company')}
                  >
                    Tilbage
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110" disabled={loading}>
                    {loading ? 'Opretter...' : 'Fuldfør tilmelding'}
                  </Button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-white/70">
              Har du allerede en konto?{' '}
              <button
                onClick={() => navigate('/fri/login')}
                className="text-amber-300 hover:underline font-medium"
              >
                Log ind her
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
