import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';

interface DriverLicenseStatus {
  status: 'none' | 'pending' | 'verified' | 'rejected';
  licenseNumber: string | null;
  licenseCountry: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

export const useDriverLicenseStatus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getLicenseStatusByEmail = useCallback(async (email: string): Promise<DriverLicenseStatus | null> => {
    if (!email) return null;

    setIsLoading(true);
    try {
      // First get the user ID from profiles by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        return { status: 'none', licenseNumber: null, licenseCountry: null, verifiedAt: null, rejectionReason: null };
      }

      // Then get the license status
      const { data: license, error: licenseError } = await supabase
        .from('driver_licenses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (licenseError || !license) {
        return { status: 'none', licenseNumber: null, licenseCountry: null, verifiedAt: null, rejectionReason: null };
      }

      const statusMap: Record<string, DriverLicenseStatus['status']> = {
        'verified': 'verified',
        'pending': 'pending',
        'pending_review': 'pending',
        'rejected': 'rejected',
      };

      return {
        status: statusMap[license.verification_status] || 'none',
        licenseNumber: license.license_number,
        licenseCountry: license.license_country,
        verifiedAt: license.verified_at,
        rejectionReason: license.rejection_reason,
      };
    } catch (error) {
      console.error('Error fetching license status:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLicenseStatusByUserId = useCallback(async (userId: string): Promise<DriverLicenseStatus | null> => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const { data: license, error } = await supabase
        .from('driver_licenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !license) {
        return { status: 'none', licenseNumber: null, licenseCountry: null, verifiedAt: null, rejectionReason: null };
      }

      const statusMap: Record<string, DriverLicenseStatus['status']> = {
        'verified': 'verified',
        'pending': 'pending',
        'pending_review': 'pending',
        'rejected': 'rejected',
      };

      return {
        status: statusMap[license.verification_status] || 'none',
        licenseNumber: license.license_number,
        licenseCountry: license.license_country,
        verifiedAt: license.verified_at,
        rejectionReason: license.rejection_reason,
      };
    } catch (error) {
      console.error('Error fetching license status:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    getLicenseStatusByEmail,
    getLicenseStatusByUserId,
  };
};
