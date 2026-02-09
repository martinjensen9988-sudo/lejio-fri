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
          <h1 className="text-3xl font-bold text-brown-900">Garage Moduler</h1>
          <p className="text-gray-500 mt-2">
            Aktiver de moduler dit værksted har brug for – og udvid når I er klar. Se alle features, benefits og integrationer.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Aktive moduler</p>
            <p className="text-2xl font-bold text-brown-900 mt-2">{stats.enabledCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Klar til aktivering</p>
            <p className="text-2xl font-bold text-brown-900 mt-2">{stats.readyCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total moduler</p>
            <p className="text-2xl font-bold text-brown-900 mt-2">{workshopModules.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {workshopModules.map((module) => {
            const isEnabled = enabledModuleIds.has(module.id);
            const isExpanded = expandedModule === module.id;
            const isGarageDeal = module.id === 'garadeal' || module.name === 'GarageDeal' || module.tag === 'Bilsalg';
            const effectiveStatus = isGarageDeal ? 'Klar' : module.status;
            
            return (
              <Card key={module.id} className="bg-white border border-gray-100 shadow-sm text-brown-900 overflow-hidden">
                <div
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-brown-900">{module.name}</CardTitle>
                          <span className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-500">
                            {effectiveStatus}
                          </span>
                        </div>
                        <CardDescription className="text-gray-500 mt-1">{module.tag}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </div>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t border-gray-100 pt-6">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Beskrivelse</h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>

                    {/* Highlights/Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Funktioner</h4>
                      <ul className="text-sm text-gray-600 space-y-2 grid grid-cols-2 gap-2">
                        {module.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-2">
                            <span className="text-amber-500 mt-1">✓</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits/Outcomes */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Fordele</h4>
                      <ul className="text-sm text-gray-600 space-y-2 grid grid-cols-2 gap-2">
                        {module.outcomes.map((outcome) => (
                          <li key={outcome} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">⭐</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Integrations */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Integrationer</h4>
                      <div className="flex flex-wrap gap-2">
                        {module.integrations.map((integration) => (
                          <div
                            key={integration}
                            className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600"
                          >
                            {integration}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                      <span className={isEnabled ? 'text-emerald-600 text-xs font-medium' : 'text-gray-400 text-xs font-medium'}>
                        {isEnabled ? '✓ Aktiveret' : 'Ikke aktiveret'}
                      </span>
                      <Button
                        size="sm"
                        variant={isEnabled ? 'outline' : 'default'}
                        className={isEnabled ? 'border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-pink-600 hover:bg-pink-700 text-white'}
                        onClick={() => setModule({ moduleId: module.id, enabled: !isEnabled })}
                        disabled={effectiveStatus !== 'Klar' || isUpdating || isLoading}
                      >
                        {isLoading ? 'Indlæser...' : effectiveStatus === 'Klar' ? (isEnabled ? 'Deaktiver' : 'Aktiver') : 'Book demo'}
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
