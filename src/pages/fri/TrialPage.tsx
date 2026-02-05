import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Clock, Shield, Zap, BarChart3, Users, Lock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FriTrialPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    fleetSize: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // For now, just redirect to signup with trial params
      const params = new URLSearchParams({
        trial: 'true',
        company: formData.companyName,
        email: formData.email,
      });
      navigate(`/fri/signup?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/fri" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Din platform
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/fri/features">
              <Button variant="ghost">Alle funktioner</Button>
            </Link>
            <Link to="/fri/login">
              <Button variant="ghost">Log ind</Button>
            </Link>
            <Link to="/fri/signup">
              <Button>Kom i gang</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-semibold mb-6">
            <Zap className="w-4 h-4" />
            14 dages gratis prøveperiode
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            Prøv platformen <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">helt gratis</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Se hvordan din white‑label platform kan transformere din biludlejningsforretning. Ingen kreditkort, ingen binding.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* What's Included */}
            <Card className="border-2 border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  Hvad er inkluderet i prøveperioden?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fuldt adgang til alle funktioner</h4>
                      <p className="text-sm text-gray-600">Business plan niveau uden begrænsninger</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Op til 50 køretøjer</h4>
                      <p className="text-sm text-gray-600">Administrer hele din flåde</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Avanceret analytik</h4>
                      <p className="text-sm text-gray-600">Se trends og performance metrics</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">10 teammedlemmer</h4>
                      <p className="text-sm text-gray-600">Samarbejd med dine medarbejdere</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Lock className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email + Slack support</h4>
                      <p className="text-sm text-gray-600">Vi hjælper dig på vejen</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Zap className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Branding tilpasning</h4>
                      <p className="text-sm text-gray-600">Tilpass med dine farver og logo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Sikkerhed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Enterprise-grade sikkerhed, GDPR-kompatibel hosting, SSL-kryptering på alle data.</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Onboarding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Tager cirka 1 time. Vi hjælper med import af eksisterende data fra andre systemer.</p>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Preview */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Ofte stillede spørgsmål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skal jeg betale efter prøveperioden?</h4>
                  <p className="text-sm text-gray-600">Nej, der er ingen automatisk betaling. Vi minder dig på dag 13, og du vælger selv hvilken plan der passer bedst.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Kan jeg slette min konto?</h4>
                  <p className="text-sm text-gray-600">Ja, selvfølgelig. Du kan opsige når som helst uden begrundelse.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Hvad hvis jeg har spørgsmål?</h4>
                  <p className="text-sm text-gray-600">Vores support-team svarer inden for 24 timer på mail. Under prøveperioden er support helt gratis.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Signup Form */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-2 border-blue-600 bg-white shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Start din prøveperiode</CardTitle>
                <CardDescription className="text-blue-100">Gratis i 14 dage. Ingen kreditkort.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName" className="text-gray-700 font-semibold">Virksomhedsnavn</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="fx. Min Bilutlejning ApS"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="din@email.dk"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">Telefonnummer</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+45 XX XX XX XX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fleetSize" className="text-gray-700 font-semibold">Hvor mange køretøjer har I?</Label>
                    <select
                      id="fleetSize"
                      name="fleetSize"
                      value={formData.fleetSize}
                      onChange={handleInputChange}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Vælg antal</option>
                      <option value="1-5">1-5 køretøjer</option>
                      <option value="6-10">6-10 køretøjer</option>
                      <option value="11-25">11-25 køretøjer</option>
                      <option value="26-50">26-50 køretøjer</option>
                      <option value="50+">50+ køretøjer</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Behandler...' : 'Start gratis prøveperiode'}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Ved at continue accepterer du vores <a href="#" className="text-blue-600 hover:underline">Vilkår & betingelser</a>
                  </p>
                </form>

                {/* Trust badges */}
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>100% sikret med SSL-kryptering</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>GDPR kompatibel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>14 dages gratis, ingen binding</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative CTA */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Eller se en demo først</p>
              <Button variant="outline" className="w-full">
                Se interaktiv demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white/50 backdrop-blur-sm py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-600 text-sm font-semibold uppercase mb-8">Betroet af erhvervsdrivende overalt i Danmark</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <p className="text-sm text-gray-600">Aktive brugere</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">1.200+</div>
              <p className="text-sm text-gray-600">Køretøjer administreret</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">12.000+</div>
              <p className="text-sm text-gray-600">Bookinger pr. måned</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">4.9/5</div>
              <p className="text-sm text-gray-600">Gennemsnitlig rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Klar til at få styr på din flåde?</h2>
          <p className="text-lg text-blue-100 mb-8">Join hundredvis af danske bilentreprenører, der allerede bruger platformen</p>
          <Link to="#signup-form">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold">
              Start 14-dages gratis prøveperiode
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Om platformen</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Funktioner</a></li>
                <li><a href="#" className="hover:text-white">Priser</a></li>
                <li><a href="#" className="hover:text-white">Prøveperiode</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="mailto:support@yourdomain.com" className="hover:text-white">support@yourdomain.com</a></li>
                <li><a href="#" className="hover:text-white">Dokumentation</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Juridisk</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privatlivspolitik</a></li>
                <li><a href="#" className="hover:text-white">Vilkår & betingelser</a></li>
                <li><a href="#" className="hover:text-white">GDPR</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Din virksomhed</li>
                <li>Danmark</li>
                <li><a href="tel:+4544889999" className="hover:text-white">+45 44 88 99 99</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Din platform. Alle rettigheder forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
