import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';
import {
  Mail,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Settings,
  Send,
  CheckCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EmailIntegration {
  id: string;
  lessor_id: string;
  type: 'gmail' | 'outlook' | 'custom_smtp';
  email: string;
  display_name: string;
  is_default: boolean;
  is_connected: boolean;
  connection_status: 'connected' | 'disconnected' | 'expired';
  last_tested_at: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

export const EmailIntegrationSettings = ({ userId }: { userId: string }) => {
  const [integrations, setIntegrations] = useState<EmailIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'gmail' | 'outlook' | 'custom_smtp'>('gmail');
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
  });

  useEffect(() => {
    if (userId) {
      fetchIntegrations();
    }
  }, [userId]);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Kunne ikke hente email-integrationer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIntegration = async () => {
    try {
      setTestLoading(true);

      let integrationData: Partial<EmailIntegration> & { password?: string; smtpPassword?: string; [key: string]: any } = {
        lessor_id: userId,
        type: selectedType,
        is_default: integrations.length === 0,
        is_connected: true,
        connection_status: 'connected',
        display_name: formData.displayName || formData.email,
      };

      if (selectedType === 'gmail') {
        integrationData.email = formData.email;
        integrationData.metadata = {
          passwordHash: formData.password, // In production, use OAuth2
          refreshToken: null,
        };
      } else if (selectedType === 'outlook') {
        integrationData.email = formData.email;
        integrationData.metadata = {
          passwordHash: formData.password, // In production, use OAuth2
          refreshToken: null,
        };
      } else {
        integrationData.email = formData.smtpUser;
        integrationData.metadata = {
          smtpHost: formData.smtpHost,
          smtpPort: parseInt(formData.smtpPort),
          smtpUser: formData.smtpUser,
          smtpPassword: formData.smtpPassword,
        };
      }

      // Test the connection
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        'test-email-integration',
        {
          body: {
            type: selectedType,
            email: selectedType === 'custom_smtp' ? formData.smtpUser : formData.email,
            metadata: integrationData.metadata,
          },
        }
      );

      if (testError) throw testError;
      if (!testResult?.success) throw new Error(testResult?.error || 'Connection test failed');

      // Save integration
      const { error: saveError } = await supabase
        .from('lessor_email_integrations')
        .insert([integrationData]);

      if (saveError) throw saveError;

      toast.success(`Email integration tilføjet: ${integrationData.email}`);
      setFormData({
        email: '',
        password: '',
        displayName: '',
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
      });
      setDialogOpen(false);
      await fetchIntegrations();
    } catch (error: unknown) {
      console.error('Error adding integration:', error);
      toast.error(error instanceof Error ? error.message : 'Kunne ikke tilføje email integration');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Unset all defaults
      const { error: unsetError } = await supabase
        .from('lessor_email_integrations')
        .update({ is_default: false })
        .eq('lessor_id', userId);
      
      if (unsetError) throw unsetError;

      // Set new default
      const { error } = await supabase
        .from('lessor_email_integrations')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Standard email angivet');
      await fetchIntegrations();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Kunne ikke angive standard email');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Er du sikker på, at du vil slette denne email integration?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessor_email_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Email integration slettet');
      await fetchIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast.error('Kunne ikke slette email integration');
    }
  };

  const handleTestEmail = async (id: string) => {
    try {
      setTestLoading(true);
      const integration = integrations.find(i => i.id === id);
      if (!integration) return;

      const { error } = await supabase.functions.invoke('send-test-email', {
        body: {
          integrationId: id,
          testEmail: testEmail,
        },
      });

      if (error) throw error;

      toast.success(`Test email sendt til ${testEmail}`);
      setTestEmail('');
    } catch (error: unknown) {
      console.error('Error sending test email:', error);
      toast.error('Kunne ikke sende test email');
    } finally {
      setTestLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'gmail':
        return 'Gmail';
      case 'outlook':
        return 'Outlook';
      case 'custom_smtp':
        return 'Custom SMTP';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/10 text-green-700';
      case 'expired':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'disconnected':
        return 'bg-red-500/10 text-red-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Integrationer
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tilføj og administrer de email-konti, du vil bruge til kommunikation
        </p>
      </div>

      {/* Add Integration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj Email Integration
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tilføj Email Integration</DialogTitle>
            <DialogDescription>
              Vælg email-type og indtast dine loginoplysninger
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gmail">Gmail</TabsTrigger>
              <TabsTrigger value="outlook">Outlook</TabsTrigger>
              <TabsTrigger value="custom_smtp">SMTP</TabsTrigger>
            </TabsList>

            {/* Gmail Tab */}
            <TabsContent value="gmail" className="space-y-4 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Vi bruger app-specifikke adgangskoder. <a href="#" className="underline">Se guide</a>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Gmail Adresse</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="din@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label>App-specifik Adgangskode</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Visningsnavn (valgfrit)</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Mit navn"
                />
              </div>
            </TabsContent>

            {/* Outlook Tab */}
            <TabsContent value="outlook" className="space-y-4 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Brug din Outlook email og adgangskode
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Outlook Adresse</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="din@outlook.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Adgangskode</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Visningsnavn (valgfrit)</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Mit navn"
                />
              </div>
            </TabsContent>

            {/* Custom SMTP Tab */}
            <TabsContent value="custom_smtp" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>SMTP Server</Label>
                <Input
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                    placeholder="587 eller 465"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brugernavn</Label>
                  <Input
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                    placeholder="brugernavn"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adgangskode</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                    placeholder="••••••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleAddIntegration}
              disabled={testLoading}
              className="flex-1"
            >
              {testLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test & Tilføj
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              Annuller
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integrations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length > 0 ? (
        <div className="space-y-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      <h4 className="font-semibold">{integration.display_name}</h4>
                      {integration.is_default && (
                        <Badge className="bg-blue-500/10 text-blue-700">Standard</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{integration.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(integration.connection_status)}>
                        {integration.connection_status === 'connected' && (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        {integration.connection_status === 'connected' ? 'Forbundet' : 'Koblet fra'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(integration.type)}
                      </span>
                      {integration.last_tested_at && (
                        <span className="text-xs text-muted-foreground">
                          Test: {new Date(integration.last_tested_at).toLocaleDateString('da-DK')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Send className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Send Test Email</DialogTitle>
                          <DialogDescription>
                            Fra: {integration.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Test Email Adresse</Label>
                            <Input
                              type="email"
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              placeholder="test@example.com"
                            />
                          </div>
                          <Button
                            onClick={() => handleTestEmail(integration.id)}
                            disabled={testLoading || !testEmail}
                            className="w-full"
                          >
                            {testLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send Test Email
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {!integration.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(integration.id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(integration.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Ingen email integrationer konfigureret</p>
              <p className="text-sm text-muted-foreground mt-1">Tilføj din første email integration for at komme i gang</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
