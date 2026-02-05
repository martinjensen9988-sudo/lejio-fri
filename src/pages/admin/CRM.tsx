import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { AdminCRMPipeline } from '@/components/admin/AdminCRMPipeline';
import { AdminCRMTable } from '@/components/admin/AdminCRMTable';
import { CRMEmailDialog, CRMCallDialog, CRMCallHistoryDialog } from '@/components/admin/CRMCommunicationDialogs';
import { AILeadFinderCard } from '@/components/admin/AILeadFinderCard';
import { CRMDashboardWidget } from '@/components/admin/CRMDashboardWidget';
import { CRMBulkActions } from '@/components/admin/CRMBulkActions';
import { DealTimeline } from '@/components/admin/DealTimeline';
import { CRMAnalytics } from '@/components/admin/CRMAnalytics';
import { TeamCollaboration } from '@/components/admin/TeamCollaboration';
import { useCRM, CRMDeal, CRMTask, CRMActivity, CRM_STAGES, ACTIVITY_TYPES, TASK_PRIORITIES } from '@/hooks/useCRM';
import { useSalesLeads, SalesLead } from '@/hooks/useSalesLeads';
import { useCRMCommunication } from '@/hooks/useCRMCommunication';
import { useLeadDeduplication } from '@/hooks/useLeadDeduplication';
import { useSavedSearches, applyFilters } from '@/hooks/useSavedSearches';
import { useEmailCampaigns } from '@/hooks/useEmailCampaigns';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { calculateLeadScore } from '@/utils/leadScoring';
import { 
  Plus, 
  Kanban, 
  List, 
  TrendingUp, 
  DollarSign, 
  Target, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Phone,
  Mail,
  Calendar,
  FileText,
  Loader2,
  ArrowRight,
  PhoneCall,
  Search,
  Upload,
  Sparkles,
  Trash2,
  Brain,
  Building2
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

const AdminCRMPage = () => {
  const navigate = useNavigate();
  const { 
    deals, 
    activities,
    tasks,
    isLoading,
    fetchDeals,
    addDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    convertLeadToDeal,
    fetchActivities,
    addActivity,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    getStats,
  } = useCRM();
  
  const { leads, fetchLeads, updateLead, deleteLead, isLoading: leadsLoading } = useSalesLeads();

  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [showNewDealDialog, setShowNewDealDialog] = useState(false);
  const [showDealDetailDialog, setShowDealDetailDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewActivityDialog, setShowNewActivityDialog] = useState(false);
  const [showConvertLeadDialog, setShowConvertLeadDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showCallHistoryDialog, setShowCallHistoryDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [communicationDeal, setCommunicationDeal] = useState<CRMDeal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Lead search & filter
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');

  // New features state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);

  const { isCallingInProgress } = useCRMCommunication();

  // Initialize new feature hooks
  const { findDuplicates, mergeLeads } = useLeadDeduplication();
  const { savedSearches, fetchSavedSearches, saveSearch, deleteSearch, getQuickFilter } = useSavedSearches();
  const { campaigns, fetchCampaigns, sendCampaign, getCampaignStats } = useEmailCampaigns();
  const { connectGoogleCalendar, syncDealReminder } = useCalendarIntegration();

  // Form states
  const [newDeal, setNewDeal] = useState<Partial<CRMDeal>>({
    stage: 'new',
    value: 0,
    probability: 10,
  });
  const [newTask, setNewTask] = useState<Partial<CRMTask>>({
    priority: 'medium',
    status: 'pending',
  });
  const [newActivity, setNewActivity] = useState<Partial<CRMActivity>>({
    activity_type: 'call',
  });

  useEffect(() => {
    fetchDeals();
    fetchLeads();
    fetchTasks();
    fetchSavedSearches();
    fetchCampaigns();
  }, [fetchDeals, fetchLeads, fetchTasks, fetchSavedSearches, fetchCampaigns]);

  useEffect(() => {
    if (selectedDeal) {
      fetchActivities(selectedDeal.id);
    }
  }, [selectedDeal, fetchActivities]);

  const stats = getStats();

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCreateDeal = async () => {
    if (!newDeal.title) return;
    setIsSubmitting(true);
    const result = await addDeal(newDeal);
    setIsSubmitting(false);
    if (result) {
      setShowNewDealDialog(false);
      setNewDeal({ stage: 'new', value: 0, probability: 10 });
    }
  };

  // Bulk action handlers
  const handleBulkStatusChange = async (status: string) => {
    setBulkActionLoading(true);
    try {
      const leadIds = Array.from(selectedLeads);
      for (const leadId of leadIds) {
        await updateLead(leadId, { status });
      }
      setSelectedLeads(new Set());
      await fetchLeads();
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      const leadIds = Array.from(selectedLeads);
      for (const leadId of leadIds) {
        await deleteLead(leadId);
      }
      setSelectedLeads(new Set());
      await fetchLeads();
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportLeads = () => {
    const leadIds = Array.from(selectedLeads);
    const leadsToExport = leads.filter(l => leadIds.includes(l.id));
    
    const csv = [
      ['Firmanavn', 'CVR', 'Kontakt', 'Email', 'Telefon', 'Status', 'Kilde'].join(','),
      ...leadsToExport.map(l => [
        l.company_name,
        l.cvr_number || '',
        l.contact_name || '',
        l.contact_email || '',
        l.contact_phone || '',
        l.status,
        l.source,
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lejio-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleUpdateStage = async (dealId: string, stage: string) => {
    await updateDealStage(dealId, stage);
  };

  const handleViewDeal = (deal: CRMDeal) => {
    setSelectedDeal(deal);
    setShowDealDetailDialog(true);
  };

  const handleEditDeal = (deal: CRMDeal) => {
    setNewDeal(deal);
    setShowNewDealDialog(true);
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Er du sikker på at du vil slette denne deal?')) {
      await deleteDeal(dealId);
    }
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;
    setIsSubmitting(true);
    const result = await convertLeadToDeal(selectedLead, {
      value: newDeal.value || 0,
      expected_close_date: newDeal.expected_close_date,
    });
    setIsSubmitting(false);
    if (result) {
      setShowConvertLeadDialog(false);
      setSelectedLead(null);
      setNewDeal({ stage: 'new', value: 0, probability: 10 });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) return;
    setIsSubmitting(true);
    const result = await addTask({
      ...newTask,
      deal_id: selectedDeal?.id,
    });
    setIsSubmitting(false);
    if (result) {
      setShowNewTaskDialog(false);
      setNewTask({ priority: 'medium', status: 'pending' });
      fetchTasks();
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivity.subject) return;
    setIsSubmitting(true);
    const result = await addActivity({
      ...newActivity,
      deal_id: selectedDeal?.id,
    });
    setIsSubmitting(false);
    if (result) {
      setShowNewActivityDialog(false);
      setNewActivity({ activity_type: 'call' });
      if (selectedDeal) {
        fetchActivities(selectedDeal.id);
      }
    }
  };

  const handleCompleteTask = async (task: CRMTask) => {
    await updateTask(task.id, { status: 'completed' });
    fetchTasks();
  };

  const handleCallDeal = (deal: CRMDeal) => {
    setCommunicationDeal(deal);
    setShowCallDialog(true);
  };

  const handleEmailDeal = (deal: CRMDeal) => {
    setCommunicationDeal(deal);
    setShowEmailDialog(true);
  };

  const handleCommunicationSuccess = () => {
    if (selectedDeal) {
      fetchActivities(selectedDeal.id);
    }
  };

  // Filter unconverted leads (not yet linked to a deal)
  const unconvertedLeads = leads.filter(lead => 
    !deals.some(deal => deal.lead_id === lead.id)
  );
  
  // Filtered leads based on search and status
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.company_name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
      lead.cvr_number?.includes(leadSearchTerm);
    
    const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAISearchClick = (query: string, location?: string) => {
    navigate(`/admin/sales-ai/company-search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location || '')}`);
  };

  if (isLoading) {
    return (
      <AdminDashboardLayout activeTab="crm">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab="crm">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-7 h-7 text-primary" />
              Salg & CRM
            </h2>
            <p className="text-muted-foreground">AI-drevet lead-finding, deals og aktiviteter</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/sales-ai/company-search')}>
              <Search className="w-4 h-4 mr-2" />
              Find firmaer
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/sales-ai/car-ad')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Bilannonce AI
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCallHistoryDialog(true)}>
              <PhoneCall className="w-4 h-4 mr-2" />
              Opkaldslog
            </Button>
            <Button onClick={() => {
              setNewDeal({ stage: 'new', value: 0, probability: 10 });
              setShowNewDealDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ny deal
            </Button>
          </div>
        </div>

        {/* New Dashboard Widget - Feature 1 & 2 */}
        <CRMDashboardWidget leads={leads} deals={deals} />

        {/* Analytics Toggle Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={showAnalytics ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button 
            variant={showTimeline ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </Button>
        </div>

        {/* Analytics Section - Feature 10 */}
        {showAnalytics && (
          <CRMAnalytics leads={leads} deals={deals} />
        )}

        {/* Timeline Section - Feature 7 */}
        {showTimeline && (
          <DealTimeline deals={deals} />
        )}

        {/* Bulk Actions - Feature 3 */}
        <CRMBulkActions
          selectedLeads={leads.filter(l => selectedLeads.has(l.id))}
          onStatusChange={handleBulkStatusChange}
          onDelete={handleBulkDelete}
          onExport={handleExportLeads}
          isLoading={bulkActionLoading}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Pipeline værdi</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatValue(stats.totalValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Vægtet værdi</span>
              </div>
              <p className="text-xl font-bold mt-1">{formatValue(stats.weightedValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Åbne deals</span>
              </div>
              <p className="text-xl font-bold mt-1">{stats.openDeals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Vundet</span>
              </div>
              <p className="text-xl font-bold mt-1">{stats.wonDeals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Win rate</span>
              </div>
              <p className="text-xl font-bold mt-1">{stats.winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Ventende opgaver</span>
              </div>
              <p className="text-xl font-bold mt-1">
                {stats.pendingTasks}
                {stats.overdueTasks > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {stats.overdueTasks} forsinket
                  </Badge>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="deals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="ai-finder">AI Lead Finder</TabsTrigger>
            <TabsTrigger value="tasks">Opgaver</TabsTrigger>
          </TabsList>

          <TabsContent value="deals" className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'pipeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('pipeline')}
              >
                <Kanban className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4 mr-2" />
                Tabel
              </Button>
            </div>

            {/* Deals View */}
            {viewMode === 'pipeline' ? (
              <AdminCRMPipeline
                deals={deals}
                onUpdateStage={handleUpdateStage}
                onEditDeal={handleEditDeal}
                onDeleteDeal={handleDeleteDeal}
                onViewDeal={handleViewDeal}
                onCallDeal={handleCallDeal}
                onEmailDeal={handleEmailDeal}
                isCallingInProgress={isCallingInProgress}
              />
            ) : (
              <AdminCRMTable
                deals={deals}
                onUpdateStage={handleUpdateStage}
                onEditDeal={handleEditDeal}
                onDeleteDeal={handleDeleteDeal}
                onViewDeal={handleViewDeal}
              />
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Opgaver</h3>
              <Button size="sm" onClick={() => setShowNewTaskDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ny opgave
              </Button>
            </div>

            <div className="grid gap-4">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Ingen opgaver endnu
                  </CardContent>
                </Card>
              ) : (
                tasks.map(task => {
                  const priorityInfo = TASK_PRIORITIES.find(p => p.id === task.priority);
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                  
                  return (
                    <Card key={task.id} className={isOverdue ? 'border-destructive' : ''}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 mt-0.5"
                              onClick={() => handleCompleteTask(task)}
                              disabled={task.status === 'completed'}
                            >
                              <CheckCircle2 className={`w-5 h-5 ${
                                task.status === 'completed' 
                                  ? 'text-primary' 
                                  : 'text-muted-foreground'
                              }`} />
                            </Button>
                            <div>
                              <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {task.due_date && (
                                  <Badge variant={isOverdue ? 'destructive' : 'outline'} className="text-xs">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(new Date(task.due_date), 'd. MMM', { locale: da })}
                                  </Badge>
                                )}
                                <Badge variant="outline" className={`text-xs ${priorityInfo?.color || ''}`}>
                                  {priorityInfo?.label || task.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                          >
                            Slet
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-lg">Alle Leads</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/sales-ai/import')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                    <Button size="sm" onClick={() => navigate('/admin/sales-ai/add')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tilføj lead
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={leadSearchTerm}
                      onChange={(e) => setLeadSearchTerm(e.target.value)}
                      placeholder="Søg i leads..."
                      className="pl-10"
                    />
                  </div>
                  <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
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
                  <Badge variant="secondary">{filteredLeads.length} leads</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
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
                                Outreach
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowConvertLeadDialog(true);
                                }}
                              >
                                <ArrowRight className="w-4 h-4 mr-1" />
                                Til deal
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
          </TabsContent>

          <TabsContent value="ai-finder" className="space-y-4">
            <AILeadFinderCard 
              existingLeads={leads} 
              onSearchClick={handleAISearchClick}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Deal Dialog */}
      <Dialog open={showNewDealDialog} onOpenChange={setShowNewDealDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{newDeal.id ? 'Rediger deal' : 'Opret ny deal'}</DialogTitle>
            <DialogDescription>
              Udfyld oplysningerne for at oprette en ny deal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={newDeal.title || ''}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                placeholder="F.eks. Fleet-aftale med Firma A/S"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Værdi (DKK)</Label>
                <Input
                  id="value"
                  type="number"
                  value={newDeal.value || 0}
                  onChange={(e) => setNewDeal({ ...newDeal, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stadie</Label>
                <Select 
                  value={newDeal.stage || 'new'} 
                  onValueChange={(value) => setNewDeal({ ...newDeal, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {CRM_STAGES.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Virksomhed</Label>
                <Input
                  id="company_name"
                  value={newDeal.company_name || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, company_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Kontaktperson</Label>
                <Input
                  id="contact_name"
                  value={newDeal.contact_name || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, contact_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newDeal.contact_email || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, contact_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input
                  id="contact_phone"
                  value={newDeal.contact_phone || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Forventet lukning</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={newDeal.expected_close_date || ''}
                onChange={(e) => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={newDeal.description || ''}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDealDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleCreateDeal} disabled={!newDeal.title || isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {newDeal.id ? 'Gem ændringer' : 'Opret deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Lead Dialog */}
      <Dialog open={showConvertLeadDialog} onOpenChange={setShowConvertLeadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konverter lead til deal</DialogTitle>
            <DialogDescription>
              Vælg et lead og angiv dealværdi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vælg lead</Label>
              <Select 
                value={selectedLead?.id || ''} 
                onValueChange={(value) => {
                  const lead = unconvertedLeads.find(l => l.id === value);
                  setSelectedLead(lead || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg et lead" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {unconvertedLeads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLead && (
              <>
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-medium">{selectedLead.company_name}</h4>
                    {selectedLead.contact_name && (
                      <p className="text-sm text-muted-foreground">{selectedLead.contact_name}</p>
                    )}
                    {selectedLead.contact_email && (
                      <p className="text-sm text-muted-foreground">{selectedLead.contact_email}</p>
                    )}
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deal_value">Dealværdi (DKK)</Label>
                    <Input
                      id="deal_value"
                      type="number"
                      value={newDeal.value || 0}
                      onChange={(e) => setNewDeal({ ...newDeal, value: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deal_close_date">Forventet lukning</Label>
                    <Input
                      id="deal_close_date"
                      type="date"
                      value={newDeal.expected_close_date || ''}
                      onChange={(e) => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertLeadDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleConvertLead} disabled={!selectedLead || isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Konverter til deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Dialog */}
      <Dialog open={showDealDetailDialog} onOpenChange={setShowDealDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDeal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedDeal.title}
                  <Badge className={`${CRM_STAGES.find(s => s.id === selectedDeal.stage)?.color || ''} text-white`}>
                    {CRM_STAGES.find(s => s.id === selectedDeal.stage)?.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedDeal.company_name && `${selectedDeal.company_name} • `}
                  Oprettet {format(new Date(selectedDeal.created_at), 'd. MMMM yyyy', { locale: da })}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overblik</TabsTrigger>
                  <TabsTrigger value="activities">Aktiviteter</TabsTrigger>
                  <TabsTrigger value="tasks">Opgaver</TabsTrigger>
                  <TabsTrigger value="collaboration">Team</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Værdi</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatValue(selectedDeal.value || 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Sandsynlighed</p>
                        <p className="text-2xl font-bold">{selectedDeal.probability}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Kontaktoplysninger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedDeal.contact_name && (
                        <p className="text-sm">
                          <strong>Navn:</strong> {selectedDeal.contact_name}
                        </p>
                      )}
                      {selectedDeal.contact_email && (
                        <p className="text-sm">
                          <strong>Email:</strong>{' '}
                          <a href={`mailto:${selectedDeal.contact_email}`} className="text-primary hover:underline">
                            {selectedDeal.contact_email}
                          </a>
                        </p>
                      )}
                      {selectedDeal.contact_phone && (
                        <p className="text-sm">
                          <strong>Telefon:</strong>{' '}
                          <a href={`tel:${selectedDeal.contact_phone}`} className="text-primary hover:underline">
                            {selectedDeal.contact_phone}
                          </a>
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {selectedDeal.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Beskrivelse</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{selectedDeal.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Aktivitetshistorik</h4>
                    <Button size="sm" onClick={() => setShowNewActivityDialog(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ny aktivitet
                    </Button>
                  </div>

                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Ingen aktiviteter registreret
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map(activity => {
                        const typeInfo = ACTIVITY_TYPES.find(t => t.id === activity.activity_type);
                        return (
                          <div key={activity.id} className="flex gap-3 p-3 border rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {typeInfo?.id === 'call' && <Phone className="w-4 h-4 text-primary" />}
                              {typeInfo?.id === 'email' && <Mail className="w-4 h-4 text-primary" />}
                              {typeInfo?.id === 'meeting' && <Calendar className="w-4 h-4 text-primary" />}
                              {typeInfo?.id === 'note' && <FileText className="w-4 h-4 text-primary" />}
                              {!typeInfo && <FileText className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.subject}</p>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(activity.created_at), 'd. MMM yyyy HH:mm', { locale: da })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Relaterede opgaver</h4>
                    <Button size="sm" onClick={() => setShowNewTaskDialog(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ny opgave
                    </Button>
                  </div>

                  {tasks.filter(t => t.deal_id === selectedDeal.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Ingen opgaver for denne deal
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.filter(t => t.deal_id === selectedDeal.id).map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCompleteTask(task)}
                          >
                            <CheckCircle2 className={`w-5 h-5 ${
                              task.status === 'completed' ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </Button>
                          <div className="flex-1">
                            <p className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </p>
                          </div>
                          {task.due_date && (
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(task.due_date), 'd. MMM', { locale: da })}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Team Collaboration - Feature 9 */}
              {selectedDeal && (
                <div className="mt-4">
                  <TeamCollaboration 
                    dealId={selectedDeal.id} 
                    comments={[]} 
                    onAddComment={async () => {}} 
                  />
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => handleEditDeal(selectedDeal)}>
                  Rediger deal
                </Button>
                <Button onClick={() => setShowDealDetailDialog(false)}>
                  Luk
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opret ny opgave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task_title">Titel *</Label>
              <Input
                id="task_title"
                value={newTask.title || ''}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="F.eks. Ring til kunde"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task_due_date">Deadline</Label>
                <Input
                  id="task_due_date"
                  type="datetime-local"
                  value={newTask.due_date?.slice(0, 16) || ''}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_priority">Prioritet</Label>
                <Select 
                  value={newTask.priority || 'medium'} 
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {TASK_PRIORITIES.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task_description">Beskrivelse</Label>
              <Textarea
                id="task_description"
                value={newTask.description || ''}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title || isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opret opgave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Activity Dialog */}
      <Dialog open={showNewActivityDialog} onOpenChange={setShowNewActivityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrer aktivitet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newActivity.activity_type || 'call'} 
                onValueChange={(value) => setNewActivity({ ...newActivity, activity_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {ACTIVITY_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity_subject">Emne *</Label>
              <Input
                id="activity_subject"
                value={newActivity.subject || ''}
                onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                placeholder="F.eks. Opfølgende opkald"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity_outcome">Resultat</Label>
              <Input
                id="activity_outcome"
                value={newActivity.outcome || ''}
                onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                placeholder="F.eks. Interesseret, sender tilbud"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity_description">Noter</Label>
              <Textarea
                id="activity_description"
                value={newActivity.description || ''}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewActivityDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleCreateActivity} disabled={!newActivity.subject || isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <CRMEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        deal={communicationDeal}
        onSuccess={handleCommunicationSuccess}
      />

      {/* Call Dialog */}
      <CRMCallDialog
        open={showCallDialog}
        onOpenChange={setShowCallDialog}
        deal={communicationDeal}
        onSuccess={handleCommunicationSuccess}
      />

      {/* Call History Dialog */}
      <CRMCallHistoryDialog
        open={showCallHistoryDialog}
        onOpenChange={setShowCallHistoryDialog}
      />
    </AdminDashboardLayout>
  );
};

export default AdminCRMPage;
