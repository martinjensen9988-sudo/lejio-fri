import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';

interface EmailIntegration {
  id: string;
  lessor_id: string;
  type: 'gmail' | 'outlook' | 'custom_smtp';
  email: string;
  display_name: string;
  is_default: boolean;
  is_connected: boolean;
  connection_status: 'connected' | 'disconnected' | 'expired';
  created_at: string;
}

export const useEmailIntegrations = (userId: string) => {
  const [integrations, setIntegrations] = useState<EmailIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const query = supabase
        .from('lessor_email_integrations')
        .select('*')
        .eq('lessor_id', userId);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching email integrations:', error);
      toast.error('Kunne ikke hente email integrationer');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const getDefaultIntegration = useCallback(() => {
    return integrations.find(i => i.is_default) || integrations[0] || null;
  }, [integrations]);

  const getIntegrationById = useCallback(
    (id: string) => {
      return integrations.find(i => i.id === id);
    },
    [integrations]
  );

  const sendEmail = useCallback(
    async (
      recipient: string,
      subject: string,
      html: string,
      options?: {
        text?: string;
        emailType?: string;
        integrationId?: string;
      }
    ) => {
      try {
        if (!userId) throw new Error('User not authenticated');

        const { data, error } = await supabase.functions.invoke(
          'SendEmailWithIntegration',
          {
            body: {
              lessorId: userId,
              recipient,
              subject,
              html,
              text: options?.text,
              emailType: options?.emailType,
              integrationId: options?.integrationId,
            },
          }
        );

        if (error) throw error;

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('Error sending email:', error);
        toast.error(
          error instanceof Error ? error.message : 'Kunne ikke sende email'
        );
        return {
          success: false,
          error,
        };
      }
    },
    [userId]
  );

  const sendTestEmail = useCallback(
    async (integrationId: string, testEmail: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('SendTestEmail', {
          body: {
            integrationId,
            testEmail,
          },
        });

        if (error) throw error;

        toast.success(`Test email sendt til ${testEmail}`);
        return { success: true, data };
      } catch (error) {
        console.error('Error sending test email:', error);
        toast.error('Kunne ikke sende test email');
        return { success: false, error };
      }
    },
    []
  );

  const testIntegration = useCallback(
    async (
      type: 'gmail' | 'outlook' | 'custom_smtp',
      email: string,
      metadata: Record<string, any>
    ) => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'TestEmailIntegration',
          {
            body: {
              type,
              email,
              metadata,
            },
          }
        );

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Test failed');

        return { success: true, data };
      } catch (error) {
        console.error('Error testing email integration:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Integration test failed',
        };
      }
    },
    []
  );

  return {
    integrations,
    isLoading,
    fetchIntegrations,
    getDefaultIntegration,
    getIntegrationById,
    sendEmail,
    sendTestEmail,
    testIntegration,
  };
};
