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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Send, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';

interface EmailTemplate {
  id: string;
  corporate_account_id: string;
  name: string;
  subject: string;
  body: string;
  recipients: string[];
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_id: string;
  recipient: string;
  subject: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

const CorporateEmailIntegration = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const { corporateAccount, isLoading: dataLoading } = useCorporateFleet();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
  });
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  useEffect(() => {
    if (corporateAccount?.id) {
      fetchTemplates();
      fetchLogs();
    }
  }, [corporateAccount?.id]);

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('corporate_account_id', corporateAccount?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as EmailTemplate[]) || []);
    } catch (err) {
      console.error('Fejl ved hentning af templates:', err);
      toast.error('Kunne ikke hente email-templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await (supabase
        .from('email_logs' as any)
        .select('*') as any)
        .eq('corporate_account_id', corporateAccount?.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Fejl ved hentning af logs:', err);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.body || !corporateAccount?.id) {
      toast.error('Udfyld alle felter');
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: formData.name,
            subject: formData.subject,
            body: formData.body,
            recipients: selectedRecipients,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template opdateret');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            corporate_account_id: corporateAccount.id,
            name: formData.name,
            subject: formData.subject,
            body: formData.body,
            recipients: selectedRecipients,
            status: 'draft',
          });

        if (error) throw error;
        toast.success('Template oprettet');
      }

      setIsOpen(false);
      setFormData({ name: '', subject: '', body: '' });
      setSelectedRecipients([]);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      console.error('Fejl ved gemning af template:', err);
      toast.error('Kunne ikke gemme template');
    }
  };

  const handleSendEmail = async (templateId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-corporate-email', {
        body: { templateId, accountId: corporateAccount?.id },
      });

      if (error) throw error;
      toast.success('Email sendt!');
      fetchLogs();
    } catch (err) {
      console.error('Fejl ved afsendelse:', err);
      toast.error('Kunne ikke sende email');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Er du sikker?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Template slettet');
      fetchTemplates();
    } catch (err) {
      toast.error('Kunne ikke slette template');
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const recipientOptions = [
    { value: 'all_employees', label: 'Alle medarbejdere' },
    { value: 'department_managers', label: 'Afdelingsledere' },
    { value: 'admins', label: 'Administratorer' },
    { value: 'finance_team', label: 'Finans-team' },
  ];

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Email Integration</h1>
            <p className="text-muted-foreground">Administrer email-templates og kampagner</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTemplate(null);
                setFormData({ name: '', subject: '', body: '' });
                setSelectedRecipients([]);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Ny template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Rediger template' : 'Ny email-template'}</DialogTitle>
                <DialogDescription>
                  Opret eller rediger email-skabeloner til dine kampagner
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Templatenavln</Label>
                  <Input
                    id="template-name"
                    placeholder="f.eks. Månedlig rapport"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="template-subject">Emne</Label>
                  <Input
                    id="template-subject"
                    placeholder="Email-emne"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="template-body">Email-indhold</Label>
                  <Textarea
                    id="template-body"
                    placeholder="Skriv email-indhold her..."
                    rows={8}
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Brug {"{employee_name}"} for medarbejdernavn, {"{company_name}"} for virksomhedsnavn
                  </p>
                </div>

                <div>
                  <Label>Modtagere</Label>
                  <div className="space-y-2 mt-3">
                    {recipientOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={selectedRecipients.includes(option.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients([...selectedRecipients, option.value]);
                            } else {
                              setSelectedRecipients(selectedRecipients.filter((r) => r !== option.value));
                            }
                          }}
                        />
                        <Label htmlFor={option.value} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveTemplate} className="w-full">
                  {editingTemplate ? 'Gem ændringer' : 'Opret template'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Templates</h2>
            {isLoadingTemplates ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-primary" />
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription>{template.subject}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={template.status === 'active' ? 'default' : 'outline'}>
                          {template.status === 'draft' ? 'Kladde' : 'Aktiv'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSendEmail(template.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(template);
                            setFormData({
                              name: template.name,
                              subject: template.subject,
                              body: template.body,
                            });
                            setSelectedRecipients(template.recipients);
                            setIsOpen(true);
                          }}
                        >
                          Rediger
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
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
            <h2 className="text-xl font-semibold">Seneste aktivitet</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start gap-2">
                    {log.status === 'sent' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    ) : log.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-yellow-500 mt-0.5 animate-spin" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.recipient}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.subject}</p>
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

export default CorporateEmailIntegration;
