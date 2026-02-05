import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useSalesLeads, SalesLead } from '@/hooks/useSalesLeads';
import { useCVRLookup } from '@/hooks/useCVRLookup';
import { ArrowLeft, Search, Loader2, Building2 } from 'lucide-react';

const SalesAIAddLeadPage = () => {
  const navigate = useNavigate();
  const { addLead } = useSalesLeads();
  const { lookupCVR, isLoading: cvrLoading } = useCVRLookup();
  
  const [newLead, setNewLead] = useState<Partial<SalesLead>>({});
  const [cvrSearch, setCvrSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCVRLookup = async () => {
    if (!cvrSearch) return;
    
    const result = await lookupCVR(cvrSearch);
    // For sales leads, we accept both active and inactive companies
    // The result might have data even if there's an error (inactive company)
    if (result) {
      setNewLead({
        company_name: result.companyName || '',
        cvr_number: result.cvr,
        address: result.address,
        city: result.city,
        postal_code: result.postalCode,
        contact_phone: result.phone,
        contact_email: result.email,
        industry: result.industry,
        source: 'cvr',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.company_name) return;

    setIsSubmitting(true);
    const created = await addLead(newLead);
    setIsSubmitting(false);

    // Only navigate away if the lead was actually created
    if (created) {
      navigate('/admin/sales-ai');
    }
  };

  return (
    <AdminDashboardLayout activeTab="sales-ai">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sales-ai')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Tilføj nyt lead</h2>
            <p className="text-muted-foreground">Opret et nyt salgslead manuelt eller via CVR-opslag</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              CVR-opslag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={cvrSearch}
                onChange={(e) => setCvrSearch(e.target.value)}
                placeholder="Indtast CVR-nummer (8 cifre)"
                className="max-w-xs"
              />
              <Button onClick={handleCVRLookup} disabled={cvrLoading || !cvrSearch}>
                {cvrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2">Slå op</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Slå automatisk virksomhedsoplysninger op via CVR-registret
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Virksomhedsoplysninger</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Firmanavn *</Label>
                  <Input
                    id="company_name"
                    value={newLead.company_name || ''}
                    onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                    placeholder="Indtast firmanavn"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvr_number">CVR-nummer</Label>
                  <Input
                    id="cvr_number"
                    value={newLead.cvr_number || ''}
                    onChange={(e) => setNewLead({ ...newLead, cvr_number: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Kontaktperson</Label>
                  <Input
                    id="contact_name"
                    value={newLead.contact_name || ''}
                    onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                    placeholder="Navn på kontaktperson"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newLead.contact_email || ''}
                    onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                    placeholder="email@firma.dk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefon</Label>
                  <Input
                    id="contact_phone"
                    value={newLead.contact_phone || ''}
                    onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                    placeholder="12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">By</Label>
                  <Input
                    id="city"
                    value={newLead.city || ''}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    placeholder="København"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="industry">Branche</Label>
                  <Input
                    id="industry"
                    value={newLead.industry || ''}
                    onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                    placeholder="F.eks. Biludlejning, Autoforhandler"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Noter</Label>
                  <Textarea
                    id="notes"
                    value={newLead.notes || ''}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    placeholder="Eventuelle noter om dette lead..."
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/sales-ai')}>
                  Annuller
                </Button>
                <Button type="submit" disabled={!newLead.company_name || isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Tilføj lead
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default SalesAIAddLeadPage;