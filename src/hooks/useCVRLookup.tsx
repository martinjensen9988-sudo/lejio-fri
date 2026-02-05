import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';

export interface CVRData {
  cvr: string;
  companyName: string;
  address?: string;
  city?: string;
  postalCode?: string;
  status?: string;
  companyType?: string;
  startDate?: string;
  isActive: boolean;
  phone?: string;
  email?: string;
  industry?: string;
  vatRegistered: boolean;
  vatNumber?: string;
}

interface UseCVRLookupReturn {
  data: CVRData | null;
  isLoading: boolean;
  error: string | null;
  isCompanyActive: boolean;
  lookupCVR: (cvr: string) => Promise<CVRData | null>;
  reset: () => void;
}

export const useCVRLookup = (): UseCVRLookupReturn => {
  const [data, setData] = useState<CVRData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupCVR = useCallback(async (cvr: string): Promise<CVRData | null> => {
    const cleanCvr = cvr.replace(/\D/g, '');
    
    if (cleanCvr.length !== 8) {
      setError('CVR-nummer skal være 8 cifre');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: responseData, error: invokeError } = await supabase.functions.invoke('cvr-lookup', {
        body: { cvr: cleanCvr },
      });

      if (invokeError) {
        console.error('CVR lookup invoke error:', invokeError);
        setError('Kunne ikke slå CVR op');
        setData(null);
        return null;
      }

      // Check for error in response (including inactive company)
      if (responseData?.error) {
        setError(responseData.error);
        // Still set and return data if we have company info (for display purposes)
        // This is important for sales leads where we want the data even for inactive companies
        if (responseData.cvr) {
          const cvrData = responseData as CVRData;
          setData(cvrData);
          return cvrData;
        }
        setData(null);
        return null;
      }

      const cvrData = responseData as CVRData;
      setData(cvrData);
      return cvrData;
    } catch (err) {
      console.error('CVR lookup error:', err);
      setError('Der opstod en fejl ved CVR-opslag');
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { 
    data, 
    isLoading, 
    error, 
    isCompanyActive: data?.isActive ?? false,
    lookupCVR, 
    reset 
  };
};
