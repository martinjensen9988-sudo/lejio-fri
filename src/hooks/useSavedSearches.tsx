import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useToast } from '@/hooks/use-toast';

export interface SavedSearch {
  id: string;
  name: string;
  filters: FilterCriteria;
  created_at: string;
  created_by?: string;
}

export interface FilterCriteria {
  dateRange?: {
    from: string;
    to: string;
  };
  status?: string[];
  source?: string[];
  industry?: string[];
  searchText?: string;
  minScore?: number;
}

export const useSavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch saved searches from Supabase
  const fetchSavedSearches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await (supabase)
        .from('saved_searches')
        .select('*')
        .eq('user_id', userData.user?.id)
        .eq('type', 'lead')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedSearches((data as SavedSearch[]) || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente gemte søgninger',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save current search
  const saveSearch = useCallback(async (name: string, filters: FilterCriteria): Promise<SavedSearch | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await (supabase)
        .from('saved_searches')
        .insert({
          user_id: userData.user?.id,
          name,
          filters,
          type: 'lead',
        })
        .select('*')
        .single();

      if (error) throw error;

      const newSearch = data as SavedSearch;
      setSavedSearches(prev => [newSearch, ...prev]);

      toast({
        title: 'Søgning gemt',
        description: `"${name}" er gemt`,
      });

      return newSearch;
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke gemme søgningen',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Delete saved search
  const deleteSearch = useCallback(async (searchId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

      if (error) throw error;

      setSavedSearches(prev => prev.filter(s => s.id !== searchId));
      toast({
        title: 'Søgning slettet',
        description: 'Den gemte søgning er blevet fjernet',
      });

      return true;
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette søgningen',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Apply quick filters
  const getQuickFilter = (type: 'hot' | 'no-contact' | 'idle'): FilterCriteria => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    switch (type) {
      case 'hot':
        return { minScore: 70 };
      case 'no-contact':
        return {
          dateRange: {
            from: '2000-01-01',
            to: thirtyDaysAgo.toISOString(),
          },
          status: ['new', 'interested'],
        };
      case 'idle':
        return {
          dateRange: {
            from: '2000-01-01',
            to: new Date(thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60)).toISOString(),
          },
        };
    }
  };

  return {
    savedSearches,
    isLoading,
    fetchSavedSearches,
    saveSearch,
    deleteSearch,
    getQuickFilter,
  };
};

// Filter leads based on criteria
export const applyFilters = (leads: unknown[], filters: FilterCriteria): unknown[] => {
  return leads.filter(lead => {
    // Text search
    if (filters.searchText) {
      const text = filters.searchText.toLowerCase();
      const matches = 
        lead.company_name?.toLowerCase().includes(text) ||
        lead.contact_name?.toLowerCase().includes(text) ||
        lead.contact_email?.toLowerCase().includes(text) ||
        lead.cvr_number?.includes(text);
      
      if (!matches) return false;
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(lead.status)) return false;
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      if (!filters.source.includes(lead.source)) return false;
    }

    // Industry filter
    if (filters.industry && filters.industry.length > 0) {
      if (!filters.industry.includes(lead.industry)) return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const leadDate = new Date(lead.created_at);
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      
      if (leadDate < fromDate || leadDate > toDate) return false;
    }

    // Min score filter (would use calculateLeadScore from CRMDashboardWidget)
    // if (filters.minScore) {
    //   if (calculateLeadScore(lead) < filters.minScore) return false;
    // }

    return true;
  });
};
