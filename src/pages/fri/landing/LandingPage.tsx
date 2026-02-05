import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Crown, ShieldCheck, Sparkles, TrendingUp, Users, Wand2 } from 'lucide-react';

export function FriLandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_45%),radial-gradient(circle_at_30%_30%,_rgba(56,189,248,0.2),_transparent_40%),radial-gradient(circle_at_80%_20%,_rgba(167,139,250,0.2),_transparent_40%)]" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-semibold">Din platform</div>
              <div className="text-xs text-white/60">White‑label biludlejning</div>
            </div>
          </div>
          <div className="hidden md:flex gap-4 items-center">
            <Link to="/fri/features">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">Alle funktioner</Button>
            </Link>
            <Link to="/fri/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">Log ind</Button>
            </Link>
            <Link to="/fri/signup">
              <Button className="bg-white text-black hover:bg-white/90">Kom i gang</Button>
            </Link>
          </div>
          <Link to="/fri/signup" className="md:hidden">
            <Button className="bg-white text-black hover:bg-white/90">Kom i gang</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm text-white/80 mb-6">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Eksklusivt design til premium udlejere
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
              Luksuriøs white‑label platform til moderne biludlejning
            </h1>
            <p className="text-lg text-white/70 mt-6 max-w-2xl">
              Skab en premium oplevelse for dine kunder med et stilrent, hurtigt og sikkert system, der samler flåde, bookinger og fakturaer i ét kontrolcenter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/fri/trial">
                <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                  Start gratis prøveperiode <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/fri/features">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Se alle features
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div>
                <p className="text-2xl font-semibold">98%</p>
                <p className="text-sm text-white/60">Kundetilfredshed</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">2 min</p>
                <p className="text-sm text-white/60">Opsætningstid</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">24/7</p>
                <p className="text-sm text-white/60">Overvågning</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 blur-2xl rounded-full" />
            <Card className="relative bg-white/5 border border-white/10 backdrop-blur-xl text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Executive Dashboard</CardTitle>
                <CardDescription className="text-white/60">Real‑time overblik over din flåde</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">Aktive bookinger</p>
                    <p className="text-2xl font-semibold">128</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/60">Månedlig omsætning</p>
                    <p className="text-2xl font-semibold">kr. 412k</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4">
                  <p className="text-sm text-white/70">Top performer</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-semibold">Audi Q8</p>
                      <p className="text-xs text-white/60">Udnyttelse 92%</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-cyan-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-7xl mx-auto px-4 pb-6">
        <div className="grid md:grid-cols-3 gap-6 text-white/70">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            GDPR‑klar, sikker og krypteret
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Users className="h-5 w-5 text-indigo-300" />
            Skalerbart til team og enterprise
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Wand2 className="h-5 w-5 text-cyan-300" />
            Branding med dit eget navn og domæne
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Eksklusiv funktionalitet</p>
            <h2 className="text-3xl md:text-4xl font-semibold mt-3">Alt du forventer af en premium platform</h2>
          </div>
          <Link to="/fri/features" className="hidden md:inline-flex">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">Se alle features</Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Flådestyring', text: 'Kontrol, vedligeholdelse og dokumenter i ét elegant cockpit.' },
            { title: 'Bookinger', text: 'Automatiske bekræftelser, kalender og konflikt‑beskyttelse.' },
            { title: 'Fakturering', text: 'Branded fakturaer, betalinger og opfølgning uden friktion.' },
            { title: 'Analytik', text: 'ROI‑overblik, udnyttelse og performance pr. køretøj.' },
            { title: 'Teamsamarbejde', text: 'Rolle‑baseret adgang og audit‑logs til kontrol.' },
            { title: 'White‑label', text: 'Din branding, dine farver, dit domæne, din oplevelse.' },
          ].map((item) => (
            <Card key={item.title} className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Priser</p>
            <h2 className="text-3xl md:text-4xl font-semibold mt-3">En plan til enhver ambition</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <CardDescription className="text-white/60">Solo og små flåder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-semibold">kr. 599</span>
                  <span className="text-white/60">/måned</span>
                </div>
                <ul className="space-y-3 mb-6 text-white/80">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />10 køretøjer</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />3 teammedlemmer</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Grundlæggende analytik</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Email support</li>
                </ul>
                <Link to="/fri/signup?tier=professional">
                    <Button className="w-full border-white/20 text-white hover:bg-white/10" variant="outline">Vælg plan</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-white/10 to-white/5 border-indigo-400/50 text-white shadow-2xl">
              <CardHeader>
                <div className="bg-white text-black px-3 py-1 rounded-full text-sm w-fit mb-2">Mest populær</div>
                <CardTitle>Business</CardTitle>
                <CardDescription className="text-white/60">Voksende virksomheder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-semibold">kr. 999</span>
                  <span className="text-white/60">/måned</span>
                </div>
                <ul className="space-y-3 mb-6 text-white/80">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />50 køretøjer</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />10 teammedlemmer</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Avanceret analytik</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />API adgang (read‑only)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Branding tilpasning</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Email + Slack support</li>
                </ul>
                <Link to="/fri/signup?tier=business">
                  <Button className="w-full bg-white text-black hover:bg-white/90">Kom i gang</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription className="text-white/60">Større netværk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-semibold">kr. 1.499</span>
                  <span className="text-white/60">/måned</span>
                </div>
                <ul className="space-y-3 mb-6 text-white/80">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Ubegrænsede køretøjer</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Ubegrænsede brugere</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Fuldt API + webhooks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />Custom domæne</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" />24/7 prioritets support</li>
                </ul>
                <Link to="/fri/signup?tier=enterprise">
                    <Button className="w-full border-white/20 text-white hover:bg-white/10" variant="outline">Kontakt os</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-10 text-center">
            <h2 className="text-4xl font-semibold mb-4">Klar til en premium oplevelse?</h2>
            <p className="text-white/70 mb-8">14 dages gratis prøve. Ingen kreditkort. Opsætning på få minutter.</p>
            <Link to="/fri/trial">
              <Button size="lg" className="bg-white text-black hover:bg-white/90">
                Start gratis prøveperiode
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/60">
          <p>© 2026 Din platform. Alle rettigheder forbeholdt.</p>
        </div>
      </footer>
    </div>
  );
}
