import { useState, useEffect } from 'react';
import { useLeadStats } from '@/hooks/useLeadStats';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Loader2,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  FileText,
  Trash2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const AdminLeadManagementPage = () => {
  const { stats, isLoading, fetchLeadStats, updateLeadStatus, deleteLead, getLeads } = useLeadStats();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchLeadStats();
    const allLeads = await getLeads();
    setLeads(allLeads);
    
    // Extract unique industries
    const uniqueIndustries = [...new Set(allLeads.map(l => l.industry))].filter(Boolean) as string[];
    setIndustries(uniqueIndustries);
    
    applyFilters(allLeads, searchQuery, filterIndustry, filterStatus);
  };

  const applyFilters = (
    leadsToFilter: any[],
    search: string,
    industry: string,
    status: string
  ) => {
    let result = leadsToFilter;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        l =>
          l.company_name?.toLowerCase().includes(q) ||
          l.contact_email?.toLowerCase().includes(q) ||
          l.contact_phone?.includes(q)
      );
    }

    if (industry) {
      result = result.filter(l => l.industry === industry);
    }

    if (status) {
      result = result.filter(l => l.status === status);
    }

    setFilteredLeads(result);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(leads, query, filterIndustry, filterStatus);
  };

  const handleFilterIndustry = (industry: string) => {
    setFilterIndustry(industry);
    applyFilters(leads, searchQuery, industry, filterStatus);
  };

  const handleFilterStatus = (status: string) => {
    setFilterStatus(status);
    applyFilters(leads, searchQuery, filterIndustry, status);
  };

  const handleRunDiscovery = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('automated-lead-discovery', {
        body: {
          batchSize: 20,
          sendEmails: false,
          enableNotifications: true,
        },
      });

      if (error) throw error;

      toast.success(
        `✅ ${data.results.savedLeads} nye leads fundet og gemt!`,
        {
          description: `Berigede: ${data.results.enriched} stk`,
        }
      );
      
      await loadData();
    } catch (error) {
      console.error('Error running discovery:', error);
      toast.error('Kunne ikke køre discovery');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
    toast.success('Data opdateret');
  };

  const handleDeleteLead = async (leadId: string) => {
    if (confirm('Er du sikker på at du vil slette denne lead?')) {
      const success = await deleteLead(leadId);
      if (success) {
        await loadData();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <AdminDashboardLayout activeTab="sales-ai">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Lead Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleRunDiscovery} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isRunning ? 'Kører...' : 'Kør Discovery'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-3xl font-bold">{stats.totalLeads}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Berigede</p>
                    <p className="text-3xl font-bold">{stats.enrichedLeads}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.totalLeads > 0
                        ? Math.round((stats.enrichedLeads / stats.totalLeads) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                  <Zap className="w-10 h-10 text-yellow-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Med Email</p>
                    <p className="text-3xl font-bold">{stats.leadsWithEmail}</p>
                  </div>
                  <Mail className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emails Sendt</p>
                    <p className="text-3xl font-bold">{stats.emailsSent}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {stats && stats.topIndustries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Industrier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.topIndustries}
                      dataKey="count"
                      nameKey="industry"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                    >
                      {stats.topIndustries.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Byer</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topCities}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Søg efter virksomhed, email eller telefon..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 min-w-[200px]"
              />
              <Select value={filterIndustry} onValueChange={handleFilterIndustry}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer industri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle industrier</SelectItem>
                  {industries.map(ind => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={handleFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle statusser</SelectItem>
                  <SelectItem value="new">Ny</SelectItem>
                  <SelectItem value="contacted">Kontaktet</SelectItem>
                  <SelectItem value="qualified">Kvalificeret</SelectItem>
                  <SelectItem value="converted">Konverteret</SelectItem>
                  <SelectItem value="rejected">Afvist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Virksomhed</TableHead>
                    <TableHead>Industri</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kontaktinfo</TableHead>
                    <TableHead>Oprettet</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Ingen leads matcher søgningen
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.company_name}</TableCell>
                        <TableCell>{lead.industry}</TableCell>
                        <TableCell>{lead.city || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {lead.score}/10
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {lead.contact_email && <Mail className="w-4 h-4 text-green-600" />}
                            {lead.contact_phone && <Phone className="w-4 h-4 text-green-600" />}
                            {lead.website && <Globe className="w-4 h-4 text-green-600" />}
                            {lead.cvr && <FileText className="w-4 h-4 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {lead.created_at
                            ? format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: da })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredLeads.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Viser {filteredLeads.length} af {leads.length} leads
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminLeadManagementPage;
