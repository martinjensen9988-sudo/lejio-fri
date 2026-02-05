import React, { useMemo, useState } from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { workshopModules } from '@/data/workshopModules';
import { useFriModules } from '@/hooks/useFriModules';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FriModulesPage() {
  const { modules, isLoading, error, setModule, isUpdating } = useFriModules();
  const [expandedModule, setExpandedModule] = useState<string | null>('garageplan');

  const enabledModuleIds = useMemo(() => {
    return new Set(modules.filter((module) => module.status === 'active').map((module) => module.module_id));
  }, [modules]);

  const stats = useMemo(() => {
    const enabledCount = workshopModules.filter((module) => enabledModuleIds.has(module.id)).length;
    const readyCount = workshopModules.filter((module) => module.status === 'Klar').length;
    return { enabledCount, readyCount };
  }, [enabledModuleIds]);

  return (
    <FriDashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Garage Moduler</h1>
          <p className="text-white/60 mt-2">
            Aktiver de moduler dit værksted har brug for – og udvid når I er klar. Se alle features, benefits og integrationer.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-lg p-4 text-sm">
            {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-white/60">Aktive moduler</p>
            <p className="text-2xl font-semibold text-white mt-2">{stats.enabledCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-white/60">Klar til aktivering</p>
            <p className="text-2xl font-semibold text-white mt-2">{stats.readyCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-white/60">Total moduler</p>
            <p className="text-2xl font-semibold text-white mt-2">{workshopModules.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {workshopModules.map((module) => {
            const isEnabled = enabledModuleIds.has(module.id);
            const isExpanded = expandedModule === module.id;
            
            return (
              <Card key={module.id} className="bg-white/5 border border-white/10 text-white overflow-hidden">
                <div
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                  className="cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-white">{module.name}</CardTitle>
                          <span className="text-xs px-2 py-1 rounded-full border border-white/15 text-white/70">
                            {module.status}
                          </span>
                        </div>
                        <CardDescription className="text-white/60 mt-1">{module.tag}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-white/50" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/50" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </div>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t border-white/10 pt-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2">Beskrivelse</h4>
                      <p className="text-sm text-white/70">{module.description}</p>
                    </div>

                    {/* Highlights/Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-3">Funktioner</h4>
                      <ul className="text-sm text-white/70 space-y-2 grid grid-cols-2 gap-2">
                        {module.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-2">
                            <span className="text-amber-400 mt-1">✓</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits/Outcomes */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-3">Fordele</h4>
                      <ul className="text-sm text-white/70 space-y-2 grid grid-cols-2 gap-2">
                        {module.outcomes.map((outcome) => (
                          <li key={outcome} className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">⭐</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Integrations */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-3">Integrationer</h4>
                      <div className="flex flex-wrap gap-2">
                        {module.integrations.map((integration) => (
                          <div
                            key={integration}
                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70"
                          >
                            {integration}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                      <span className={isEnabled ? 'text-emerald-300 text-xs font-medium' : 'text-white/50 text-xs font-medium'}>
                        {isEnabled ? '✓ Aktiveret' : 'Ikke aktiveret'}
                      </span>
                      <Button
                        size="sm"
                        variant={isEnabled ? 'outline' : 'default'}
                        className={isEnabled ? 'border-white/20 text-white hover:bg-white/10' : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110'}
                        onClick={() => setModule({ moduleId: module.id, enabled: !isEnabled })}
                        disabled={module.status !== 'Klar' || isUpdating || isLoading}
                      >
                        {isLoading ? 'Indlæser...' : module.status === 'Klar' ? (isEnabled ? 'Deaktiver' : 'Aktiver') : 'Book demo'}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </FriDashboardLayout>
  );
}
