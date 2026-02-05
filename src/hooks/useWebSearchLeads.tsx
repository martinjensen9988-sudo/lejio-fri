import { useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export interface AnalyzedLead {
  company_name: string;
  website: string;
  description: string;
  potential_score: number;
  contact_suggestion: string;
}

export interface WebSearchResponse {
  query: string;
  raw_results: WebSearchResult[];
  analyzed_leads: AnalyzedLead[];
  total_found: number;
}

export const useWebSearchLeads = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<WebSearchResponse | null>(null);

  const searchWeb = async (query: string, location?: string): Promise<WebSearchResponse | null> => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('web-search-leads', {
        body: { query, location },
      });

      if (error) {
        console.error('Web search error:', error);
        toast.error('Kunne ikke søge på nettet');
        return null;
      }

      setResults(data);
      return data;
    } catch (error) {
      console.error('Web search error:', error);
      toast.error('Der opstod en fejl under søgning');
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  return {
    searchWeb,
    clearResults,
    results,
    isSearching,
  };
};
