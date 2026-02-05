import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSalesLeads, SalesLead } from '@/hooks/useSalesLeads';
import { AILeadFinderCard } from './AILeadFinderCard';
import { 
  Plus, 
  Search, 
  Upload, 
  Mail, 
  Building2, 
  Phone, 
  Sparkles,
  Loader2,
  Trash2,
  Brain,
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-green-100 text-green-800',
  not_interested: 'bg-red-100 text-red-800',
  converted: 'bg-purple-100 text-purple-800',
};

const statusLabels: Record<string, string> = {
  new: 'Ny',
  contacted: 'Kontaktet',
  interested: 'Interesseret',
  not_interested: 'Ikke interesseret',
  converted: 'Konverteret',
};

const sourceLabels: Record<string, string> = {
  manual: 'Manuel',
  cvr: 'CVR-opslag',
  cvr_search: 'CVR-søgning',
  facebook: 'Facebook',
  csv: 'CSV-import',
};

export default function AdminSalesAI() {
  const navigate = useNavigate();
  const { 
    leads, 
    isLoading, 
    fetchLeads, 
    updateLead, 
    deleteLead,
  } = useSalesLeads();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cvr_number?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAISearchClick = (query: string, location?: string) => {
    navigate(`/admin/sales-ai/company-search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary" />
            Salgs AI
          </h2>
          <p className="text-muted-foreground">AI-drevet lead-finding og personlig outreach</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/sales-ai/company-search')}>
            <Search className="w-4 h-4 mr-2" />
            Find firmaer
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/sales-ai/car-ad')}>
            <Sparkles className="w-4 h-4 mr-2" />
            Bilannonce AI
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/sales-ai/import')}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => navigate('/admin/sales-ai/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Tilføj lead
          </Button>
        </div>
      </div>

      {/* AI Lead Finder Card */}
      <AILeadFinderCard 
        existingLeads={leads} 
        onSearchClick={handleAISearchClick}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg mb-4">Dine Leads</CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Søg i leads..."
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="new">Nye</SelectItem>
                  <SelectItem value="contacted">Kontaktet</SelectItem>
                  <SelectItem value="interested">Interesseret</SelectItem>
                  <SelectItem value="not_interested">Ikke interesseret</SelectItem>
                  <SelectItem value="converted">Konverteret</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">{filteredLeads.length} leads</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen leads fundet</p>
              <p className="text-sm">Tilføj leads manuelt, via CVR-opslag, eller importer fra fil</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => navigate('/admin/sales-ai/import')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Button>
                <Button onClick={() => navigate('/admin/sales-ai/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tilføj lead
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Virksomhed</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kilde</TableHead>
                  <TableHead>Tilføjet</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.company_name}</p>
                        {lead.cvr_number && (
                          <p className="text-sm text-muted-foreground">CVR: {lead.cvr_number}</p>
                        )}
                        {lead.city && (
                          <p className="text-sm text-muted-foreground">{lead.city}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.contact_name && <p>{lead.contact_name}</p>}
                        {lead.contact_email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {lead.contact_email}
                          </p>
                        )}
                        {lead.contact_phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.contact_phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => updateLead(lead.id, { status: value })}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[lead.status]}>
                            {statusLabels[lead.status]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sourceLabels[lead.source] || lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(lead.created_at), 'd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`/admin/sales-ai/outreach/${lead.id}`)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Start outreach
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/sales-ai/email/${lead.id}`)}
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          Kun email
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLead(lead.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}