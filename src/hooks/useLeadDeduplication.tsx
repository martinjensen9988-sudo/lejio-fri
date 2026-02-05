import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useToast } from '@/hooks/use-toast';
import { SalesLead } from './useSalesLeads';

export interface DuplicatePair {
  lead1: SalesLead;
  lead2: SalesLead;
  matchScore: number; // 0-100
  matchReasons: string[];
}

export const useLeadDeduplication = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const { toast } = useToast();

  // Find duplicate leads
  const findDuplicates = useCallback(async (leads: SalesLead[]): Promise<DuplicatePair[]> => {
    setIsLoading(true);
    const foundDuplicates: DuplicatePair[] = [];

    try {
      for (let i = 0; i < leads.length; i++) {
        for (let j = i + 1; j < leads.length; j++) {
          const pair = compareSalesLeads(leads[i], leads[j]);
          if (pair.matchScore >= 70) {
            foundDuplicates.push(pair);
          }
        }
      }

      setDuplicates(foundDuplicates);
      return foundDuplicates;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Merge two leads into one
  const mergeLeads = useCallback(async (
    keepLeadId: string,
    mergeLeadId: string,
    mergedData?: Partial<SalesLead>
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // Update the lead to keep with merged data
      const { error: updateError } = await supabase
        .from('sales_leads')
        .update({
          ...mergedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', keepLeadId);

      if (updateError) throw updateError;

      // Move all related activities to the kept lead
      await supabase
        .from('crm_activities')
        .update({ lead_id: keepLeadId })
        .eq('lead_id', mergeLeadId);

      // Delete the duplicate lead
      const { error: deleteError } = await supabase
        .from('sales_leads')
        .delete()
        .eq('id', mergeLeadId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Leads flettet',
        description: 'Duplicerede leads er blevet flettet',
      });

      return true;
    } catch (error) {
      console.error('Error merging leads:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke flette leads',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Warn about duplicates when adding new lead
  const checkForDuplicateWarning = (newLead: Partial<SalesLead>, existingLeads: SalesLead[]): DuplicatePair | null => {
    for (const existingLead of existingLeads) {
      const score = calculateMatchScore(
        newLead as SalesLead,
        existingLead
      ).score;
      
      if (score >= 70) {
        return {
          lead1: newLead as SalesLead,
          lead2: existingLead,
          matchScore: score,
          matchReasons: getMatchReasons(newLead as SalesLead, existingLead),
        };
      }
    }
    return null;
  };

  return {
    isLoading,
    duplicates,
    findDuplicates,
    mergeLeads,
    checkForDuplicateWarning,
  };
};

// Compare two leads and return match info
function compareSalesLeads(lead1: SalesLead, lead2: SalesLead): DuplicatePair {
  const { score, reasons } = calculateMatchScore(lead1, lead2);
  
  return {
    lead1,
    lead2,
    matchScore: score,
    matchReasons: reasons,
  };
}

// Calculate similarity score between two leads
function calculateMatchScore(lead1: SalesLead, lead2: SalesLead): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // CVR Number match (100% confidence)
  if (lead1.cvr_number && lead2.cvr_number && lead1.cvr_number === lead2.cvr_number) {
    score += 40;
    reasons.push('Samme CVR-nummer');
  }

  // Phone match (90% confidence)
  if (lead1.contact_phone && lead2.contact_phone && lead1.contact_phone === lead2.contact_phone) {
    score += 30;
    reasons.push('Samme telefonnummer');
  }

  // Email match (90% confidence)
  if (lead1.contact_email && lead2.contact_email && lead1.contact_email === lead2.contact_email) {
    score += 30;
    reasons.push('Samme email');
  }

  // Company name similarity (70% confidence)
  if (lead1.company_name && lead2.company_name) {
    const similarity = stringSimilarity(lead1.company_name, lead2.company_name);
    if (similarity >= 0.85) {
      score += 25;
      reasons.push('Samme firmanavn');
    } else if (similarity >= 0.7) {
      score += 10;
      reasons.push('Lignende firmanavn');
    }
  }

  // Address match (50% confidence)
  if (lead1.address && lead2.address && lead1.address === lead2.address) {
    score += 5;
    reasons.push('Samme adresse');
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}

// Get match reasons for display
function getMatchReasons(lead1: SalesLead, lead2: SalesLead): string[] {
  return calculateMatchScore(lead1, lead2).reasons;
}

// Simple string similarity algorithm (Levenshtein-inspired)
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const matches = [...s1].filter(c => s2.includes(c)).length;
  return matches / Math.max(s1.length, s2.length);
}
