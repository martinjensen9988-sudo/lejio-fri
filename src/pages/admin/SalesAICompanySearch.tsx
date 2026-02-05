import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, Building2, Mail, Phone, MapPin, Loader2, Plus, Send, Sparkles, Globe, Star, ExternalLink } from 'lucide-react';
import { useCVRSearch, CompanySearchResult } from '@/hooks/useCVRSearch';
import { useWebSearchLeads, AnalyzedLead } from '@/hooks/useWebSearchLeads';
import { useSalesLeads } from '@/hooks/useSalesLeads';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SalesAICompanySearchPage = () => {
  const navigate = useNavigate();
  const { results, isLoading, error, total, searchByIndustry, searchByName, reset } = useCVRSearch();
  const { searchWeb, results: webResults, isSearching: isWebSearching } = useWebSearchLeads();
  const { addLead, generateEmail } = useSalesLeads();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [searchType, setSearchType] = useState<'industry' | 'name'>('industry');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Web search state
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchLocation, setWebSearchLocation] = useState('');
  const [hasWebSearched, setHasWebSearched] = useState(false);
  
  // Email generation state
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [selectedWebLead, setSelectedWebLead] = useState<AnalyzedLead | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [emailType, setEmailType] = useState('introduction');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleSearch = async () => {
    setHasSearched(true);
    if (searchType === 'industry') {
      await searchByIndustry(searchQuery || 'biludlejning', postalCode || undefined);
    } else {
      if (!searchQuery.trim()) {
        toast.error('Indtast venligst et søgeord');
        return;
      }
      await searchByName(searchQuery, postalCode || undefined);
    }
  };

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) {
      toast.error('Indtast venligst et søgeord');
      return;
    }
    setHasWebSearched(true);
    await searchWeb(webSearchQuery, webSearchLocation || undefined);
  };

  const handleAddAsLead = async (company: CompanySearchResult) => {
    try {
      await addLead({
        company_name: company.companyName,
        cvr_number: company.cvr,
        contact_email: company.email || '',
        contact_phone: company.phone || '',
        city: company.city || '',
        industry: company.industry || 'Biludlejning',
        status: 'new',
        source: 'cvr_search',
      });
      toast.success(`${company.companyName} tilføjet som lead`);
    } catch (err) {
      toast.error('Kunne ikke tilføje lead');
    }
  };

  const handleAddWebLeadAsLead = async (lead: AnalyzedLead) => {
    try {
      await addLead({
        company_name: lead.company_name,
        contact_email: '',
        website: lead.website,
        notes: `${lead.description}\n\nAI kontaktforslag: ${lead.contact_suggestion}`,
        industry: 'Biludlejning',
        status: 'new',
        source: 'web_search',
      });
      toast.success(`${lead.company_name} tilføjet som lead`);
    } catch (err) {
      toast.error('Kunne ikke tilføje lead');
    }
  };

  const handleGenerateEmail = async (company: CompanySearchResult) => {
    setSelectedCompany(company);
    setSelectedWebLead(null);
    setGeneratedEmail(null);
    setShowEmailDialog(true);
  };

  const handleGenerateEmailForWebLead = async (lead: AnalyzedLead) => {
    setSelectedWebLead(lead);
    setSelectedCompany(null);
    setGeneratedEmail(null);
    setShowEmailDialog(true);
  };

  const generateEmailForCompany = async () => {
    if (!selectedCompany && !selectedWebLead) return;
    
    setIsGeneratingEmail(true);
    try {
      const leadData = selectedCompany ? {
        id: 'temp',
        company_name: selectedCompany.companyName,
        cvr_number: selectedCompany.cvr,
        contact_email: selectedCompany.email || '',
        contact_phone: selectedCompany.phone || '',
        city: selectedCompany.city || '',
        industry: selectedCompany.industry || 'Biludlejning',
        status: 'new' as const,
        source: 'cvr_search',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } : {
        id: 'temp',
        company_name: selectedWebLead!.company_name,
        contact_email: '',
        website: selectedWebLead!.website,
        notes: selectedWebLead!.description,
        industry: 'Biludlejning',
        status: 'new' as const,
        source: 'web_search',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const result = await generateEmail(leadData, emailType);
      if (result) {
        setGeneratedEmail(result);
      }
    } catch (err) {
      toast.error('Kunne ikke generere email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    if (generatedEmail) {
      const fullEmail = `Emne: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
      navigator.clipboard.writeText(fullEmail);
      toast.success('Email kopieret til udklipsholder');
    }
  };

  const handleAddLeadAndClose = async () => {
    if (selectedCompany) {
      await handleAddAsLead(selectedCompany);
    } else if (selectedWebLead) {
      await handleAddWebLeadAsLead(selectedWebLead);
    }
    setShowEmailDialog(false);
    setSelectedCompany(null);
    setSelectedWebLead(null);
    setGeneratedEmail(null);
  };

  const currentCompanyName = selectedCompany?.companyName || selectedWebLead?.company_name;

  return (
    <AdminDashboardLayout activeTab="sales-ai">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sales-ai')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Find potentielle kunder</h1>
            <p className="text-muted-foreground">Søg i CVR-registeret eller på nettet</p>
          </div>
        </div>

        {/* Tabs for CVR vs Web Search */}
        <Tabs defaultValue="cvr" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cvr" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              CVR Søgning
            </TabsTrigger>
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Web Søgning
            </TabsTrigger>
          </TabsList>

          {/* CVR Search Tab */}
          <TabsContent value="cvr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  CVR Søgning
                </CardTitle>
                <CardDescription>
                  Søg efter biludlejningsfirmaer baseret på branche eller firmanavn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Søgetype</Label>
                    <Select value={searchType} onValueChange={(v) => setSearchType(v as 'industry' | 'name')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="industry">Branche (biludlejning)</SelectItem>
                        <SelectItem value="name">Firmanavn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Søgeord</Label>
                    <Input
                      placeholder={searchType === 'industry' ? 'biludlejning, leasing...' : 'Firmanavn...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Postnummer (valgfrit)</Label>
                    <Input
                      placeholder="F.eks. 2100"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleSearch} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Søger...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Søg
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick search buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Hurtig søgning:</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSearchQuery('biludlejning'); setSearchType('industry'); }}
                  >
                    Biludlejning
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSearchQuery('billeasing'); setSearchType('industry'); }}
                  >
                    Billeasing
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSearchQuery('autoudlejning'); setSearchType('industry'); }}
                  >
                    Autoudlejning
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CVR Error */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* CVR Results */}
            {hasSearched && !isLoading && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      CVR Resultater
                    </span>
                    <Badge variant="secondary">{total} fundet</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Ingen virksomheder fundet. Prøv en anden søgning.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {results.map((company, index) => (
                        <div 
                          key={`${company.cvr}-${index}`}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{company.companyName}</h3>
                                <Badge variant="outline" className="text-xs">CVR: {company.cvr}</Badge>
                              </div>
                              
                              {company.industry && (
                                <p className="text-sm text-muted-foreground">{company.industry}</p>
                              )}
                              
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {(company.address || company.city) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {[company.address, company.postalCode, company.city].filter(Boolean).join(', ')}
                                  </span>
                                )}
                                {company.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {company.phone}
                                  </span>
                                )}
                                {company.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {company.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddAsLead(company)}
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                Tilføj lead
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateEmail(company)}
                              >
                                <Sparkles className="mr-1 h-4 w-4" />
                                Generer email
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Web Search Tab */}
          <TabsContent value="web" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Web Søgning
                </CardTitle>
                <CardDescription>
                  Søg på nettet efter potentielle kunder og leads med AI-analyse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Søgeord</Label>
                    <Input
                      placeholder="biludlejning firma, bilforhandler..."
                      value={webSearchQuery}
                      onChange={(e) => setWebSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lokation (valgfrit)</Label>
                    <Input
                      placeholder="F.eks. København, Aarhus..."
                      value={webSearchLocation}
                      onChange={(e) => setWebSearchLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleWebSearch} disabled={isWebSearching} className="w-full">
                      {isWebSearching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Søger på nettet...
                        </>
                      ) : (
                        <>
                          <Globe className="mr-2 h-4 w-4" />
                          Søg på nettet
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick web search buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Hurtig søgning:</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setWebSearchQuery('biludlejning firma')}
                  >
                    Biludlejning
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setWebSearchQuery('bilforhandler lånebil')}
                  >
                    Bilforhandlere
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setWebSearchQuery('værksted lånebil')}
                  >
                    Værksteder
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setWebSearchQuery('leasing firma bil')}
                  >
                    Leasing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Web Search Results */}
            {hasWebSearched && !isWebSearching && webResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Web Resultater
                    </span>
                    <Badge variant="secondary">{webResults.analyzed_leads.length} leads analyseret</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {webResults.analyzed_leads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Ingen leads fundet. Prøv en anden søgning.</p>
                      {webResults.raw_results.length > 0 && (
                        <p className="text-sm mt-2">({webResults.raw_results.length} rå resultater fundet, men ingen kunne analyseres som leads)</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webResults.analyzed_leads.map((lead, index) => (
                        <div 
                          key={`${lead.website}-${index}`}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{lead.company_name}</h3>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {lead.potential_score}/10
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">{lead.description}</p>
                              
                              <a 
                                href={lead.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {lead.website}
                              </a>
                              
                              <div className="bg-muted/50 rounded p-2 text-sm">
                                <span className="font-medium">AI kontaktforslag:</span> {lead.contact_suggestion}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddWebLeadAsLead(lead)}
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                Tilføj lead
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateEmailForWebLead(lead)}
                              >
                                <Sparkles className="mr-1 h-4 w-4" />
                                Generer email
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Email Generation Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Generer salgsmail
              </DialogTitle>
              <DialogDescription>
                {currentCompanyName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Company Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{currentCompanyName}</span>
                </div>
                {selectedCompany?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{selectedCompany.email}</span>
                  </div>
                )}
                {selectedCompany?.industry && (
                  <p className="text-sm text-muted-foreground">{selectedCompany.industry}</p>
                )}
                {selectedWebLead?.website && (
                  <a 
                    href={selectedWebLead.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {selectedWebLead.website}
                  </a>
                )}
                {selectedWebLead?.description && (
                  <p className="text-sm text-muted-foreground">{selectedWebLead.description}</p>
                )}
              </div>

              {/* Email Type Selection */}
              <div className="space-y-2">
                <Label>Email type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="introduction">Introduktion</SelectItem>
                    <SelectItem value="partnership">Partnerskab</SelectItem>
                    <SelectItem value="fleet_offer">Fleet tilbud</SelectItem>
                    <SelectItem value="follow_up">Opfølgning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateEmailForCompany} 
                disabled={isGeneratingEmail}
                className="w-full"
              >
                {isGeneratingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Genererer email...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generer email
                  </>
                )}
              </Button>

              {/* Generated Email */}
              {generatedEmail && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Emne</Label>
                    <Input 
                      value={generatedEmail.subject}
                      onChange={(e) => setGeneratedEmail({ ...generatedEmail, subject: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Indhold</Label>
                    <Textarea 
                      value={generatedEmail.body}
                      onChange={(e) => setGeneratedEmail({ ...generatedEmail, body: e.target.value })}
                      className="min-h-[200px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopyEmail} className="flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      Kopiér email
                    </Button>
                    <Button onClick={handleAddLeadAndClose} className="flex-1">
                      <Plus className="mr-2 h-4 w-4" />
                      Gem som lead
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default SalesAICompanySearchPage;
