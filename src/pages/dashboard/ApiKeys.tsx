import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFleetApiKeys, FleetApiKey } from '@/hooks/useFleetApiKeys';
import { Key, Plus, Copy, Trash2, Globe, Activity, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const ApiKeys = () => {
  const { apiKeys, isLoading, generateApiKey, updateApiKey, deleteApiKey } = useFleetApiKeys();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyOrigins, setNewKeyOrigins] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingOrigins, setEditingOrigins] = useState<{ id: string; origins: string } | null>(null);

  const handleCreateKey = async () => {
    setIsCreating(true);
    const origins = newKeyOrigins
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);
    
    const result = await generateApiKey(newKeyName, origins);
    if (result) {
      setIsCreateOpen(false);
      setNewKeyName('');
      setNewKeyOrigins('');
      // Show the new key
      setVisibleKeys(prev => new Set([...prev, result.id]));
    }
    setIsCreating(false);
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

  return (
    <DashboardLayout activeTab="api-keys">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">API-nøgler</h1>
            <p className="text-muted-foreground">
              Administrer API-nøgler til din fleet-hjemmeside integration
            </p>
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
                  Opret en API-nøgle for at integrere dine køretøjer og ydelser på din egen hjemmeside.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Navn (valgfrit)</Label>
                  <Input
                    id="name"
                    placeholder="F.eks. Min hjemmeside"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="origins">Tilladte domæner (valgfrit)</Label>
                  <Input
                    id="origins"
                    placeholder="https://din-side.dk, https://www.din-side.dk"
                    value={newKeyOrigins}
                    onChange={(e) => setNewKeyOrigins(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kommasepareret liste af domæner. Lad feltet stå tomt for at tillade alle domæner.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuller
                </Button>
                <Button onClick={handleCreateKey} disabled={isCreating}>
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
              <code className="text-primary">x-api-key: flk_din_api_nøgle</code>
            </div>
            <p className="text-sm text-muted-foreground">
              API'et returnerer dine køretøjer, værkstedsydelser og virksomhedsinformation i JSON-format.
            </p>
          </CardContent>
        </Card>

        {/* API Keys List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen API-nøgler endnu</h3>
              <p className="text-muted-foreground text-center mb-4">
                Opret din første API-nøgle for at integrere med din hjemmeside
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Opret API-nøgle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">
                          {key.name || 'Unavngivet nøgle'}
                        </span>
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
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
                              placeholder="https://din-side.dk, https://www.din-side.dk"
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
    </DashboardLayout>
  );
};

export default ApiKeys;
