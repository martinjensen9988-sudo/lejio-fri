import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, TrendingUp, Zap, Users, ShoppingCart, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FriMarketingLayout } from '@/components/fri/FriMarketingLayout';
import { workshopModules } from '@/data/workshopModules';

export function WorkshopModulesPublic() {
  const [expandedModule, setExpandedModule] = useState<string | null>('garageplan');

  const useCases = [
    {
      icon: Wrench,
      title: 'Autoværksteder',
      description: 'Planlægning af reparationer, ressourcestyring, tidsregistrering og arbejdskort. Styr over mekanikere, værktøj og kundeservice.',
      features: ['Planering', 'Tidsregistrering', 'Ressourcestyring', 'Arbejdskort', 'Kundenotifikationer'],
    },
    {
      icon: TrendingUp,
      title: 'Biludlejning & Leasing',
      description: 'Håndter flåden, bookinger, kundeforvalting og fakturering. Integrationer til leasingselskaber og finansieringspartnere.',
      features: ['Flådestyring', 'Reservationssystem', 'Kundeprofiler', 'Fakturering', 'Leasingintegrationer'],
    },
    {
      icon: ShoppingCart,
      title: 'Bilsalg',
      description: 'Salgsprocesser, kundeforhold, finansieringsoptioner og handel. Integration med finansieringsmulig­hedere og bilhandel-systemer.',
      features: ['Salgspipeline', 'CRM', 'Finansiering', 'Handel', 'Dokumenter'],
    },
    {
      icon: Truck,
      title: 'Autodele Grossister',
      description: 'Lagerstyring, ordreforvaltning, B2B-forhandlinger og dropshipment. Integrations til leverandører og værksteder.',
      features: ['Lagerstyring', 'Ordreforvaltning', 'B2B Portal', 'Dropshipment', 'Leverandørintegrationen'],
    },
  ];

  const integrationRoadmap = [
    {
      category: 'Bilteste API',
      status: 'Under udvikling',
      description: 'Fuld integration til åbne biltest-APIs som brugt på værksteder til stik-prøve inspektioner',
      integrations: ['Tekniske test', 'Miljøtests', 'Syn registrering', 'Inspektionsrapporter'],
    },
    {
      category: 'Autodele Grossister',
      status: 'Planlagt',
      description: 'Open API forbindelser til autoparte-distributører for automatisk prisfeed, lagerkontrol og ordreflow',
      integrations: ['Pris feed', 'Lagertilgængelighed', 'Automatisk ordring', 'Invoiceringflow'],
    },
    {
      category: 'Åbne Auto-APIs',
      status: 'Planlagt',
      description: 'Generelle åbne APIs for integration med andre auto-industri systemer og værktøjer',
      integrations: ['REST API', 'Webhook support', 'Rate limiting', 'Auth tokens'],
    },
  ];

  return (
    <FriMarketingLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Lejio Fri til Autoindustrien
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Komplet digital løsning for værksteder, biludlejning, bilsalg, og autodele-distributører. 
              Alt fra planlægning til fakturering i ét system.
            </p>
          </div>
        </section>

        {/* Use Cases */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-y border-slate-700/50">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Løsninger for dit forretningsområde
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.title} className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-lg">
                      <useCase.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white">{useCase.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-sm">{useCase.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {useCase.features.map((feature) => (
                      <Badge key={feature} className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Garage Moduler */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-white mb-12">
            Garage Moduler - Alle Funktioner
          </h2>
          <div className="space-y-4">
            {workshopModules.map((module) => {
              const isExpanded = expandedModule === module.id;
              
              return (
                <Card key={module.id} className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-colors overflow-hidden">
                  <div
                    onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                    className="cursor-pointer hover:bg-slate-700/30 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-white text-lg">{module.name}</CardTitle>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                              {module.status}
                            </Badge>
                          </div>
                          <CardDescription className="text-slate-400 mt-1">{module.tag}</CardDescription>
                        </div>
                        <div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </div>

                  {isExpanded && (
                    <CardContent className="space-y-6 border-t border-slate-700/50 pt-6">
                      <div>
                        <h4 className="text-sm font-semibold text-amber-300 mb-2">Beskrivelse</h4>
                        <p className="text-slate-300 text-sm">{module.description}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-amber-300 mb-3">Funktioner</h4>
                        <ul className="text-sm text-slate-300 space-y-2 grid grid-cols-2 gap-2">
                          {module.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-2">
                              <span className="text-amber-400 mt-1">✓</span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-amber-300 mb-3">Fordele</h4>
                        <ul className="text-sm text-slate-300 space-y-2 grid grid-cols-2 gap-2">
                          {module.outcomes.map((outcome) => (
                            <li key={outcome} className="flex items-start gap-2">
                              <span className="text-green-400 mt-1">⭐</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-amber-300 mb-3">Integrationer</h4>
                        <div className="flex flex-wrap gap-2">
                          {module.integrations.map((integration) => (
                            <div
                              key={integration}
                              className="px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600 text-xs text-slate-300"
                            >
                              {integration}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* Integration Roadmap */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-700/50">
          <h2 className="text-3xl font-bold text-white mb-4">
            Integration Roadmap
          </h2>
          <p className="text-slate-300 mb-12">
            Coming: Åbne API-forbindelser til industri-standards
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrationRoadmap.map((item) => (
              <Card key={item.category} className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-amber-300 text-lg flex items-center justify-between">
                    {item.category}
                    <Badge className={item.status === 'Under udvikling' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-600/20 text-slate-300'}>
                      {item.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-sm">{item.description}</p>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {item.integrations.map((integration) => (
                      <li key={integration}>• {integration}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-700/50">
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Klar til at transformere dit forretning?</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Bliv med tusindvis af værksteder, leasingselskaber og bilsælgere som bruger Lejio Fri til at drive deres business digitalt
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Start gratis prøveperiode
              </Button>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Book demo
              </Button>
            </div>
          </div>
        </section>
      </div>
    </FriMarketingLayout>
  );
}
