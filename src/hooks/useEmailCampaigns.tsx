import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template_id?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  converted_count: number;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailTracking {
  id: string;
  campaign_id: string;
  lead_id: string;
  email: string;
  status: 'sent' | 'bounced' | 'opened' | 'clicked';
  opened_at?: string;
  clicked_at?: string;
  clicked_links?: string[];
  created_at: string;
  updated_at: string;
}

export const useEmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailTracking, setEmailTracking] = useState<EmailTracking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase)
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data as EmailCampaign[]) || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente email-kampagner',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create campaign
  const createCampaign = useCallback(async (campaignData: Partial<EmailCampaign>): Promise<EmailCampaign | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await (supabase)
        .from('email_campaigns')
        .insert({
          ...campaignData,
          created_by: userData.user?.id,
          status: 'draft',
        })
        .select('*')
        .single();

      if (error) throw error;

      const newCampaign = data as EmailCampaign;
      setCampaigns(prev => [newCampaign, ...prev]);

      toast({
        title: 'Kampagne oprettet',
        description: campaignData.name,
      });

      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette kampagne',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Send campaign
  const sendCampaign = useCallback(async (campaignId: string, leadIds: string[]): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // Update campaign status
      const { error: updateError } = await (supabase)
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_count: leadIds.length,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (updateError) throw updateError;

      // Create tracking records for each lead
      const trackingData = leadIds.map(leadId => ({
        campaign_id: campaignId,
        lead_id: leadId,
        status: 'sent',
        created_by: userData.user?.id,
      }));

      const { error: trackingError } = await (supabase)
        .from('email_tracking')
        .insert(trackingData);

      if (trackingError) throw trackingError;

      toast({
        title: 'Kampagne sendt',
        description: `Email sendt til ${leadIds.length} leads`,
      });

      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke sende kampagne',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchCampaigns]);

  // Track email open (webhook from email provider)
  const trackEmailOpen = useCallback(async (trackingId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('email_tracking')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString(),
        })
        .eq('id', trackingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking open:', error);
      return false;
    }
  }, []);

  // Track email click
  const trackEmailClick = useCallback(async (trackingId: string, link: string): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('email_tracking')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString(),
          clicked_links: [link],
        })
        .eq('id', trackingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error tracking click:', error);
      return false;
    }
  }, []);

  // Get campaign stats
  const getCampaignStats = (campaign: EmailCampaign) => {
    const openRate = campaign.sent_count > 0 
      ? Math.round((campaign.opened_count / campaign.sent_count) * 100)
      : 0;
    const clickRate = campaign.opened_count > 0
      ? Math.round((campaign.clicked_count / campaign.opened_count) * 100)
      : 0;
    const conversionRate = campaign.sent_count > 0
      ? Math.round((campaign.converted_count / campaign.sent_count) * 100)
      : 0;

    return { openRate, clickRate, conversionRate };
  };

  return {
    campaigns,
    emailTracking,
    isLoading,
    fetchCampaigns,
    createCampaign,
    sendCampaign,
    trackEmailOpen,
    trackEmailClick,
    getCampaignStats,
  };
};
