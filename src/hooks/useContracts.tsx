import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Contract {
  id: string;
  booking_id: string;
  vehicle_id: string;
  lessor_id: string;
  renter_id: string | null;
  contract_number: string;
  contract_type: 'standard' | 'business';
  vehicle_registration: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_vin: string | null;
  vehicle_value: number | null;
  start_date: string;
  end_date: string;
  daily_price: number;
  included_km: number;
  extra_km_price: number;
  total_price: number;
  deposit_amount: number | null;
  lessor_name: string;
  lessor_email: string;
  lessor_phone: string | null;
  lessor_address: string | null;
  lessor_company_name: string | null;
  lessor_cvr: string | null;
  renter_name: string;
  renter_email: string;
  renter_phone: string | null;
  renter_address: string | null;
  renter_street_address: string | null;
  renter_postal_code: string | null;
  renter_city: string | null;
  renter_license_number: string | null;
  renter_license_country: string | null;
  renter_license_issue_date: string | null;
  renter_birth_date: string | null;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  deductible_amount: number | null;
  deductible_insurance_selected: boolean;
  deductible_insurance_price: number | null;
  vanvidskørsel_accepted: boolean;
  vanvidskørsel_liability_amount: number | null;
  lessor_signature: string | null;
  lessor_signed_at: string | null;
  renter_signature: string | null;
  renter_signed_at: string | null;
  pdf_url: string | null;
  status: 'draft' | 'pending_renter_signature' | 'pending_lessor_signature' | 'signed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Roadside assistance
  roadside_assistance_provider: string | null;
  roadside_assistance_phone: string | null;
  // Fuel policy
  fuel_policy_enabled: boolean;
  fuel_missing_fee: number | null;
  fuel_price_per_liter: number | null;
  // Cleaning fees
  exterior_cleaning_fee: number | null;
  interior_cleaning_fee: number | null;
  // Logo
  logo_url: string | null;
  checked_in_at?: string | null;
  checkin_pin?: string | null;
}

export const useContracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContracts = async () => {
    if (!user) {
      setContracts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(contract => ({
        ...contract,
        contract_type: contract.contract_type as Contract['contract_type'],
        status: contract.status as Contract['status'],
      }));
      
      setContracts(typedData);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContract = async (bookingId: string, options?: { vehicleValue?: number; depositAmount?: number }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Du skal være logget ind');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: { 
          bookingId,
          vehicleValue: options?.vehicleValue,
          depositAmount: options?.depositAmount,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Kontrakt oprettet!');
      await fetchContracts();
      return data.contract as Contract;
    } catch (err) {
      console.error('Error generating contract:', err);
      toast.error('Kunne ikke oprette kontrakt');
      return null;
    }
  };

  const signContract = async (contractId: string, signature: string, acceptVanvidskorsel: boolean, role: 'lessor' | 'renter') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Du skal være logget ind');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('sign-contract', {
        body: { 
          contractId,
          signature,
          acceptVanvidskorsel,
          role,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Kontrakt underskrevet!');
      await fetchContracts();
      return data.contract as Contract;
    } catch (err) {
      console.error('Error signing contract:', err);
      toast.error('Kunne ikke underskrive kontrakt');
      return null;
    }
  };

  const getContractByBookingId = (bookingId: string) => {
    return contracts.find(c => c.booking_id === bookingId);
  };

  const downloadContractPdf = async (contract: Contract) => {
    if (!contract.pdf_url) {
      toast.error('Ingen PDF tilgængelig for denne kontrakt');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('contracts')
        .download(contract.pdf_url);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lejekontrakt-${contract.contract_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('Error downloading contract PDF:', err);
      toast.error('Kunne ikke downloade PDF');
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  return {
    contracts,
    isLoading,
    generateContract,
    signContract,
    getContractByBookingId,
    downloadContractPdf,
    refetch: fetchContracts,
  };
};
