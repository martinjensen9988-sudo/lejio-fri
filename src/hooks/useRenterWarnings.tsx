import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type WarningReason = 
  | 'damage'
  | 'non_payment'
  | 'contract_violation'
  | 'fraud'
  | 'reckless_driving'
  | 'late_return'
  | 'cleanliness'
  | 'other';

export type WarningStatus = 'active' | 'under_review' | 'dismissed' | 'expired';
export type AppealStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';

export interface RenterWarning {
  id: string;
  renter_email: string;
  renter_phone: string | null;
  renter_license_number: string | null;
  renter_name: string | null;
  reported_by: string;
  booking_id: string | null;
  reason: WarningReason;
  description: string;
  severity: number;
  damage_amount: number;
  unpaid_amount: number;
  status: WarningStatus;
  expires_at: string;
  created_at: string;
}

export interface WarningAppeal {
  id: string;
  warning_id: string;
  appellant_email: string;
  appellant_name: string | null;
  appeal_reason: string;
  supporting_info: string | null;
  status: AppealStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateWarningInput {
  renter_email: string;
  renter_phone?: string;
  renter_license_number?: string;
  renter_name?: string;
  booking_id?: string;
  reason: WarningReason;
  description: string;
  severity?: number;
  damage_amount?: number;
  unpaid_amount?: number;
}

export const WARNING_REASON_LABELS: Record<WarningReason, string> = {
  damage: 'Skade på køretøj',
  non_payment: 'Manglende betaling',
  contract_violation: 'Kontraktbrud',
  fraud: 'Svindel',
  reckless_driving: 'Vanvidskørsel',
  late_return: 'Forsinket aflevering',
  cleanliness: 'Manglende rengøring',
  other: 'Anden årsag',
};

export const WARNING_STATUS_LABELS: Record<WarningStatus, string> = {
  active: 'Aktiv',
  under_review: 'Under behandling',
  dismissed: 'Afvist',
  expired: 'Udløbet',
};

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  pending: 'Afventer',
  reviewing: 'Under behandling',
  approved: 'Godkendt',
  rejected: 'Afvist',
};

export const useRenterWarnings = () => {
  const { user, profile } = useAuth();
  const [warnings, setWarnings] = useState<RenterWarning[]>([]);
  const [myReportedWarnings, setMyReportedWarnings] = useState<RenterWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWarnings = async () => {
    if (!user) {
      setWarnings([]);
      setMyReportedWarnings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all active warnings (for checking renters)
      const { data: activeWarnings, error: activeError } = await supabase
        .from('renter_warnings')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;
      setWarnings((activeWarnings || []) as RenterWarning[]);

      // Fetch my reported warnings
      const { data: myWarnings, error: myError } = await supabase
        .from('renter_warnings')
        .select('*')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });

      if (myError) throw myError;
      setMyReportedWarnings((myWarnings || []) as RenterWarning[]);
    } catch (err) {
      console.error('Error fetching warnings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Secure check using RPC function - returns summary without exposing PII
  const checkRenterSummary = async (
    email?: string,
    phone?: string,
    licenseNumber?: string
  ): Promise<{ hasWarnings: boolean; warningCount: number; maxSeverity: number; reasons: string[] } | null> => {
    if (!email && !phone && !licenseNumber) return null;

    try {
      const { data, error } = await supabase.rpc('check_renter_warnings', {
        p_email: email || null,
        p_phone: phone || null,
        p_license_number: licenseNumber || null,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          hasWarnings: data[0].has_warnings,
          warningCount: data[0].warning_count,
          maxSeverity: data[0].max_severity,
          reasons: data[0].reasons || [],
        };
      }
      return { hasWarnings: false, warningCount: 0, maxSeverity: 0, reasons: [] };
    } catch (err) {
      console.error('Error checking renter:', err);
      return null;
    }
  };

  // Get detailed warnings for a renter (only works if lessor has an active booking with them)
  const getRenterWarningDetails = async (
    renterEmail: string
  ): Promise<RenterWarning[]> => {
    if (!renterEmail) return [];

    try {
      const { data, error } = await supabase.rpc('get_renter_warning_details', {
        p_renter_email: renterEmail,
      });

      if (error) {
        // Access denied is expected if no booking relationship exists
        if (error.message.includes('Access denied')) {
          console.log('No booking relationship with renter, cannot view details');
          return [];
        }
        throw error;
      }
      
      // Map RPC result to RenterWarning format (partial data)
      return (data || []).map((d: unknown) => ({
        id: d.id,
        renter_email: renterEmail,
        renter_phone: null,
        renter_license_number: null,
        renter_name: null,
        reported_by: '',
        booking_id: null,
        reason: d.reason as WarningReason,
        description: d.description,
        severity: d.severity,
        damage_amount: d.damage_amount || 0,
        unpaid_amount: d.unpaid_amount || 0,
        status: 'active' as WarningStatus,
        expires_at: '',
        created_at: d.created_at,
      }));
    } catch (err) {
      console.error('Error getting renter warning details:', err);
      return [];
    }
  };

  // Legacy checkRenter that uses the summary for compatibility
  const checkRenter = async (
    email?: string,
    phone?: string,
    licenseNumber?: string
  ): Promise<RenterWarning[]> => {
    // For backwards compatibility, use the secure summary first
    const summary = await checkRenterSummary(email, phone, licenseNumber);
    
    if (!summary || !summary.hasWarnings) return [];
    
    // Try to get details if we have a booking relationship
    if (email) {
      const details = await getRenterWarningDetails(email);
      if (details.length > 0) return details;
    }
    
    // Return a synthetic warning with summary info if no details available
    return [{
      id: 'summary',
      renter_email: email || '',
      renter_phone: phone || null,
      renter_license_number: licenseNumber || null,
      renter_name: null,
      reported_by: '',
      booking_id: null,
      reason: (summary.reasons[0] as WarningReason) || 'other',
      description: `Denne lejer har ${summary.warningCount} aktiv(e) advarsel(er). Kontakt LEJIO support for detaljer.`,
      severity: summary.maxSeverity,
      damage_amount: 0,
      unpaid_amount: 0,
      status: 'active' as WarningStatus,
      expires_at: '',
      created_at: new Date().toISOString(),
    }];
  };

  const createWarning = async (input: CreateWarningInput): Promise<RenterWarning | null> => {
    if (!user) {
      toast.error('Du skal være logget ind');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('renter_warnings')
        .insert({
          ...input,
          reported_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification email
      try {
        const lessorName = profile?.company_name || profile?.full_name || 'En udlejer';
        const appealUrl = `${window.location.origin}/appeal/${data.id}`;
        
        await supabase.functions.invoke('send-warning-notification', {
          body: {
            renterEmail: input.renter_email,
            renterName: input.renter_name || 'Lejer',
            warningId: data.id,
            reason: input.reason,
            lessorName,
            appealUrl,
          },
        });
      } catch (emailErr) {
        console.error('Error sending notification email:', emailErr);
        // Don't fail the whole operation if email fails
      }

      toast.success('Advarsel oprettet og lejer er notificeret');
      await fetchWarnings();
      return data as RenterWarning;
    } catch (err) {
      console.error('Error creating warning:', err);
      toast.error('Kunne ikke oprette advarsel');
      return null;
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [user]);

  return {
    warnings,
    myReportedWarnings,
    isLoading,
    createWarning,
    checkRenter,
    checkRenterSummary,
    getRenterWarningDetails,
    refetch: fetchWarnings,
  };
};
