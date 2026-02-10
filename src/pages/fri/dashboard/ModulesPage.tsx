import React, { useMemo, useState } from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { workshopModules } from '@/data/workshopModules';
import { WORKSHOP_TIERS, getAllTiers, getMinimumTierForModule } from '@/data/workshopTiers';
import { useFriModules } from '@/hooks/useFriModules';
import { useFriSettings } from '@/hooks/useFriSettings';
import { useAuth } from '@/hooks/useAuth';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

export function FriModulesPage() {
  const { user } = useAuth();
  const { account } = useFriSettings(user?.id || null);
  const { modules, isLoading, error, setModule, isUpdating } = useFriModules();
  const [expandedModule, setExpandedModule] = useState<string | null>('garageplan');

  // Get user's current subscription tier (default to 'basic')
  const userTier = (account?.subscription_tier || 'basic') as 'basic' | 'professional' | 'premium';
  const userTierInfo = WORKSHOP_TIERS[userTier];

  const enabledModuleIds = useMemo(() => {
    return new Set(modules.filter((module) => module.status === 'active').map((module) => module.module_id));
  }, [modules]);

  const stats = useMemo(() => {
    const enabledCount = workshopModules.filter((module) => enabledModuleIds.has(module.id)).length;
    const readyCount = workshopModules.filter((module) => module.status === 'Klar').length;
    const availableCount = workshopModules.filter((module) => {
      const minTier = getMinimumTierForModule(module.id);
      if (!minTier) return true;
      const tiers = ['basic', 'professional', 'premium'];
      return tiers.indexOf(userTier) >= tiers.indexOf(minTier);
    }).length;
    return { enabledCount, readyCount, availableCount };
  }, [enabledModuleIds, userTier]);

  return (
    <FriDashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Garage Moduler</h1>
          <p className="text-gray-500 mt-2">
            Aktiver de moduler dit værksted har brug for – og udvid når I er klar. Se alle features, benefits og integrationer.
          </p>
        </div>

        {/* Current Plan Badge */}
        {userTierInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Din nuværende plan</p>
                <p className="text-lg font-bold text-blue-900">{userTierInfo.name}</p>
                <p className="text-sm text-blue-700 mt-1">{userTierInfo.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">{userTierInfo.priceMonthly} kr</p>
                <p className="text-xs text-blue-600">/måned</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
            {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Nuværende tier</p>
            <p className="text-2xl font-bold text-brown-900 mt-2 capitalize">{userTier}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Aktive moduler</p>
            <p className="text-2xl font-bold text-brown-900 mt-2">{stats.enabledCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Tilgængelig</p>
            <p className="text-2xl font-bold text-brown-900 mt-2">{stats.availableCount}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total moduler</p>
            <p className="text-2xl font-bold text-brown-900 mt-2">{workshopModules.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {workshopModules.map((module) => {
            const minTierForModule = getMinimumTierForModule(module.id);
            const isAvailable = !minTierForModule || ['basic', 'professional', 'premium'].indexOf(userTier) >= ['basic', 'professional', 'premium'].indexOf(minTierForModule);
            const isEnabled = enabledModuleIds.has(module.id);
            const isExpanded = expandedModule === module.id;
            const isGarageDeal = module.id === 'garadeal' || module.name === 'GarageDeal' || module.tag === 'Bilsalg';
            const effectiveStatus = isGarageDeal ? 'Klar' : module.status;
            
            return (
              <Card
                key={module.id}
                className={`bg-white border shadow-sm text-brown-900 overflow-hidden transition-opacity ${
                  isAvailable ? 'border-gray-100' : 'border-gray-200 opacity-75'
                }`}
              >
                <div
                  onClick={() => isAvailable && setExpandedModule(isExpanded ? null : module.id)}
                  className={isAvailable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : 'cursor-not-allowed'}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-brown-900">{module.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {effectiveStatus}
                          </Badge>
                          {minTierForModule && (
                            <Badge variant={isAvailable ? 'secondary' : 'outline'} className="text-xs capitalize">
                              {minTierForModule} plan
                            </Badge>
                          )}
                          {!isAvailable && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              <Lock className="w-3 h-3 mr-1" />
                              Låst
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-gray-500 mt-1">{module.tag}</CardDescription>
                      </div>
                      {isAvailable && (
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </div>

                {isExpanded && isAvailable && (
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

                {!isAvailable && (
                  <CardContent className="py-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-orange-700 font-medium mb-2">
                        Denne modul kræver {minTierForModule} eller højere plan
                      </p>
                      <p className="text-xs text-orange-600 mb-3">
                        Opgrader din subscription for at få adgang til alle moduler
                      </p>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        Opgrader til {(minTierForModule === 'professional' || minTierForModule === 'premium') ? minTierForModule : 'Pro'} Plan
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
