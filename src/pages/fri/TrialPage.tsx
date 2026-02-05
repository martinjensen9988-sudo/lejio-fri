import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Clock, Shield, Zap, BarChart3, Users, Lock, ArrowRight, Crown } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_45%)]" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/fri" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">Din platform</span>
          </Link>
          <div className="flex gap-4 items-center">
            <Link to="/fri/features">
              <Button variant="ghost" className="text-white/80 hover:text-amber-100 hover:bg-white/10">Alle funktioner</Button>
            </Link>
            <Link to="/fri/login">
              <Button variant="ghost" className="text-white/80 hover:text-amber-100 hover:bg-white/10">Log ind</Button>
            </Link>
            <Link to="/fri/signup">
              <Button className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">Kom i gang</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-100 font-semibold mb-6">
            <Zap className="w-4 h-4 text-amber-300" />
            14 dages gratis prøveperiode
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Prøv platformen <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">helt gratis</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Se hvordan din white‑label platform kan transformere din biludlejningsforretning. Ingen kreditkort, ingen binding.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* What's Included */}
            <Card className="border-2 border-amber-500/30 bg-white/5 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-3 text-white">
                  <Check className="w-6 h-6 text-amber-400" />
                  Hvad er inkluderet i prøveperioden?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <Users className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-100">Fuldt adgang til alle funktioner</h4>
                      <p className="text-sm text-white/60">Business plan niveau uden begrænsninger</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <Zap className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-100">Op til 50 køretøjer</h4>
                      <p className="text-sm text-white/60">Administrer hele din flåde</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <BarChart3 className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-100">Avanceret analytik</h4>
                      <p className="text-sm text-white/60">Se trends og performance metrics</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <Users className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-100">10 teammedlemmer</h4>
                      <p className="text-sm text-white/60">Samarbejd med dine medarbejdere</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <Lock className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-100">Email + Slack support</h4>
                      <p className="text-sm text-white/60">Vi hjælper dig på vejen</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                        <Zap className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-100">Branding tilpasning</h4>
                      <p className="text-sm text-white/60">Tilpass med dine farver og logo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Features */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-amber-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-100">
                    <Shield className="w-5 h-5 text-amber-400" />
                    Sikkerhed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">Enterprise-grade sikkerhed, GDPR-kompatibel hosting, SSL-kryptering på alle data.</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-amber-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-100">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Onboarding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60">Tager cirka 1 time. Vi hjælper med import af eksisterende data fra andre systemer.</p>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Preview */}
            <Card className="bg-white/5 border-amber-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Ofte stillede spørgsmål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-amber-100 mb-2">Skal jeg betale efter prøveperioden?</h4>
                  <p className="text-sm text-white/60">Nej, der er ingen automatisk betaling. Vi minder dig på dag 13, og du vælger selv hvilken plan der passer bedst.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-100 mb-2">Kan jeg slette min konto?</h4>
                  <p className="text-sm text-white/60">Ja, selvfølgelig. Du kan opsige når som helst uden begrundelse.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-100 mb-2">Hvad hvis jeg har spørgsmål?</h4>
                  <p className="text-sm text-white/60">Vores support-team svarer inden for 24 timer på mail. Under prøveperioden er support helt gratis.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Signup Form */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="border-2 border-amber-500/30 bg-white/5 backdrop-blur-xl shadow-xl shadow-amber-500/10">
              <CardHeader className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black rounded-t-lg">
                <CardTitle className="text-2xl">Start din prøveperiode</CardTitle>
                <CardDescription className="text-amber-900">Gratis i 14 dage. Ingen kreditkort.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName" className="text-amber-100 font-semibold">Virksomhedsnavn</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="fx. Min Bilutlejning ApS"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="mt-2 bg-white/10 border-amber-500/30 text-white placeholder:text-white/40 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-amber-100 font-semibold">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="din@email.dk"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-2 bg-white/10 border-amber-500/30 text-white placeholder:text-white/40 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-amber-100 font-semibold">Telefonnummer</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+45 XX XX XX XX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-2 bg-white/10 border-amber-500/30 text-white placeholder:text-white/40 focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fleetSize" className="text-amber-100 font-semibold">Hvor mange køretøjer har I?</Label>
                    <select
                      id="fleetSize"
                      name="fleetSize"
                      value={formData.fleetSize}
                      onChange={handleInputChange}
                      className="w-full mt-2 px-3 py-2 bg-white/10 border border-amber-500/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="" className="bg-[#0b0f1a]">Vælg antal</option>
                      <option value="1-5" className="bg-[#0b0f1a]">1-5 køretøjer</option>
                      <option value="6-10" className="bg-[#0b0f1a]">6-10 køretøjer</option>
                      <option value="11-25" className="bg-[#0b0f1a]">11-25 køretøjer</option>
                      <option value="26-50" className="bg-[#0b0f1a]">26-50 køretøjer</option>
                      <option value="50+" className="bg-[#0b0f1a]">50+ køretøjer</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-black font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Behandler...' : 'Start gratis prøveperiode'}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>

                  <p className="text-xs text-white/50 text-center">
                    Ved at continue accepterer du vores <a href="#" className="text-amber-400 hover:underline">Vilkår & betingelser</a>
                  </p>
                </form>

                {/* Trust badges */}
                <div className="mt-8 pt-6 border-t border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>100% sikret med SSL-kryptering</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>GDPR kompatibel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>14 dages gratis, ingen binding</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative CTA */}
            <div className="mt-6 text-center">
              <p className="text-sm text-white/60 mb-4">Eller se en demo først</p>
              <Button variant="outline" className="w-full border-amber-500/30 text-amber-100 hover:bg-amber-500/10 hover:border-amber-400">
                Se interaktiv demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white/5 backdrop-blur-sm py-12 border-t border-amber-500/20">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-white/60 text-sm font-semibold uppercase mb-8">Betroet af erhvervsdrivende overalt i Danmark</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">500+</div>
              <p className="text-sm text-white/60">Aktive brugere</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">1.200+</div>
              <p className="text-sm text-white/60">Køretøjer administreret</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">12.000+</div>
              <p className="text-sm text-white/60">Bookinger pr. måned</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">4.9/5</div>
              <p className="text-sm text-white/60">Gennemsnitlig rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/30 rounded-2xl p-12 text-white backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Klar til at få styr på din flåde?</h2>
          <p className="text-lg text-white/70 mb-8">Join hundredvis af danske bilentreprenører, der allerede bruger platformen</p>
          <Link to="#signup-form">
            <Button size="lg" className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110 font-semibold">
              Start 14-dages gratis prøveperiode
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 text-white py-12 border-t border-amber-500/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-lg text-amber-100 mb-4">Om platformen</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-amber-300">Funktioner</a></li>
                <li><a href="#" className="hover:text-amber-300">Priser</a></li>
                <li><a href="#" className="hover:text-amber-300">Prøveperiode</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg text-amber-100 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="mailto:support@yourdomain.com" className="hover:text-amber-300">support@yourdomain.com</a></li>
                <li><a href="#" className="hover:text-amber-300">Dokumentation</a></li>
                <li><a href="#" className="hover:text-amber-300">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg text-amber-100 mb-4">Juridisk</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-amber-300">Privatlivspolitik</a></li>
                <li><a href="#" className="hover:text-amber-300">Vilkår & betingelser</a></li>
                <li><a href="#" className="hover:text-amber-300">GDPR</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg text-amber-100 mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>Din virksomhed</li>
                <li>Danmark</li>
                <li><a href="tel:+4544889999" className="hover:text-amber-300">+45 44 88 99 99</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-amber-500/20 pt-8 text-center text-sm text-white/50">
            <p>© 2026 Din platform. Alle rettigheder forbeholdt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
