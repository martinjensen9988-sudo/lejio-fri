import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { FriMarketingLayout } from '@/components/fri/FriMarketingLayout';
import { workshopModules } from '@/data/workshopModules';

export function WorkshopModulePage() {
  const { moduleId } = useParams();
  const module = workshopModules.find((item) => item.id === moduleId);

  if (!module) {
    return (
      <FriMarketingLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold text-white">Modul ikke fundet</h1>
          <p className="text-white/60 mt-4">Vælg et modul fra oversigten.</p>
          <Link to="/fri/workshop">
            <Button className="mt-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">
              Tilbage til oversigt
            </Button>
          </Link>
        </div>
      </FriMarketingLayout>
    );
  }

  return (
    <FriMarketingLayout>
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link to="/fri/workshop" className="text-white/60 hover:text-white text-sm">
            ← Tilbage til moduler
          </Link>
        </div>

        <Card className="bg-white/5 border border-white/10 text-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-3xl text-white">{module.name}</CardTitle>
              <span className="text-xs px-2 py-1 rounded-full border border-white/15 text-white/70">
                {module.status}
              </span>
            </div>
            <CardDescription className="text-white/60">{module.tag}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-white/70">{module.description}</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">Highlights</h3>
                <ul className="text-sm text-white/70 space-y-1">
                  {module.highlights.map((highlight) => (
                    <li key={highlight}>• {highlight}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">Integrationer</h3>
                <ul className="text-sm text-white/70 space-y-1">
                  {module.integrations.map((integration) => (
                    <li key={integration}>• {integration}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2">Forretningsværdi</h3>
              <ul className="text-sm text-white/70 space-y-1">
                {module.outcomes.map((outcome) => (
                  <li key={outcome}>• {outcome}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110">
                {module.status === 'Klar' ? 'Aktiver modul' : 'Book demo'}
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Tilføj til roadmap <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </FriMarketingLayout>
  );
}
