import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useToast } from '@/hooks/use-toast';

export interface SalesLead {
  id: string;
  company_name: string;
  cvr_number?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  source: string;
  status: string;
  notes?: string;
  industry?: string;
  website?: string;
  facebook_url?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SalesEmail {
  id: string;
  lead_id: string;
  subject: string;
  body: string;
  sent_at?: string;
  status: string;
  created_at: string;
  created_by?: string;
}

export const useSalesLeads = () => {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data as SalesLead[]) || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente leads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addLead = useCallback(async (lead: Partial<SalesLead>) => {
    try {
      if (!lead.company_name) {
        throw new Error('Firmanavn er påkrævet');
      }

      const { data: userData } = await supabase.auth.getUser();

      const insertData = {
        company_name: lead.company_name,
        cvr_number: lead.cvr_number || null,
        contact_name: lead.contact_name || null,
        contact_email: lead.contact_email || null,
        contact_phone: lead.contact_phone || null,
        address: lead.address || null,
        city: lead.city || null,
        postal_code: lead.postal_code || null,
        source: lead.source || 'manual',
        status: lead.status || 'new',
        notes: lead.notes || null,
        industry: lead.industry || null,
        website: lead.website || null,
        facebook_url: lead.facebook_url || null,
        created_by: userData.user?.id || null,
      };

      const { data, error } = await supabase
        .from('sales_leads')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setLeads((prev) => [data as SalesLead, ...prev]);
      toast({
        title: 'Lead tilføjet',
        description: `${lead.company_name} er tilføjet`,
      });

      return data as SalesLead;
    } catch (error: unknown) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Fejl',
        description: error?.message || 'Kunne ikke tilføje lead',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateLead = useCallback(async (id: string, updates: Partial<SalesLead>) => {
    try {
      const { data, error } = await supabase
        .from('sales_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setLeads(prev => prev.map(l => l.id === id ? data as SalesLead : l));
      toast({
        title: 'Lead opdateret',
        description: 'Ændringerne er gemt',
      });
      
      return data as SalesLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere lead',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteLead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLeads(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Lead slettet',
        description: 'Lead er blevet fjernet',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette lead',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const importFromCSV = useCallback(async (csvData: string) => {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV skal have mindst en header og en data-række');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const leads: Partial<SalesLead>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const lead: Partial<SalesLead> = { source: 'csv' };
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (!value) return;
          
          switch (header) {
            case 'virksomhed':
            case 'company':
            case 'company_name':
            case 'firma':
              lead.company_name = value;
              break;
            case 'cvr':
            case 'cvr_number':
              lead.cvr_number = value;
              break;
            case 'kontakt':
            case 'contact':
            case 'contact_name':
            case 'navn':
              lead.contact_name = value;
              break;
            case 'email':
            case 'contact_email':
            case 'mail':
              lead.contact_email = value;
              break;
            case 'telefon':
            case 'phone':
            case 'contact_phone':
            case 'tlf':
              lead.contact_phone = value;
              break;
            case 'by':
            case 'city':
              lead.city = value;
              break;
            case 'branche':
            case 'industry':
              lead.industry = value;
              break;
          }
        });
        
        if (lead.company_name) {
          leads.push(lead);
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = leads.map(l => ({
        company_name: l.company_name!,
        cvr_number: l.cvr_number || null,
        contact_name: l.contact_name || null,
        contact_email: l.contact_email || null,
        contact_phone: l.contact_phone || null,
        address: l.address || null,
        city: l.city || null,
        postal_code: l.postal_code || null,
        source: l.source || 'csv',
        status: l.status || 'new',
        notes: l.notes || null,
        industry: l.industry || null,
        website: l.website || null,
        facebook_url: l.facebook_url || null,
        created_by: userData.user?.id || null,
      }));
      
      const { data, error } = await supabase
        .from('sales_leads')
        .insert(insertData)
        .select();

      if (error) throw error;

      setLeads(prev => [...(data as SalesLead[]), ...prev]);
      toast({
        title: 'Import gennemført',
        description: `${leads.length} leads importeret`,
      });
      
      return data as SalesLead[];
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Fejl',
        description: error instanceof Error ? error.message : 'Kunne ikke importere CSV',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const generateEmail = useCallback(async (
    lead: SalesLead, 
    emailType: string, 
    callContext?: { outcome: string; notes: string }
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-sales-email', {
        body: { lead, emailType, callContext },
      });

      if (error) throw error;
      
      return data as { subject: string; body: string };
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke generere email',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const saveEmail = useCallback(async (leadId: string, subject: string, body: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sales_emails')
        .insert({
          lead_id: leadId,
          subject,
          body,
          status: 'draft',
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Email gemt',
        description: 'Emailen er gemt som kladde',
      });
      
      return data as SalesEmail;
    } catch (error) {
      console.error('Error saving email:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke gemme email',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const sendEmail = useCallback(async (
    leadId: string, 
    recipientEmail: string, 
    subject: string, 
    body: string,
    recipientName?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sales-email', {
        body: { leadId, recipientEmail, recipientName, subject, body },
      });

      if (error) throw error;
      
      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === leadId 
          ? { ...l, status: 'contacted', last_contacted_at: new Date().toISOString() }
          : l
      ));
      
      toast({
        title: 'Email sendt',
        description: `Email er sendt til ${recipientEmail}`,
      });
      
      return data;
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      toast({
        title: 'Fejl',
        description: error?.message || 'Kunne ikke sende email',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  return {
    leads,
    isLoading,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    importFromCSV,
    generateEmail,
    saveEmail,
    sendEmail,
  };
};