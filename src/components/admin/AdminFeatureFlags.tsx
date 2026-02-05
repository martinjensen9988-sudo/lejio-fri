import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Copy, RotateCcw, Search, ChevronDown, ChevronUp, Clock, Check, X, Download, Upload, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/azure/client';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Feature categories with icons and colors
const FEATURE_CATEGORIES = {
  booking: {
    name: 'Booking & Kalender',
    icon: '📅',
    color: 'from-blue-500 to-blue-600',
    features: [
      'Smart Booking-kalender',
      'Automatisk tilgængelighed',
      'Abonnementsudlejning',
      'Sæsonpriser',
      'Forberedelsestid',
    ]
  },
  pricing: {
    name: 'Prissætning & Gebyrer',
    icon: '💰',
    color: 'from-green-500 to-green-600',
    features: [
      'AI-prissætning',
      'Platformgebyr-betaling',
      'Flere betalingsmetoder',
      'Automatisk abonnementsbetaling',
    ]
  },
  locations: {
    name: 'Lokationer',
    icon: '📍',
    color: 'from-orange-500 to-orange-600',
    features: [
      'Multi-lokation support',
      'Åbningstider pr. lokation',
      'Særlige lukkedage',
      'Lokation på køretøj',
      'Lokationsinfo i kontrakt',
    ]
  },
  contracts: {
    name: 'Kontrakter & Dokumenter',
    icon: '📄',
    color: 'from-purple-500 to-purple-600',
    features: [
      'Automatisk kontraktgenerering',
      'Digital underskrift',
      'PDF-download & Email',
      'Nummerplade-scanning',
    ]
  },
  checkin: {
    name: 'Check-in & Check-out',
    icon: '✅',
    color: 'from-cyan-500 to-cyan-600',
    features: [
      'QR-kode check-in',
      'Dashboard-foto med AI',
      'GPS-lokationsverifikation',
      'Automatisk opgørelse',
    ]
  },
  damage: {
    name: 'Skader & Forsikring',
    icon: '⚠️',
    color: 'from-red-500 to-red-600',
    features: [
      'Skaderapporter med AI',
      'Depositumhåndtering',
      'Selvrisiko-forsikring',
      'Brændstofpolitik',
    ]
  },
  gps: {
    name: 'GPS & Sikkerhed',
    icon: '🛰️',
    color: 'from-indigo-500 to-indigo-600',
    features: [
      'GPS-sikkerhed',
      'Geofencing-alarmer',
      'Kilometerregistrering',
      'Webhook-integration',
    ]
  },
  motorcycle: {
    name: 'Motorcykler',
    icon: '🏍️',
    color: 'from-yellow-500 to-yellow-600',
    features: [
      'MC-kørekort validering',
      'MC-specifik vedligeholdelse',
      'Sæson-tjekliste',
      'MC Check-in guide',
    ]
  },
  service: {
    name: 'Service & Vedligeholdelse',
    icon: '🔧',
    color: 'from-pink-500 to-pink-600',
    features: [
      'Smart Service hos LEJIO',
      'Syns-påmindelser',
      'Dækstyring',
      'Byttebil-funktion',
      'Service-booking',
    ]
  },
  ai: {
    name: 'AI & Automation',
    icon: '🤖',
    color: 'from-violet-500 to-violet-600',
    features: [
      'Auto-Dispatch AI',
      'Dashboard-analyse',
      'Skade-AI',
      'AI-oversættelse',
    ]
  },
  communication: {
    name: 'Kommunikation',
    icon: '💬',
    color: 'from-teal-500 to-teal-600',
    features: [
      'Indbygget beskedsystem',
      'Push-notifikationer',
      'Automatiske emails',
      'Live Chat Support',
      'Ulæste beskeder',
    ]
  },
  customer: {
    name: 'Kundestyring',
    icon: '👥',
    color: 'from-rose-500 to-rose-600',
    features: [
      'Kørekortsverifikation',
      'Lejerhistorik',
      'Lejer-rating',
      'Advarselsregister',
      'Kundesegmenter',
      'Favorit-lejere',
    ]
  },
  corporate: {
    name: 'Erhverv',
    icon: '🏢',
    color: 'from-slate-500 to-slate-600',
    features: [
      'Erhvervskonti',
      'Afdelingsbudgetter',
      'Medarbejder-administration',
      'Månedlig samlet faktura',
      'Flåde-afregning',
      'CVR-opslag',
    ]
  }
};

const FEATURES = Object.values(FEATURE_CATEGORIES).flatMap(cat => cat.features);

const SUBSCRIPTION_TEMPLATES = {
  starter: {
    label: 'Starter',
    color: 'bg-slate-100 text-slate-800',
    features: ['booking', 'contracts', 'checkin', 'payment', 'communication', 'customer']
  },
  pro: {
    label: 'Pro',
    color: 'bg-blue-100 text-blue-800',
    features: ['booking', 'contracts', 'checkin', 'payment', 'communication', 'customer', 'locations', 'gps', 'motorcycle', 'service', 'ai']
  },
  enterprise: {
    label: 'Enterprise',
    color: 'bg-purple-100 text-purple-800',
    features: ['booking', 'contracts', 'checkin', 'payment', 'communication', 'customer', 'locations', 'gps', 'motorcycle', 'service', 'ai', 'corporate']
  }
};

export const AdminFeatureFlags = React.memo(() => {
  const navigate = typeof window !== 'undefined' ? (window.history.back ? () => window.history.back() : () => {}) : () => {};
  const [customLinks, setCustomLinks] = useState({});
  const [saving, setSaving] = useState<{[key: string]: boolean}>({});
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("features");
  const [filterTier, setFilterTier] = useState<'all' | 'starter' | 'pro' | 'enterprise'>('all');
  const [bulkAction, setBulkAction] = useState<'none' | 'copy-tier' | 'reset-tier'>('none');
  const [selectedTier, setSelectedTier] = useState<'starter' | 'pro' | 'enterprise'>('starter');

  useEffect(() => {
    const fetchLinks = async () => {
      interface FeatureLink {
        feature_key: string;
        video?: string;
        image?: string;
        page?: string;
      }
      const { data, error } = await supabase
        .from('feature_links')
        .select('feature_key, video, image, page');
      
      if (!error && data && Array.isArray(data)) {
        const linksObj: Record<string, {video: string; image: string; page: string}> = {};
        (data as FeatureLink[]).forEach(row => {
          linksObj[row.feature_key] = {
            video: row.video || '',
            image: row.image || '',
            page: row.page || ''
          };
        });
        setCustomLinks(linksObj);
      }
    };
    fetchLinks();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, feature_flags, subscription_status, subscription_tier, created_at')
        .order('created_at', { ascending: false });
      if (!error) setCustomers((data || []) as typeof customers);
      setIsLoading(false);
    };
    fetchCustomers();
  }, []);

  const handleGlobalLinkChange = useCallback((featureKey: string, type: 'video' | 'image' | 'page', value: string) => {
    setCustomLinks(prev => ({ ...prev, [featureKey]: { ...prev[featureKey], [type]: value } }));
  }, []);

  const handleSaveGlobalLinks = useCallback(async (featureKey: string) => {
    setSaving(prev => ({ ...prev, [featureKey]: true }));
    const links = customLinks[featureKey] || {};
    const { error } = await supabase
      .from('feature_links')
      .upsert({
        feature_key: featureKey,
        video: links.video || '',
        image: links.image || '',
        page: links.page || ''
      }, { onConflict: 'feature_key' });
    setSaving(prev => ({ ...prev, [featureKey]: false }));
    if (!error) {
      toast({ title: 'Links gemt!', description: '', variant: 'default' });
    } else {
      toast({ title: 'Kunne ikke gemme links', description: '', variant: 'destructive' });
    }
  }, [customLinks]);

  const handleToggle = useCallback(async (customerId: string, featureKey: string, enabled: boolean) => {
    const customer = customers.find(c => c.id === customerId);
    const flags = customer?.feature_flags || {};
    const newFlags = { ...flags, [featureKey]: enabled };
    const { error } = await supabase
      .from('profiles')
      .update({ feature_flags: newFlags })
      .eq('id', customerId);
    if (!error) {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, feature_flags: newFlags } : c));
      toast({ title: 'Feature opdateret', description: '', variant: 'default' });
    } else {
      toast({ title: 'Kunne ikke opdatere feature', description: '', variant: 'destructive' });
    }
  }, [customers]);

  const handleBulkTemplateApply = useCallback(async (customerId: string, templateName: 'starter' | 'pro' | 'enterprise') => {
    const template = SUBSCRIPTION_TEMPLATES[templateName];
    const newFlags: {[key: string]: boolean} = {};
    
    FEATURES.forEach(feature => {
      const featureKey = feature.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
      const categoryKey = Object.keys(FEATURE_CATEGORIES).find(key => 
        FEATURE_CATEGORIES[key as keyof typeof FEATURE_CATEGORIES].features.includes(feature)
      );
      newFlags[featureKey] = categoryKey ? template.features.includes(categoryKey) : false;
    });

    const { error } = await supabase
      .from('profiles')
      .update({ feature_flags: newFlags })
      .eq('id', customerId);

    if (!error) {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, feature_flags: newFlags } : c));
      toast({ title: `Applied ${templateName} template`, description: '', variant: 'default' });
    } else {
      toast({ title: 'Kunne ikke anvende template', description: '', variant: 'destructive' });
    }
  }, []);

  // Memoized filtered customers for performance
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = !search.trim() || 
        (customer.company_name && customer.company_name.toLowerCase().includes(search.toLowerCase())) ||
        (customer.full_name && customer.full_name.toLowerCase().includes(search.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(search.toLowerCase()));
      
      const matchesTier = filterTier === 'all' || customer.subscription_tier === filterTier;
      return matchesSearch && matchesTier;
    });
  }, [customers, search, filterTier]);

  // Memoized feature stats calculation
  const getFeatureStats = useCallback((customer: typeof customers[0]) => {
    const enabledCount = Object.values(customer?.feature_flags || {}).filter(Boolean).length;
    const totalCount = FEATURES.length;
    return { enabled: enabledCount, total: totalCount, percentage: Math.round((enabledCount / totalCount) * 100) };
  }, []);

  if (isLoading) return <div>Indlæser...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="links">Global Links</TabsTrigger>
        </TabsList>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Feature Management</CardTitle>
                <Button variant="outline" size="sm" onClick={navigate}>
                  ← Tilbage
                </Button>
              </div>

              {/* Search & Filters */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Søg kunde (navn, email, firma)"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <select 
                  value={filterTier}
                  onChange={e => setFilterTier(e.target.value as "all" | "starter" | "pro" | "enterprise")}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="all">Alle tiers</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>

                <div className="flex gap-1">
                  <Button size="sm" variant="outline" title="Download som JSON">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" title="Upload fra JSON">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredCustomers.length} kunders features vises
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen kunder fundet
                  </div>
                ) : (
                  filteredCustomers.map(customer => {
                    const stats = getFeatureStats(customer);
                    const isExpanded = expandedCustomer === customer.id;

                    return (
                      <Card key={customer.id} className="border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">
                                {customer.company_name || customer.full_name || customer.email}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {customer.subscription_tier || 'Ingen tier'}
                                </Badge>
                                <span>{stats.enabled}/{stats.total} features ({stats.percentage}%)</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right mr-2">
                                <div className="font-bold text-lg">{stats.percentage}%</div>
                                <div className="text-xs text-muted-foreground">aktivt</div>
                              </div>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t p-4 space-y-4">
                            {/* Quick Actions */}
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs font-semibold mb-2 text-muted-foreground">QUICK ACTIONS</p>
                              <div className="flex gap-2 flex-wrap">
                                {(['starter', 'pro', 'enterprise'] as const).map(tier => (
                                  <Button
                                    key={tier}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBulkTemplateApply(customer.id, tier)}
                                    className="text-xs"
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Apply {SUBSCRIPTION_TEMPLATES[tier].label}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Features by Category */}
                            <div className="space-y-3">
                              {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => {
                                const categoryFeatures = category.features;
                                const enabledInCategory = categoryFeatures.filter(f => {
                                  const fKey = f.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
                                  return customer.feature_flags?.[fKey];
                                }).length;

                                return (
                                  <div key={categoryKey} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">{category.icon}</span>
                                        <span className="font-semibold text-sm">{category.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                          {enabledInCategory}/{categoryFeatures.length}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {categoryFeatures.map(feature => {
                                        const fKey = feature.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
                                        const isEnabled = customer.feature_flags?.[fKey];

                                        return (
                                          <div key={fKey} className="flex items-center gap-2 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <Switch
                                              checked={!!isEnabled}
                                              onCheckedChange={checked => handleToggle(customer.id, fKey, checked)}
                                            />
                                            <label className="text-xs cursor-pointer flex-1">
                                              {feature}
                                            </label>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Feature Links</CardTitle>
              <CardDescription>
                Video, billeder og sider som vises for ALLE brugere når de lykkes med en feature
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) =>
                  category.features.map(feature => {
                    const featureKey = feature.toLowerCase().replace(/[^a-z0-9_]+/gi, '_');
                    const globalLinks = customLinks[featureKey] || {};

                    return (
                      <Card key={featureKey} className="flex flex-col p-3">
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-semibold text-sm leading-tight flex-1">{feature}</span>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="url"
                            placeholder="Video URL"
                            className="w-full px-2 py-1 border rounded text-xs"
                            value={globalLinks.video || ''}
                            onChange={e => handleGlobalLinkChange(featureKey, 'video', e.target.value)}
                          />
                          <input
                            type="url"
                            placeholder="Image URL"
                            className="w-full px-2 py-1 border rounded text-xs"
                            value={globalLinks.image || ''}
                            onChange={e => handleGlobalLinkChange(featureKey, 'image', e.target.value)}
                          />
                          <input
                            type="url"
                            placeholder="Page URL"
                            className="w-full px-2 py-1 border rounded text-xs"
                            value={globalLinks.page || ''}
                            onChange={e => handleGlobalLinkChange(featureKey, 'page', e.target.value)}
                          />

                          <Button 
                            size="sm" 
                            className="w-full text-xs mt-2"
                            disabled={!!saving[featureKey]}
                            onClick={() => handleSaveGlobalLinks(featureKey)}
                          >
                            {saving[featureKey] ? 'Gemmer...' : 'Gem'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
