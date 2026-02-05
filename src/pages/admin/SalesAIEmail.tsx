import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useSalesLeads, SalesLead } from '@/hooks/useSalesLeads';
import { ArrowLeft, Sparkles, Copy, Send, Loader2, Building2, Mail, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SalesAIEmailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leads, fetchLeads, generateEmail, saveEmail, sendEmail, updateLead } = useSalesLeads();
  
  const [lead, setLead] = useState<SalesLead | null>(null);
  const [emailType, setEmailType] = useState('introduction');
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (leads.length > 0 && id) {
      const foundLead = leads.find(l => l.id === id);
      setLead(foundLead || null);
    }
  }, [leads, id]);

  const handleGenerateEmail = async () => {
    if (!lead) return;
    
    setIsGenerating(true);
    const result = await generateEmail(lead, emailType);
    if (result) {
      setGeneratedEmail(result);
    }
    setIsGenerating(false);
  };

  const handleCopyEmail = () => {
    if (!generatedEmail) return;
    
    const text = `Emne: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Kopieret',
      description: 'Email er kopieret til udklipsholder',
    });
  };

  const handleSaveAndMarkContacted = async () => {
    if (!lead || !generatedEmail) return;
    
    setIsSaving(true);
    await saveEmail(lead.id, generatedEmail.subject, generatedEmail.body);
    await updateLead(lead.id, { 
      status: 'contacted',
      last_contacted_at: new Date().toISOString()
    });
    setIsSaving(false);
    navigate('/admin/sales-ai');
  };

  const handleSendEmail = async () => {
    if (!lead || !generatedEmail) return;
    
    if (!lead.contact_email) {
      toast({
        title: 'Mangler email',
        description: 'Lead har ingen kontakt-email registreret',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSending(true);
    const result = await sendEmail(
      lead.id,
      lead.contact_email,
      generatedEmail.subject,
      generatedEmail.body,
      lead.contact_name
    );
    setIsSending(false);
    
    if (result) {
      navigate('/admin/sales-ai');
    }
  };

  if (!lead) {
    return (
      <AdminDashboardLayout activeTab="sales-ai">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab="sales-ai">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sales-ai')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Generer salgs-email
            </h2>
            <p className="text-muted-foreground">Brug AI til at skrive en personlig email</p>
          </div>
        </div>
        
        {/* Lead info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {lead.company_name}
            </CardTitle>
            {lead.industry && (
              <CardDescription>{lead.industry}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {lead.contact_name && (
                <div>
                  <p className="text-muted-foreground">Kontakt</p>
                  <p className="font-medium">{lead.contact_name}</p>
                </div>
              )}
              {lead.contact_email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{lead.contact_email}</p>
                </div>
              )}
              {lead.contact_phone && (
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{lead.contact_phone}</p>
                </div>
              )}
              {lead.city && (
                <div>
                  <p className="text-muted-foreground">By</p>
                  <p className="font-medium">{lead.city}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Email generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email-indstillinger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email-type</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introduction">
                    <div>
                      <p className="font-medium">Introduktion</p>
                      <p className="text-xs text-muted-foreground">Første kontakt med virksomheden</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="followup">
                    <div>
                      <p className="font-medium">Opfølgning</p>
                      <p className="text-xs text-muted-foreground">Følg op på tidligere henvendelse</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="offer">
                    <div>
                      <p className="font-medium">Særligt tilbud</p>
                      <p className="text-xs text-muted-foreground">Præsenter konkurrencedygtige priser</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleGenerateEmail} disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genererer email...
                </>
              ) : generatedEmail ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generer ny email
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generer email med AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Generated email */}
        {generatedEmail && (
          <Card>
            <CardHeader>
              <CardTitle>Genereret email</CardTitle>
              <CardDescription>Du kan redigere emailen før du gemmer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Emne</Label>
                <Input
                  id="subject"
                  value={generatedEmail.subject}
                  onChange={(e) => setGeneratedEmail({ ...generatedEmail, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Indhold</Label>
                <Textarea
                  id="body"
                  value={generatedEmail.body}
                  onChange={(e) => setGeneratedEmail({ ...generatedEmail, body: e.target.value })}
                  rows={12}
                  className="font-sans"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <Button variant="outline" onClick={handleCopyEmail}>
                  <Copy className="w-4 h-4 mr-2" />
                  Kopier til udklipsholder
                </Button>
                <Button variant="outline" onClick={handleSaveAndMarkContacted} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Gem som kladde
                </Button>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending || !lead?.contact_email}
                  variant="default"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send email til {lead?.contact_email || 'mangler email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/sales-ai')}>
            Tilbage til oversigt
          </Button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default SalesAIEmailPage;