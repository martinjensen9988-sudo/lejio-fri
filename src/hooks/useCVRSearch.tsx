import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';

export interface CompanySearchResult {
  cvr: string;
  companyName: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  industry?: string;
  isActive: boolean;
}

interface UseCVRSearchReturn {
  results: CompanySearchResult[];
  isLoading: boolean;
  error: string | null;
  total: number;
  searchByIndustry: (query?: string, postalCode?: string) => Promise<CompanySearchResult[]>;
  searchByName: (query: string, postalCode?: string) => Promise<CompanySearchResult[]>;
  reset: () => void;
}

export const useCVRSearch = (): UseCVRSearchReturn => {
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const performSearch = useCallback(async (
    searchType: 'industry' | 'name',
    query?: string,
    postalCode?: string
  ): Promise<CompanySearchResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('cvr-search-industry', {
        body: { searchType, query, postalCode },
      });

      if (invokeError) {
        console.error('CVR search invoke error:', invokeError);
        setError('Kunne ikke søge i CVR');
        setResults([]);
        setTotal(0);
        return [];
      }

      if (responseData?.error) {
        setError(responseData.error);
        setResults([]);
        setTotal(0);
        return [];
      }

      const searchResults = responseData?.results || [];
      setResults(searchResults);
      setTotal(responseData?.total || 0);
      return searchResults;
    } catch (err) {
      console.error('CVR search error:', err);
      setError('Der opstod en fejl ved søgning');
      setResults([]);
      setTotal(0);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchByIndustry = useCallback(async (query?: string, postalCode?: string) => {
    return performSearch('industry', query || 'biludlejning', postalCode);
  }, [performSearch]);

  const searchByName = useCallback(async (query: string, postalCode?: string) => {
    return performSearch('name', query, postalCode);
  }, [performSearch]);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setTotal(0);
    setIsLoading(false);
  }, []);

  return { 
    results, 
    isLoading, 
    error, 
    total,
    searchByIndustry, 
    searchByName,
    reset 
  };
};
