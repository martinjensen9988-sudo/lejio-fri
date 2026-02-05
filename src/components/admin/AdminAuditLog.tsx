import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Search, Loader2, Shield, Clock, User, FileText, 
  Car, Calendar, Receipt, RefreshCw, Eye, Trash2,
  Edit, Plus, ArrowLeftRight, CheckCircle, XCircle, Send,
  Download, FileSpreadsheet, FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_identifier: string | null;
  old_values: unknown;
  new_values: unknown;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_profile?: {
    full_name: string | null;
    email: string;
  };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  update: <Edit className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  delete: <Trash2 className="w-4 h-4 text-destructive" />,
  view: <Eye className="w-4 h-4 text-muted-foreground" />,
  swap: <ArrowLeftRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
  approve: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  reject: <XCircle className="w-4 h-4 text-destructive" />,
  send: <Send className="w-4 h-4 text-primary" />,
  login: <User className="w-4 h-4 text-muted-foreground" />,
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  profile: <User className="w-4 h-4" />,
  booking: <Calendar className="w-4 h-4" />,
  vehicle: <Car className="w-4 h-4" />,
  invoice: <Receipt className="w-4 h-4" />,
  vehicle_swap: <RefreshCw className="w-4 h-4" />,
  contract: <FileText className="w-4 h-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Oprettet',
  update: 'Opdateret',
  delete: 'Slettet',
  view: 'Set',
  swap: 'Byttet',
  approve: 'Godkendt',
  reject: 'Afvist',
  send: 'Sendt',
  login: 'Login',
};

const ENTITY_LABELS: Record<string, string> = {
  profile: 'Bruger',
  booking: 'Booking',
  vehicle: 'Bil',
  invoice: 'Faktura',
  vehicle_swap: 'Bilbytte',
  contract: 'Kontrakt',
  warning: 'Advarsel',
  message: 'Besked',
};

export const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const loadLogs = async (reset = false) => {
    setIsLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (searchQuery) {
        query = query.or(`description.ilike.%${searchQuery}%,entity_identifier.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch admin profiles for each log entry
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', log.admin_user_id)
            .single();
          
          return {
            ...log,
            admin_profile: profileData || undefined,
          };
        })
      );

      if (reset) {
        setLogs(logsWithProfiles);
        setPage(0);
      } else {
        setLogs(prev => [...prev, ...logsWithProfiles]);
      }

      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Kunne ikke hente audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(true);
  }, [actionFilter, entityFilter, loadLogs]);

  const handleSearch = () => {
    loadLogs(true);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 0) {
      loadLogs();
    }
  }, [page, loadLogs]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Lige nu';
    if (diffMins < 60) return `${diffMins} min siden`;
    if (diffHours < 24) return `${diffHours} timer siden`;
    if (diffDays < 7) return `${diffDays} dage siden`;
    
    return format(date, 'dd/MM/yyyy HH:mm', { locale: da });
  };

  const renderJsonValues = (values: unknown, title: string) => {
    if (!values || (typeof values === 'object' && Object.keys(values as object).length === 0)) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(values, null, 2)}
        </pre>
      </div>
    );
  };

  // Fetch all logs for export (bypasses pagination)
  const fetchAllLogsForExport = async (): Promise<AuditLogEntry[]> => {
    let allLogs: AuditLogEntry[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMoreData = true;

    while (hasMoreData) {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (searchQuery) {
        query = query.or(`description.ilike.%${searchQuery}%,entity_identifier.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch admin profiles
        const logsWithProfiles = await Promise.all(
          data.map(async (log) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', log.admin_user_id)
              .single();
            return { ...log, admin_profile: profileData || undefined };
          })
        );
        allLogs = [...allLogs, ...logsWithProfiles];
        offset += batchSize;
        hasMoreData = data.length === batchSize;
      } else {
        hasMoreData = false;
      }
    }

    return allLogs;
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const exportLogs = await fetchAllLogsForExport();
      
      if (exportLogs.length === 0) {
        toast.error('Ingen data at eksportere');
        return;
      }

      const headers = [
        'Tidspunkt',
        'Admin',
        'Admin Email',
        'Handling',
        'Type',
        'Entity ID',
        'Identifier',
        'Beskrivelse',
        'Gamle værdier',
        'Nye værdier',
        'User Agent'
      ];

      const rows = exportLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.admin_profile?.full_name || '',
        log.admin_profile?.email || '',
        ACTION_LABELS[log.action_type] || log.action_type,
        ENTITY_LABELS[log.entity_type] || log.entity_type,
        log.entity_id || '',
        log.entity_identifier || '',
        log.description,
        log.old_values ? JSON.stringify(log.old_values) : '',
        log.new_values ? JSON.stringify(log.new_values) : '',
        log.user_agent || ''
      ]);

      // Escape CSV values
      const escapeCsvValue = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      // Add BOM for Excel UTF-8 compatibility
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Eksporteret ${exportLogs.length} log entries til CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunne ikke eksportere audit log');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const exportLogs = await fetchAllLogsForExport();
      
      if (exportLogs.length === 0) {
        toast.error('Ingen data at eksportere');
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Audit Log Rapport</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 10px; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 12px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f5f5f5; padding: 10px; border-radius: 4px; }
            .meta div { font-size: 11px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #333; color: white; padding: 8px 4px; text-align: left; font-size: 9px; }
            td { padding: 6px 4px; border-bottom: 1px solid #ddd; font-size: 9px; vertical-align: top; }
            tr:nth-child(even) { background: #f9f9f9; }
            .action-create { color: #059669; }
            .action-update { color: #0284c7; }
            .action-delete { color: #dc2626; }
            .action-swap { color: #d97706; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
            .json-preview { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; font-size: 8px; color: #666; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛡️ Audit Log Rapport</h1>
            <p>Compliance-rapport over alle administrative handlinger</p>
          </div>
          <div class="meta">
            <div><strong>Genereret:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: da })}</div>
            <div><strong>Antal entries:</strong> ${exportLogs.length}</div>
            <div><strong>Filter:</strong> ${actionFilter !== 'all' ? ACTION_LABELS[actionFilter] : 'Alle handlinger'} | ${entityFilter !== 'all' ? ENTITY_LABELS[entityFilter] : 'Alle typer'}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 12%">Tidspunkt</th>
                <th style="width: 15%">Admin</th>
                <th style="width: 8%">Handling</th>
                <th style="width: 8%">Type</th>
                <th style="width: 12%">Identifier</th>
                <th style="width: 25%">Beskrivelse</th>
                <th style="width: 10%">Gamle værdier</th>
                <th style="width: 10%">Nye værdier</th>
              </tr>
            </thead>
            <tbody>
              ${exportLogs.map(log => `
                <tr>
                  <td>${format(new Date(log.created_at), 'dd/MM/yy HH:mm')}</td>
                  <td>${log.admin_profile?.full_name || log.admin_profile?.email || 'Ukendt'}</td>
                  <td class="action-${log.action_type}">${ACTION_LABELS[log.action_type] || log.action_type}</td>
                  <td>${ENTITY_LABELS[log.entity_type] || log.entity_type}</td>
                  <td>${log.entity_identifier || '-'}</td>
                  <td>${log.description}</td>
                  <td class="json-preview">${log.old_values ? JSON.stringify(log.old_values).substring(0, 50) + '...' : '-'}</td>
                  <td class="json-preview">${log.new_values ? JSON.stringify(log.new_values).substring(0, 50) + '...' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Denne rapport er genereret automatisk fra Lejio Admin Audit Log System</p>
            <p>For komplet JSON-data af ændringer, brug venligst CSV-eksport</p>
          </div>
        </body>
        </html>
      `;

      // Open print dialog for PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
        toast.success(`Åbner print-dialog med ${exportLogs.length} log entries`);
      } else {
        toast.error('Kunne ikke åbne print-vindue. Tjek popup-blocker.');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Kunne ikke eksportere audit log');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Søg i beskrivelse eller identifier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Handling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle handlinger</SelectItem>
                <SelectItem value="create">Oprettet</SelectItem>
                <SelectItem value="update">Opdateret</SelectItem>
                <SelectItem value="delete">Slettet</SelectItem>
                <SelectItem value="swap">Bilbytte</SelectItem>
                <SelectItem value="approve">Godkendt</SelectItem>
                <SelectItem value="reject">Afvist</SelectItem>
                <SelectItem value="send">Sendt</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="profile">Brugere</SelectItem>
                <SelectItem value="booking">Bookinger</SelectItem>
                <SelectItem value="vehicle">Biler</SelectItem>
                <SelectItem value="invoice">Fakturaer</SelectItem>
                <SelectItem value="vehicle_swap">Bilbytter</SelectItem>
                <SelectItem value="contract">Kontrakter</SelectItem>
                <SelectItem value="warning">Advarsler</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Komplet sporbarhed på alle admin-handlinger i systemet
          </p>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Handlingslog ({logs.length})</span>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting || logs.length === 0}>
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Eksporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Eksporter til CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Eksporter til PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => loadLogs(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Opdater
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen audit logs fundet</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {ACTION_ICONS[log.action_type] || <FileText className="w-4 h-4" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="gap-1">
                              {ENTITY_ICONS[log.entity_type]}
                              {ENTITY_LABELS[log.entity_type] || log.entity_type}
                            </Badge>
                            <Badge variant="secondary">
                              {ACTION_LABELS[log.action_type] || log.action_type}
                            </Badge>
                            {log.entity_identifier && (
                              <span className="text-sm font-medium">{log.entity_identifier}</span>
                            )}
                          </div>
                          <p className="text-sm">{log.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.admin_profile?.full_name || log.admin_profile?.email || 'Ukendt'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(log.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Indlæs flere
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {ACTION_ICONS[selectedLog.action_type]}
                  Audit Log Detaljer
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Handling</label>
                    <p className="font-medium">{ACTION_LABELS[selectedLog.action_type] || selectedLog.action_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Type</label>
                    <p className="font-medium">{ENTITY_LABELS[selectedLog.entity_type] || selectedLog.entity_type}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Identifier</label>
                    <p className="font-medium">{selectedLog.entity_identifier || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Entity ID</label>
                    <p className="font-mono text-xs">{selectedLog.entity_id || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Beskrivelse</label>
                  <p className="font-medium">{selectedLog.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Admin</label>
                    <p className="font-medium">
                      {selectedLog.admin_profile?.full_name || 'Ingen navn'}
                      <br />
                      <span className="text-sm text-muted-foreground">{selectedLog.admin_profile?.email}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Tidspunkt</label>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: da })}
                    </p>
                  </div>
                </div>

                {selectedLog.user_agent && (
                  <div>
                    <label className="text-sm text-muted-foreground">User Agent</label>
                    <p className="text-xs font-mono bg-muted p-2 rounded">{selectedLog.user_agent}</p>
                  </div>
                )}

                {renderJsonValues(selectedLog.old_values, 'Gamle værdier')}
                {renderJsonValues(selectedLog.new_values, 'Nye værdier')}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
