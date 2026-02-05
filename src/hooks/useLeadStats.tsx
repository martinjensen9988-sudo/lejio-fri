import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

export interface LeadStats {
  totalLeads: number;
  enrichedLeads: number;
  leadsWithEmail: number;
  leadsWithPhone: number;
  leadsWithWebsite: number;
  leadsWithCvr: number;
  emailsSent: number;
  averageScore: number;
  topIndustries: { industry: string; count: number }[];
  topCities: { city: string; count: number }[];
}

interface Lead {
  id: string;
  company_name: string;
  industry: string;
  city?: string;
  reason?: string;
  score: number;
  enriched: boolean;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  cvr?: string;
  email_sent: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
}

export const useLeadStats = () => {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch comprehensive lead statistics
  const fetchLeadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: leads, error } = await (supabase as any)
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const leadList = (leads || []) as Lead[];

      // Calculate statistics
      const totalLeads = leadList.length;
      const enrichedLeads = leadList.filter(l => l.enriched).length;
      const leadsWithEmail = leadList.filter(l => l.contact_email).length;
      const leadsWithPhone = leadList.filter(l => l.contact_phone).length;
      const leadsWithWebsite = leadList.filter(l => l.website).length;
      const leadsWithCvr = leadList.filter(l => l.cvr).length;
      const emailsSent = leadList.filter(l => l.email_sent).length;
      
      const scores = leadList.map(l => l.score || 0);
      const averageScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;

      // Top industries
      const industriesMap = new Map<string, number>();
      leadList.forEach(l => {
        if (l.industry) {
          industriesMap.set(l.industry, (industriesMap.get(l.industry) || 0) + 1);
        }
      });
      const topIndustries = Array.from(industriesMap.entries())
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top cities
      const citiesMap = new Map<string, number>();
      leadList.forEach(l => {
        if (l.city) {
          citiesMap.set(l.city, (citiesMap.get(l.city) || 0) + 1);
        }
      });
      const topCities = Array.from(citiesMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const calculatedStats: LeadStats = {
        totalLeads,
        enrichedLeads,
        leadsWithEmail,
        leadsWithPhone,
        leadsWithWebsite,
        leadsWithCvr,
        emailsSent,
        averageScore: Math.round(averageScore * 10) / 10,
        topIndustries,
        topCities,
      };

      setStats(calculatedStats);
      return calculatedStats;
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      toast.error('Kunne ikke hente lead-statistik');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save lead to database (for manual entry)
  const saveLead = useCallback(async (leadData: {
    company_name: string;
    industry: string;
    city?: string;
    reason?: string;
    contact_email?: string;
    contact_phone?: string;
    website?: string;
    cvr?: string;
    source?: string;
  }) => {
    try {
      const { data: existingLead } = await (supabase as any)
        .from('leads')
        .select('id')
        .eq('company_name', leadData.company_name)
        .maybeSingle();

      if (existingLead) {
        toast.error('Lead allerede eksisterer');
        return null;
      }

      const { data: newLead, error } = await (supabase as any)
        .from('leads')
        .insert({
          ...leadData,
          status: 'new',
          enriched: !!(leadData.contact_email || leadData.contact_phone),
          source: leadData.source || 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead gemt');
      await fetchLeadStats(); // Refresh stats
      return newLead;
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Kunne ikke gemme lead');
      return null;
    }
  }, [fetchLeadStats]);

  // Update lead status
  const updateLeadStatus = useCallback(async (leadId: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead opdateret');
      await fetchLeadStats(); // Refresh stats
      return true;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Kunne ikke opdatere lead');
      return false;
    }
  }, [fetchLeadStats]);

  // Delete lead
  const deleteLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead slettet');
      await fetchLeadStats(); // Refresh stats
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Kunne ikke slette lead');
      return false;
    }
  }, [fetchLeadStats]);

  // Get leads with filters
  const getLeads = useCallback(async (filters?: {
    industry?: string;
    city?: string;
    status?: string;
    minScore?: number;
    enrichedOnly?: boolean;
  }) => {
    try {
      let query = (supabase as any).from('leads').select('*');

      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.minScore) {
        query = query.gte('score', filters.minScore);
      }
      if (filters?.enrichedOnly) {
        query = query.eq('enriched', true);
      }

      const { data, error } = await query.order('score', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching filtered leads:', error);
      return [];
    }
  }, []);

  return {
    stats,
    isLoading,
    fetchLeadStats,
    saveLead,
    updateLeadStatus,
    deleteLead,
    getLeads,
  };
};
