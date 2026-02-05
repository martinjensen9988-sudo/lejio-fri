import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Flag, Loader2, Eye, CheckCircle, XCircle, Clock, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LessorReport {
  id: string;
  lessor_id: string;
  reporter_email: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  booking_id: string | null;
  reason: string;
  description: string;
  severity: number;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  lessor?: {
    email: string;
    full_name: string | null;
    company_name: string | null;
  };
}

const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'Afventer',
  reviewing: 'Under behandling',
  resolved: 'Løst',
  dismissed: 'Afvist',
};

const REPORT_REASON_LABELS: Record<string, string> = {
  poor_vehicle_condition: 'Dårlig køretøjsstand',
  misleading_description: 'Vildledende beskrivelse',
  unprofessional_behavior: 'Uprofessionel opførsel',
  overcharging: 'Overopkrævning',
  cancellation_issues: 'Afbestillingsproblemer',
  safety_concerns: 'Sikkerhedsproblemer',
  other: 'Andet',
};

const AdminLessorReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<LessorReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LessorReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('lessor_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      toast.error('Kunne ikke hente rapporter');
    } else {
      // Fetch lessor profiles
      const lessorIds = [...new Set((data || []).map(r => r.lessor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name')
        .in('id', lessorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const reportsWithLessors = (data || []).map(r => ({
        ...r,
        lessor: profileMap.get(r.lessor_id),
      }));
      
      setReports(reportsWithLessors);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateReportStatus = async (reportId: string, status: string) => {
    setIsUpdating(true);
    
    const { error } = await supabase
      .from('lessor_reports')
      .update({
        status,
        admin_notes: adminNotes || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) {
      toast.error('Kunne ikke opdatere rapport');
    } else {
      toast.success('Rapport opdateret');
      setSelectedReport(null);
      fetchReports();
    }
    setIsUpdating(false);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      reviewing: 'bg-blue-500',
      resolved: 'bg-accent',
      dismissed: 'bg-muted',
    };
    return <Badge className={colors[status] || 'bg-secondary'}>{REPORT_STATUS_LABELS[status] || status}</Badge>;
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Flag className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Rapporter i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Afventer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.reviewing}</p>
                <p className="text-xs text-muted-foreground">Under behandling</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Løst</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rapporter om udlejere</CardTitle>
          <CardDescription>Rapporter indsendt af lejere om udlejere</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ingen rapporter endnu</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Udlejer</TableHead>
                  <TableHead>Rapporteret af</TableHead>
                  <TableHead>Årsag</TableHead>
                  <TableHead>Alvorlighed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Oprettet</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {report.lessor?.company_name || report.lessor?.full_name || 'Ukendt'}
                        </p>
                        <p className="text-sm text-muted-foreground">{report.lessor?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.reporter_name || 'Ukendt'}</p>
                        <p className="text-sm text-muted-foreground">{report.reporter_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{REPORT_REASON_LABELS[report.reason] || report.reason}</TableCell>
                    <TableCell>
                      <Badge variant={report.severity >= 4 ? 'destructive' : 'secondary'}>
                        {report.severity}/5
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      {format(new Date(report.created_at), 'dd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes(report.admin_notes || '');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Behandl
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Behandl rapport</DialogTitle>
            <DialogDescription>
              Rapport om {selectedReport?.lessor?.company_name || selectedReport?.lessor?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Udlejer</p>
                  <p className="font-medium">
                    {selectedReport.lessor?.company_name || selectedReport.lessor?.full_name}
                  </p>
                  <p className="text-sm">{selectedReport.lessor?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rapporteret af</p>
                  <p className="font-medium">{selectedReport.reporter_name || 'Ukendt'}</p>
                  <p className="text-sm">{selectedReport.reporter_email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Årsag</p>
                <p className="font-medium">{REPORT_REASON_LABELS[selectedReport.reason] || selectedReport.reason}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Beskrivelse</p>
                <p className="bg-muted/50 p-3 rounded-lg">{selectedReport.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Admin noter</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tilføj noter om behandlingen..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => updateReportStatus(selectedReport!.id, 'dismissed')}
              disabled={isUpdating}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Afvis
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateReportStatus(selectedReport!.id, 'reviewing')}
              disabled={isUpdating}
            >
              <Clock className="w-4 h-4 mr-2" />
              Under behandling
            </Button>
            <Button
              onClick={() => updateReportStatus(selectedReport!.id, 'resolved')}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Markér som løst
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLessorReports;
