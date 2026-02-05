import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { FriMarketingLayout } from '@/components/fri/FriMarketingLayout';
import { workshopModules } from '@/data/workshopModules';

export function WorkshopLanding() {
  return (
    <FriMarketingLayout>
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm text-white/80 mb-6">
            Modul‑baseret værkstedsstyring
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
            Alt til værkstedet i{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300">én platform</span>
          </h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto mt-6">
            Sammensæt præcis de moduler dit værksted har brug for – og udvid løbende. TRISYS‑inspireret modulstruktur med fuld fleksibilitet.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/fri/workshop/garageplan">
              <Button size="lg" className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">
                Start med GaragePlan <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/fri/trial">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Book demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshopModules.map((module) => (
            <Card key={module.id} className="bg-white/5 border border-white/10 text-white">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-white">{module.name}</CardTitle>
                  <span className="text-xs px-2 py-1 rounded-full border border-white/15 text-white/70">
                    {module.status}
                  </span>
                </div>
                <CardDescription className="text-white/60">{module.tag}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-white/70">{module.description}</p>
                <ul className="text-xs text-white/60 space-y-1">
                  {module.highlights.slice(0, 2).map((highlight) => (
                    <li key={highlight}>• {highlight}</li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-white/70">
                    {module.status === 'Klar' ? 'Modul klar til tilvalg' : 'I pipeline til aktivering'}
                  </span>
                </div>
                <Link to={`/fri/workshop/${module.id}`} className="inline-flex items-center text-amber-200 hover:text-amber-100 text-sm">
                  Se modul <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </FriMarketingLayout>
  );
}
