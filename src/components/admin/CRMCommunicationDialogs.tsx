import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Mail, Loader2, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react';
import { CRMDeal } from '@/hooks/useCRM';
import { useCRMCommunication } from '@/hooks/useCRMCommunication';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface CRMEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: CRMDeal | null;
  onSuccess?: () => void;
}

export const CRMEmailDialog = ({ open, onOpenChange, deal, onSuccess }: CRMEmailDialogProps) => {
  const { sendEmail, isSendingEmail } = useCRMCommunication();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSend = async () => {
    if (!deal?.contact_email || !subject || !body) return;

    const result = await sendEmail({
      recipientEmail: deal.contact_email,
      recipientName: deal.contact_name,
      subject,
      body,
      dealId: deal.id,
    });

    if (result.success) {
      setSubject('');
      setBody('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSubject('');
      setBody('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Send email
          </DialogTitle>
          <DialogDescription>
            Send email til {deal?.contact_name || deal?.contact_email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Til</Label>
            <Input 
              value={`${deal?.contact_name || ''} <${deal?.contact_email || ''}>`} 
              disabled 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_subject">Emne *</Label>
            <Input
              id="email_subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Vedr. fleet-aftale"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_body">Besked *</Label>
            <Textarea
              id="email_body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Skriv din besked her..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annuller
          </Button>
          <Button onClick={handleSend} disabled={!subject || !body || isSendingEmail}>
            {isSendingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CRMCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: CRMDeal | null;
  onSuccess?: () => void;
}

export const CRMCallDialog = ({ open, onOpenChange, deal, onSuccess }: CRMCallDialogProps) => {
  const { 
    makeCall, 
    isCallingInProgress, 
    callLogs, 
    isLoadingCallLogs, 
    fetchCallLogs,
    formatDuration,
    getStatusLabel,
    getStatusColor
  } = useCRMCommunication();

  useEffect(() => {
    if (open && deal?.id) {
      fetchCallLogs(deal.id);
    }
  }, [open, deal?.id, fetchCallLogs]);

  const handleCall = async () => {
    if (!deal?.contact_phone) return;

    const result = await makeCall({
      to: deal.contact_phone,
      dealId: deal.id,
      contactName: deal.contact_name,
    });

    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-600" />
            Telefon
          </DialogTitle>
          <DialogDescription>
            Ring til {deal?.contact_name || 'kontakt'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Call target */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-mono">{deal?.contact_phone}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {deal?.contact_name} • {deal?.company_name}
            </p>
          </div>

          {/* Call button */}
          <Button 
            onClick={handleCall} 
            disabled={isCallingInProgress}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isCallingInProgress ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <PhoneCall className="w-5 h-5 mr-2" />
            )}
            Ring op nu
          </Button>

          {/* Call history */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Opkaldshistorik
            </h4>
            
            {isLoadingCallLogs ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : callLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen tidligere opkald
              </p>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {callLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {log.direction === 'inbound' ? (
                          <PhoneIncoming className="w-4 h-4 text-blue-600" />
                        ) : (
                          <PhoneOutgoing className="w-4 h-4 text-green-600" />
                        )}
                        <div>
                          <span className={getStatusColor(log.status)}>
                            {getStatusLabel(log.status)}
                          </span>
                          <span className="text-muted-foreground mx-1">•</span>
                          <span className="text-muted-foreground">
                            {formatDuration(log.duration_seconds)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'd. MMM HH:mm', { locale: da })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Luk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CRMCallHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CRMCallHistoryDialog = ({ open, onOpenChange }: CRMCallHistoryDialogProps) => {
  const { 
    callLogs, 
    isLoadingCallLogs, 
    fetchAllCallLogs,
    formatDuration,
    getStatusLabel,
    getStatusColor
  } = useCRMCommunication();

  useEffect(() => {
    if (open) {
      fetchAllCallLogs(100);
    }
  }, [open, fetchAllCallLogs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" />
            Opkaldshistorik
          </DialogTitle>
          <DialogDescription>
            Alle opkald foretaget via CRM
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingCallLogs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : callLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Ingen opkald registreret
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {callLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {log.direction === 'inbound' ? (
                      <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                        <PhoneIncoming className="w-4 h-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                        <PhoneOutgoing className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {log.direction === 'inbound' ? log.from_number : log.to_number}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(log.status)}`}
                        >
                          {getStatusLabel(log.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.direction === 'inbound' ? 'Indgående' : 'Udgående'} opkald
                        {log.duration_seconds && ` • ${formatDuration(log.duration_seconds)}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'd. MMM yyyy HH:mm', { locale: da })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Luk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
