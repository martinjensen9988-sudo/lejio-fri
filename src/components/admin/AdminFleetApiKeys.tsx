import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Plus, Copy, Trash2, Globe, Activity, Eye, EyeOff, ExternalLink, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface FleetApiKey {
  id: string;
  fleet_owner_id: string;
  api_key: string;
  name: string | null;
  allowed_origins: string[] | null;
  is_active: boolean;
  requests_count: number;
  last_used_at: string | null;
  created_at: string;
  fleet_owner?: {
    email: string;
    company_name: string | null;
  };
}

interface FleetOwner {
  id: string;
  email: string;
  company_name: string | null;
}

export const AdminFleetApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<FleetApiKey[]>([]);
  const [fleetOwners, setFleetOwners] = useState<FleetOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyOrigins, setNewKeyOrigins] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingOrigins, setEditingOrigins] = useState<{ id: string; origins: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all API keys with owner info
      const { data: keysData, error: keysError } = await supabase
        .from('fleet_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (keysError) throw keysError;

      // Fetch owner profiles for each key
      const ownerIds = [...new Set(keysData?.map(k => k.fleet_owner_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, company_name')
        .in('id', ownerIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const keysWithOwners = (keysData || []).map(key => ({
        ...key,
        fleet_owner: profilesMap.get(key.fleet_owner_id) || null,
      }));

      setApiKeys(keysWithOwners);

      // Fetch all fleet owners (profiles with vehicles)
      const { data: ownersData } = await supabase
        .from('profiles')
        .select('id, email, company_name')
        .order('email');

      setFleetOwners(ownersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente API-nøgler',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!selectedOwnerId) {
      toast({
        title: 'Fejl',
        description: 'Vælg en fleet-ejer',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate API key using database function
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_fleet_api_key');

      if (keyError) throw keyError;

      const origins = newKeyOrigins
        .split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0);

      // Insert the new API key record
      const { data, error } = await supabase
        .from('fleet_api_keys')
        .insert({
          fleet_owner_id: selectedOwnerId,
          api_key: keyData as string,
          name: newKeyName || null,
          allowed_origins: origins.length > 0 ? origins : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner info to the new key
      const owner = fleetOwners.find(o => o.id === selectedOwnerId);
      const newKey = { ...data, fleet_owner: owner };

      setApiKeys(prev => [newKey, ...prev]);
      setIsCreateOpen(false);
      setSelectedOwnerId('');
      setNewKeyName('');
      setNewKeyOrigins('');
      setVisibleKeys(prev => new Set([...prev, data.id]));

      toast({
        title: 'API-nøgle oprettet',
        description: 'Den nye API-nøgle er klar til brug',
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette API-nøgle',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateApiKey = async (id: string, updates: { name?: string; allowed_origins?: string[]; is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from('fleet_api_keys')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setApiKeys(prev => prev.map(key => 
        key.id === id ? { ...key, ...updates } : key
      ));

      toast({
        title: 'Opdateret',
        description: 'API-nøgle er blevet opdateret',
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere API-nøgle',
        variant: 'destructive',
      });
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fleet_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiKeys(prev => prev.filter(key => key.id !== id));

      toast({
        title: 'Slettet',
        description: 'API-nøgle er blevet slettet',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette API-nøgle',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Kopieret',
      description: 'API-nøgle kopieret til udklipsholder',
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleUpdateOrigins = async (key: FleetApiKey) => {
    if (!editingOrigins) return;
    
    const origins = editingOrigins.origins
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);
    
    await updateApiKey(key.id, { allowed_origins: origins.length > 0 ? origins : null });
    setEditingOrigins(null);
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + '••••••••••••••••';
  };

  const filteredKeys = apiKeys.filter(key => {
    const searchLower = searchTerm.toLowerCase();
    return (
      key.name?.toLowerCase().includes(searchLower) ||
      key.api_key.toLowerCase().includes(searchLower) ||
      key.fleet_owner?.email?.toLowerCase().includes(searchLower) ||
      key.fleet_owner?.company_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg på navn, nøgle eller ejer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Opret API-nøgle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret ny API-nøgle</DialogTitle>
              <DialogDescription>
                Opret en API-nøgle for en fleet-ejer til integration med deres hjemmeside.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Fleet-ejer *</Label>
                <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg fleet-ejer" />
                  </SelectTrigger>
                  <SelectContent>
                    {fleetOwners.map(owner => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.company_name || owner.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Navn (valgfrit)</Label>
                <Input
                  id="name"
                  placeholder="F.eks. Primær hjemmeside"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="origins">Tilladte domæner (valgfrit)</Label>
                <Input
                  id="origins"
                  placeholder="https://example.dk, https://www.example.dk"
                  value={newKeyOrigins}
                  onChange={(e) => setNewKeyOrigins(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Kommasepareret liste. Lad feltet stå tomt for at tillade alle domæner.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuller
              </Button>
              <Button onClick={handleCreateKey} disabled={isCreating || !selectedOwnerId}>
                {isCreating ? 'Opretter...' : 'Opret nøgle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Documentation Card */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            API Dokumentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground mb-2">Endpoint:</p>
            <code className="text-primary">GET https://aqzggwewjttbkaqnbmrb.supabase.co/functions/v1/fleet-site</code>
            <p className="text-muted-foreground mt-4 mb-2">Header:</p>
            <code className="text-primary">x-api-key: flk_xxx</code>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
                <p className="text-sm text-muted-foreground">API-nøgler i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Aktive nøgler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-sky-500" />
              <div>
                <p className="text-2xl font-bold">
                  {apiKeys.reduce((sum, k) => sum + (k.requests_count || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Totale requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Ingen resultater' : 'Ingen API-nøgler endnu'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Prøv at ændre din søgning' : 'Opret den første API-nøgle for en fleet-ejer'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">
                        {key.name || 'Unavngivet nøgle'}
                      </span>
                      <Badge variant={key.is_active ? 'default' : 'secondary'}>
                        {key.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    
                    {/* Fleet owner info */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ejer:</span>
                      <span className="font-medium">
                        {key.fleet_owner?.company_name || key.fleet_owner?.email || 'Ukendt'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                        {visibleKeys.has(key.id) ? key.api_key : maskApiKey(key.api_key)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(key.api_key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{key.requests_count || 0} requests</span>
                      </div>
                      {key.last_used_at && (
                        <span>
                          Sidst brugt: {format(new Date(key.last_used_at), 'PPp', { locale: da })}
                        </span>
                      )}
                      <span>
                        Oprettet: {format(new Date(key.created_at), 'PP', { locale: da })}
                      </span>
                    </div>
                    
                    {/* Allowed Origins */}
                    <div className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                      {editingOrigins?.id === key.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingOrigins.origins}
                            onChange={(e) => setEditingOrigins({ id: key.id, origins: e.target.value })}
                            placeholder="https://example.dk, https://www.example.dk"
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => handleUpdateOrigins(key)}>
                            Gem
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingOrigins(null)}>
                            Annuller
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {key.allowed_origins?.length 
                              ? key.allowed_origins.join(', ')
                              : 'Alle domæner tilladt'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOrigins({ 
                              id: key.id, 
                              origins: key.allowed_origins?.join(', ') || '' 
                            })}
                          >
                            Rediger
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${key.id}`} className="text-sm">
                        Aktiv
                      </Label>
                      <Switch
                        id={`active-${key.id}`}
                        checked={key.is_active}
                        onCheckedChange={(checked) => updateApiKey(key.id, { is_active: checked })}
                      />
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slet API-nøgle?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Dette vil permanent slette API-nøglen. Alle integrationer der bruger denne nøgle vil stoppe med at virke.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuller</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApiKey(key.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Slet
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFleetApiKeys;
