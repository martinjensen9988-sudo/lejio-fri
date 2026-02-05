import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/azure/client';
import { addDays, isBefore, isAfter } from 'date-fns';

interface PaymentReminder {
  id: string;
  invoice_id: string;
  reminder_number: number;
  reminder_type: 'due_date' | 'overdue_1' | 'overdue_2' | 'overdue_3' | 'final_notice';
  scheduled_date: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  email_subject: string;
  email_body: string;
  recipient_email: string;
  created_at: string;
}

interface DunningConfig {
  daysBeforeDue: number; // Send reminder X days before due date
  daysAfterOverdue: number[]; // [7, 14, 30] = reminders at 7, 14, 30 days overdue
  finalNoticeAfterDays: number; // Send final notice after this many days
}

export const useDunningManagement = () => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultDunningConfig: DunningConfig = {
    daysBeforeDue: 7,
    daysAfterOverdue: [7, 14, 30],
    finalNoticeAfterDays: 45,
  };

  // Fetch pending reminders
  const fetchPendingReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase)
        .from('payment_reminders')
        .select('*')
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setReminders((data as PaymentReminder[]) || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente betalingspåmindelser',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Generate dunning reminders for an invoice
  const generateDunningSequence = useCallback(async (
    invoiceId: string,
    dueDate: string,
    recipientEmail: string,
    config: DunningConfig = defaultDunningConfig
  ): Promise<boolean> => {
    try {
      const remindersToCreate: Omit<PaymentReminder, 'id' | 'created_at'>[] = [];
      const dueDateObj = new Date(dueDate);

      // Reminder before due date
      remindersToCreate.push({
        invoice_id: invoiceId,
        reminder_number: 0,
        reminder_type: 'due_date',
        scheduled_date: addDays(dueDateObj, -config.daysBeforeDue).toISOString().split('T')[0],
        status: 'pending',
        email_subject: 'Påmindelse: Faktura forfalder snart',
        email_body: 'Din faktura forfalder på [DATE]. Venligst indbetal før denne dato.',
        recipient_email: recipientEmail,
        sent_at: undefined,
      });

      // Overdue reminders
      config.daysAfterOverdue.forEach((days, index) => {
        const reminderTypes: ('overdue_1' | 'overdue_2' | 'overdue_3')[] = ['overdue_1', 'overdue_2', 'overdue_3'];
        remindersToCreate.push({
          invoice_id: invoiceId,
          reminder_number: index + 1,
          reminder_type: reminderTypes[Math.min(index, 2)] || 'overdue_1',
          scheduled_date: addDays(dueDateObj, days).toISOString().split('T')[0],
          status: 'pending',
          email_subject: `Rykkerskrivelse: Faktura er ${days} dage forfald`,
          email_body: `Din faktura er nu ${days} dage forfald. Venligst indbetal øjeblikkeligt.`,
          recipient_email: recipientEmail,
          sent_at: undefined,
        });
      });

      // Final notice
      remindersToCreate.push({
        invoice_id: invoiceId,
        reminder_number: config.daysAfterOverdue.length + 1,
        reminder_type: 'final_notice',
        scheduled_date: addDays(dueDateObj, config.finalNoticeAfterDays).toISOString().split('T')[0],
        status: 'pending',
        email_subject: 'Sidste påmindelse før inkasso',
        email_body: 'Dette er vores sidste påmindelse. Faktura skal betales omgående.',
        recipient_email: recipientEmail,
        sent_at: undefined,
      });

      // Insert all reminders
      const { error } = await (supabase)
        .from('payment_reminders')
        .insert(remindersToCreate);

      if (error) throw error;

      toast({
        title: 'Rykkersekvens oprettet',
        description: `${remindersToCreate.length} påmindelser planlagt`,
      });

      return true;
    } catch (error) {
      console.error('Error generating dunning sequence:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette rykkersekvens',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Send payment reminder
  const sendReminder = useCallback(async (reminderId: string): Promise<boolean> => {
    try {
      // In real implementation, send email via email service
      // await emailService.sendReminder(reminder);

      const { error } = await (supabase)
        .from('payment_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(prev =>
        prev.map(r =>
          r.id === reminderId
            ? { ...r, status: 'sent' as const, sent_at: new Date().toISOString() }
            : r
        )
      );

      toast({
        title: 'Påmindelse sendt',
        description: 'Betalingspåmindelse blev sendt',
      });

      return true;
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke sende påmindelse',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Auto-send due reminders (scheduled job)
  const processDueReminders = useCallback(async (): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await (supabase)
        .from('payment_reminders')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_date', today);

      if (error) throw error;

      let sentCount = 0;
      for (const reminder of data || []) {
        await sendReminder(reminder.id);
        sentCount++;
      }

      return sentCount;
    } catch (error) {
      console.error('Error processing reminders:', error);
      return 0;
    }
  }, [sendReminder]);

  // Cancel dunning sequence
  const cancelDunningSequence = useCallback(async (invoiceId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('payment_reminders')
        .update({ status: 'cancelled' })
        .eq('invoice_id', invoiceId)
        .eq('status', 'pending');

      if (error) throw error;

      setReminders(prev =>
        prev.filter(r => r.invoice_id !== invoiceId)
      );

      toast({
        title: 'Rykkersekvens annulleret',
        description: 'Alle pendende påmindelser blev annulleret',
      });

      return true;
    } catch (error) {
      console.error('Error cancelling dunning sequence:', error);
      return false;
    }
  }, [toast]);

  return {
    reminders,
    isLoading,
    fetchPendingReminders,
    generateDunningSequence,
    sendReminder,
    processDueReminders,
    cancelDunningSequence,
  };
};
