import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCorporateFleet } from '@/hooks/useCorporateFleet';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Copy, Check, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';

interface ApiKey {
  id: string;
  corporate_account_id: string;
  name: string;
  key: string;
  secret: string;
  scopes: string[];
  is_active: boolean;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
}

interface ApiLog {
  id: string;
  api_key_id: string;
  method: string;
  endpoint: string;
  status: number;
  response_time: number;
  created_at: string;
}

const CorporateApiIntegration = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const { corporateAccount, isLoading: dataLoading } = useCorporateFleet();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    scopes: [] as string[],
    expiryDays: '90',
  });

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  useEffect(() => {
    if (corporateAccount?.id) {
      fetchApiKeys();
      fetchApiLogs();
    }
  }, [corporateAccount?.id]);

  const fetchApiKeys = async () => {
    try {
      setIsLoadingKeys(true);
      const { data, error } = await (supabase
        .from('api_logs' as any) as any)
        .select('*')
        .eq('corporate_account_id', corporateAccount?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err) {
      console.error('Fejl ved hentning af API-nøgler:', err);
      toast.error('Kunne ikke hente API-nøgler');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const fetchApiLogs = async () => {
    try {
      const { data, error } = await (supabase
        .from('api_keys' as any) as any)
        .select('*')
        .eq('corporate_account_id', corporateAccount?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiLogs(data || []);
    } catch (err) {
      console.error('Fejl ved hentning af logs:', err);
    }
  };

  const generateApiKey = async () => {
    if (!formData.name || formData.scopes.length === 0 || !corporateAccount?.id) {
      toast.error('Udfyld alle felter');
      return;
    }

    try {
      const key = 'lejio_' + Math.random().toString(36).substring(2, 15);
      const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiryDays));

      const { error } = await supabase
        .from('api_keys')
        .insert({
          corporate_account_id: corporateAccount.id,
          name: formData.name,
          key,
          secret,
          scopes: formData.scopes,
          is_active: true,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;
      toast.success('API-nøgle oprettet');
      
      setIsOpen(false);
      setFormData({ name: '', scopes: [], expiryDays: '90' });
      fetchApiKeys();
    } catch (err) {
      console.error('Fejl ved oprettelse:', err);
      toast.error('Kunne ikke oprette API-nøgle');
    }
  };

  const handleDeactivateKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;
      toast.success('API-nøgle deaktiveret');
      fetchApiKeys();
    } catch (err) {
      toast.error('Kunne ikke deaktivere API-nøgle');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Slet API-nøgle?')) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
      toast.success('API-nøgle slettet');
      fetchApiKeys();
    } catch (err) {
      toast.error('Kunne ikke slette API-nøgle');
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const scopeOptions = [
    { value: 'employees.read', label: 'Læs medarbejdere' },
    { value: 'employees.write', label: 'Rediger medarbejdere' },
    { value: 'budget.read', label: 'Læs budget' },
    { value: 'budget.write', label: 'Rediger budget' },
    { value: 'reports.read', label: 'Læs rapporter' },
    { value: 'bookings.read', label: 'Læs bookinger' },
    { value: 'bookings.write', label: 'Opret bookinger' },
  ];

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">API Integration</h1>
            <p className="text-muted-foreground">Administrer API-nøgler og integrationer</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ny API-nøgle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generer ny API-nøgle</DialogTitle>
                <DialogDescription>
                  Opret en ny nøgle til din integration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="key-name">Navn</Label>
                  <Input
                    id="key-name"
                    placeholder="f.eks. Webhook integration"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Rettigheder (Scopes)</Label>
                  <div className="space-y-2 mt-3">
                    {scopeOptions.map((scope) => (
                      <div key={scope.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={scope.value}
                          checked={formData.scopes.includes(scope.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                scopes: [...formData.scopes, scope.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                scopes: formData.scopes.filter((s) => s !== scope.value),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={scope.value} className="cursor-pointer">
                          {scope.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expiry">Udløb (dage)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    value={formData.expiryDays}
                    onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                  />
                </div>

                <Button onClick={generateApiKey} className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Generer nøgle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">API-nøgler</h2>
            {isLoadingKeys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <Card key={key.id} className={key.is_active ? '' : 'opacity-50'}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {key.name}
                            {key.is_active ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aktiv
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Inaktiv</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Oprettet {new Date(key.created_at).toLocaleDateString('da-DK')}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs">API-nøgle</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-muted p-2 rounded text-sm font-mono overflow-x-auto">
                            {key.key}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(key.key, key.id)}
                          >
                            {copiedKey === key.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Rettigheder</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {key.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateKey(key.id)}
                          >
                            Deaktiver
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Seneste requests</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {apiLogs.slice(0, 15).map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start gap-2">
                    {log.status === 200 ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : log.status >= 400 ? (
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    ) : (
                      <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {log.method} {log.endpoint}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.status} · {log.response_time}ms
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString('da-DK')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default CorporateApiIntegration;
