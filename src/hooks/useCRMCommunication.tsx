import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useToast } from '@/hooks/use-toast';

interface CallLog {
  id: string;
  call_sid: string;
  status: string;
  duration_seconds: number | null;
  from_number: string | null;
  to_number: string | null;
  direction: string;
  deal_id: string | null;
  lead_id: string | null;
  created_at: string;
}

interface CallResult {
  success: boolean;
  callSid?: string;
  error?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

export const useCRMCommunication = () => {
  const [isCallingInProgress, setIsCallingInProgress] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoadingCallLogs, setIsLoadingCallLogs] = useState(false);
  const { toast } = useToast();

  const fetchCallLogs = useCallback(async (dealId?: string, leadId?: string) => {
    setIsLoadingCallLogs(true);
    try {
      let query = supabase
        .from('crm_call_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dealId) {
        query = query.eq('deal_id', dealId);
      } else if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error: unknown) {
      console.error('Error fetching call logs:', error);
    } finally {
      setIsLoadingCallLogs(false);
    }
  }, []);

  const fetchAllCallLogs = useCallback(async (limit = 100) => {
    setIsLoadingCallLogs(true);
    try {
      const { data, error } = await supabase
        .from('crm_call_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setCallLogs(data || []);
    } catch (error: unknown) {
      console.error('Error fetching all call logs:', error);
    } finally {
      setIsLoadingCallLogs(false);
    }
  }, []);

  const makeCall = useCallback(async (params: {
    to: string;
    dealId?: string;
    leadId?: string;
    contactName?: string;
  }): Promise<CallResult> => {
    setIsCallingInProgress(true);
    try {
      const { data, error } = await supabase.functions.invoke('twilio-make-call', {
        body: params,
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Opkald startet',
          description: `Ringer til ${params.contactName || params.to}`,
        });
        
        // Refresh call logs after successful call
        if (params.dealId) {
          fetchCallLogs(params.dealId);
        } else if (params.leadId) {
          fetchCallLogs(undefined, params.leadId);
        }
        
        return { success: true, callSid: data.callSid };
      } else {
        throw new Error(data?.error || 'Kunne ikke starte opkald');
      }
    } catch (error: unknown) {
      console.error('Error making call:', error);
      toast({
        title: 'Fejl ved opkald',
        description: error.message || 'Kunne ikke starte opkald',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsCallingInProgress(false);
    }
  }, [toast, fetchCallLogs]);

  const sendEmail = useCallback(async (params: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
    dealId?: string;
    leadId?: string;
  }): Promise<EmailResult> => {
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('crm-send-email', {
        body: params,
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Email sendt',
          description: `Email sendt til ${params.recipientName || params.recipientEmail}`,
        });
        return { success: true };
      } else {
        throw new Error(data?.error || 'Kunne ikke sende email');
      }
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      toast({
        title: 'Fejl ved afsendelse',
        description: error.message || 'Kunne ikke sende email',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsSendingEmail(false);
    }
  }, [toast]);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'queued': 'I kø',
      'ringing': 'Ringer',
      'in-progress': 'Igangværende',
      'completed': 'Afsluttet',
      'busy': 'Optaget',
      'failed': 'Fejlet',
      'no-answer': 'Ikke besvaret',
      'canceled': 'Annulleret',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in-progress':
      case 'ringing':
        return 'text-blue-600';
      case 'failed':
      case 'busy':
      case 'no-answer':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return {
    makeCall,
    sendEmail,
    isCallingInProgress,
    isSendingEmail,
    callLogs,
    isLoadingCallLogs,
    fetchCallLogs,
    fetchAllCallLogs,
    formatDuration,
    getStatusLabel,
    getStatusColor,
  };
};
