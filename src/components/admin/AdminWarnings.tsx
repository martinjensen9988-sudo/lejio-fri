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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  AlertTriangle, MessageSquare, CheckCircle, XCircle,
  Loader2, Send, Eye
} from 'lucide-react';
import { 
  RenterWarning, 
  WarningAppeal, 
  WARNING_REASON_LABELS,
  WARNING_STATUS_LABELS,
  APPEAL_STATUS_LABELS,
  WarningStatus,
  AppealStatus,
} from '@/hooks/useRenterWarnings';
import { useAuth } from '@/hooks/useAuth';

interface AdminMessage {
  id: string;
  warning_id: string | null;
  appeal_id: string | null;
  sender_id: string;
  sender_type: string;
  recipient_id: string | null;
  recipient_type: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminWarnings = () => {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState<RenterWarning[]>([]);
  const [appeals, setAppeals] = useState<WarningAppeal[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarning, setSelectedWarning] = useState<RenterWarning | null>(null);
  const [selectedAppeal, setSelectedAppeal] = useState<WarningAppeal | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: data kunne ikke hentes. Prøv igen.')), 12000)
    );

    try {
      await Promise.race([
        (async () => {
          const { data: warningsData, error: warningsError } = await supabase
            .from('renter_warnings')
            .select('*')
            .order('created_at', { ascending: false });

          if (warningsError) {
            console.error('Error fetching warnings:', warningsError);
            toast.error('Kunne ikke hente advarsler');
          } else {
            setWarnings((warningsData || []) as RenterWarning[]);
          }

          const { data: appealsData, error: appealsError } = await supabase
            .from('warning_appeals')
            .select('*')
            .order('created_at', { ascending: false });

          if (appealsError) {
            console.error('Error fetching appeals:', appealsError);
            toast.error('Kunne ikke hente klager');
          } else {
            setAppeals((appealsData || []) as WarningAppeal[]);
          }

          const { data: messagesData, error: messagesError } = await supabase
            .from('admin_messages')
            .select('*')
            .order('created_at', { ascending: false });

          if (messagesError) {
            console.error('Error fetching admin messages:', messagesError);
            toast.error('Kunne ikke hente admin beskeder');
          } else {
            setMessages((messagesData || []) as AdminMessage[]);
          }
        })(),
        timeout,
      ]);
    } catch (err: unknown) {
      console.error('AdminWarnings fetchData failed:', err);
      toast.error(err?.message || 'Kunne ikke hente data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateWarningStatus = async (warningId: string, status: WarningStatus) => {
    const { error } = await supabase
      .from('renter_warnings')
      .update({ status })
      .eq('id', warningId);

    if (error) {
      toast.error('Kunne ikke opdatere status');
    } else {
      toast.success('Status opdateret');
      fetchData();
    }
  };

  const updateAppealStatus = async (appealId: string, status: AppealStatus, notes?: string) => {
    const updateData: unknown = { 
      status, 
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    };
    if (notes) updateData.admin_notes = notes;

    const { error } = await supabase
      .from('warning_appeals')
      .update(updateData)
      .eq('id', appealId);

    if (error) {
      toast.error('Kunne ikke opdatere klage');
    } else {
      // If approved, dismiss the warning
      if (status === 'approved' && selectedAppeal) {
        await updateWarningStatus(selectedAppeal.warning_id, 'dismissed');
      }
      toast.success('Klage behandlet');
      setSelectedAppeal(null);
      fetchData();
    }
  };

  const sendMessage = async (warningId: string, recipientId: string, recipientType: string) => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    const { error } = await supabase
      .from('admin_messages')
      .insert({
        warning_id: warningId,
        sender_id: user.id,
        sender_type: 'admin',
        recipient_id: recipientId,
        recipient_type: recipientType,
        message: newMessage.trim(),
      });

    if (error) {
      toast.error('Kunne ikke sende besked');
    } else {
      toast.success('Besked sendt');
      setNewMessage('');
      fetchData();
    }
    setIsSending(false);
  };

  const getStatusBadge = (status: WarningStatus) => {
    const colors: Record<WarningStatus, string> = {
      active: 'bg-red-500',
      under_review: 'bg-yellow-500',
      dismissed: 'bg-gray-500',
      expired: 'bg-gray-400',
    };
    return <Badge className={colors[status]}>{WARNING_STATUS_LABELS[status]}</Badge>;
  };

  const getAppealStatusBadge = (status: AppealStatus) => {
    const colors: Record<AppealStatus, string> = {
      pending: 'bg-yellow-500',
      reviewing: 'bg-blue-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return <Badge className={colors[status]}>{APPEAL_STATUS_LABELS[status]}</Badge>;
  };

  const stats = {
    totalWarnings: warnings.length,
    activeWarnings: warnings.filter(w => w.status === 'active').length,
    pendingAppeals: appeals.filter(a => a.status === 'pending').length,
    unreadMessages: messages.filter(m => !m.is_read).length,
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
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalWarnings}</p>
                <p className="text-xs text-muted-foreground">Advarsler i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeWarnings}</p>
                <p className="text-xs text-muted-foreground">Aktive advarsler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingAppeals}</p>
                <p className="text-xs text-muted-foreground">Afventende klager</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                <p className="text-xs text-muted-foreground">Ulæste beskeder</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="warnings">
        <TabsList>
          <TabsTrigger value="warnings">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Advarsler ({warnings.length})
          </TabsTrigger>
          <TabsTrigger value="appeals">
            <XCircle className="w-4 h-4 mr-2" />
            Klager ({appeals.length})
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Beskeder ({messages.length})
          </TabsTrigger>
        </TabsList>

        {/* Warnings Tab */}
        <TabsContent value="warnings">
          <Card>
            <CardHeader>
              <CardTitle>Alle advarsler</CardTitle>
              <CardDescription>Advarsler oprettet af udlejere</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lejer</TableHead>
                    <TableHead>Årsag</TableHead>
                    <TableHead>Alvorlighed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Oprettet</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warnings.map((warning) => (
                    <TableRow key={warning.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{warning.renter_name || 'Ukendt'}</p>
                          <p className="text-sm text-muted-foreground">{warning.renter_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{WARNING_REASON_LABELS[warning.reason]}</TableCell>
                      <TableCell>
                        <Badge variant={warning.severity >= 4 ? 'destructive' : 'secondary'}>
                          {warning.severity}/5
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(warning.status)}</TableCell>
                      <TableCell>
                        {format(new Date(warning.created_at), 'dd. MMM yyyy', { locale: da })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWarning(warning)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detaljer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appeals Tab */}
        <TabsContent value="appeals">
          <Card>
            <CardHeader>
              <CardTitle>Klager</CardTitle>
              <CardDescription>Klager fra lejere over advarsler</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klager</TableHead>
                    <TableHead>Begrundelse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Oprettet</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appeals.map((appeal) => (
                    <TableRow key={appeal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{appeal.appellant_name || 'Ukendt'}</p>
                          <p className="text-sm text-muted-foreground">{appeal.appellant_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {appeal.appeal_reason}
                      </TableCell>
                      <TableCell>{getAppealStatusBadge(appeal.status)}</TableCell>
                      <TableCell>
                        {format(new Date(appeal.created_at), 'dd. MMM yyyy', { locale: da })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAppeal(appeal)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Behandl
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Beskeder</CardTitle>
              <CardDescription>Kommunikation med udlejere og lejere</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ingen beskeder endnu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border ${msg.is_read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{msg.sender_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'dd. MMM yyyy HH:mm', { locale: da })}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning Details Dialog */}
      <Dialog open={!!selectedWarning} onOpenChange={() => setSelectedWarning(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advarselsdetaljer</DialogTitle>
          </DialogHeader>
          {selectedWarning && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Lejer</p>
                  <p className="font-medium">{selectedWarning.renter_name || 'Ukendt'}</p>
                  <p className="text-sm">{selectedWarning.renter_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedWarning.status)}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Beskrivelse</p>
                <p>{selectedWarning.description}</p>
              </div>

              <div className="flex gap-2">
                {selectedWarning.status === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => updateWarningStatus(selectedWarning.id, 'under_review')}
                    >
                      Sæt under behandling
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateWarningStatus(selectedWarning.id, 'dismissed')}
                    >
                      Afvis advarsel
                    </Button>
                  </>
                )}
              </div>

              {/* Send message to lessor */}
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">Send besked til udlejer</p>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Skriv en besked..."
                />
                <Button
                  onClick={() => sendMessage(selectedWarning.id, selectedWarning.reported_by, 'lessor')}
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appeal Details Dialog */}
      <Dialog open={!!selectedAppeal} onOpenChange={() => setSelectedAppeal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Behandl klage</DialogTitle>
          </DialogHeader>
          {selectedAppeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Klager</p>
                  <p className="font-medium">{selectedAppeal.appellant_name || 'Ukendt'}</p>
                  <p className="text-sm">{selectedAppeal.appellant_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getAppealStatusBadge(selectedAppeal.status)}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Klagebegrundelse</p>
                <p>{selectedAppeal.appeal_reason}</p>
              </div>

              {selectedAppeal.supporting_info && (
                <div>
                  <p className="text-sm text-muted-foreground">Yderligere information</p>
                  <p>{selectedAppeal.supporting_info}</p>
                </div>
              )}

              {selectedAppeal.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => updateAppealStatus(selectedAppeal.id, 'reviewing')}
                  >
                    Sæt under behandling
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateAppealStatus(selectedAppeal.id, 'approved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Godkend (fjern advarsel)
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateAppealStatus(selectedAppeal.id, 'rejected')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Afvis klage
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWarnings;
