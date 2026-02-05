import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CorporateAccount {
  id: string;
  company_name: string;
  cvr_number: string;
  ean_number: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  monthly_budget: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  commission_rate: number;
  status: 'active' | 'suspended' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export interface CorporateDepartment {
  id: string;
  corporate_account_id: string;
  name: string;
  cost_center_code: string | null;
  monthly_budget: number | null;
}

export interface CorporateEmployee {
  id: string;
  corporate_account_id: string;
  department_id: string | null;
  user_id: string | null;
  employee_number: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  driver_license_verified: boolean;
  is_admin: boolean;
  is_active: boolean;
  department?: CorporateDepartment;
}

export interface CorporateFleetVehicle {
  id: string;
  corporate_account_id: string;
  vehicle_id: string;
  lessor_id: string;
  assigned_department_id: string | null;
  monthly_rate: number;
  included_km_per_month: number;
  extra_km_rate: number;
  is_exclusive: boolean;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'paused' | 'terminated';
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    registration_number: string;
    image_url: string | null;
  };
}

export interface CorporateBooking {
  id: string;
  corporate_account_id: string;
  corporate_employee_id: string;
  department_id: string | null;
  fleet_vehicle_id: string | null;
  booking_id: string;
  purpose: string | null;
  destination: string | null;
  km_driven: number | null;
  cost_allocated: number | null;
  created_at: string;
  employee?: CorporateEmployee;
  vehicle?: CorporateFleetVehicle;
}

export interface CorporateInvoice {
  id: string;
  corporate_account_id: string;
  invoice_number: string;
  invoice_period_start: string;
  invoice_period_end: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  total_km_driven: number;
  total_bookings: number;
  line_items: unknown[];
  department_breakdown: unknown[];
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
}

export interface CorporateUsageStats {
  id: string;
  corporate_account_id: string;
  period_month: string;
  total_bookings: number;
  total_km_driven: number;
  total_cost: number;
  co2_emissions_kg: number;
  avg_utilization_rate: number;
  department_stats: Record<string, unknown>;
}

export const useCorporateFleet = () => {
  const { user } = useAuth();
  const [corporateAccount, setCorporateAccount] = useState<CorporateAccount | null>(null);
  const [departments, setDepartments] = useState<CorporateDepartment[]>([]);
  const [employees, setEmployees] = useState<CorporateEmployee[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<CorporateFleetVehicle[]>([]);
  const [bookings, setBookings] = useState<CorporateBooking[]>([]);
  const [invoices, setInvoices] = useState<CorporateInvoice[]>([]);
  const [usageStats, setUsageStats] = useState<CorporateUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<CorporateEmployee | null>(null);

  const fetchCorporateData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First, find if user is a corporate employee
      const { data: employeeData, error: employeeError } = await supabase
        .from('corporate_employees')
        .select('*, corporate_accounts(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (employeeError) throw employeeError;

      if (!employeeData) {
        setIsLoading(false);
        return;
      }

      setCurrentEmployee(employeeData as unknown as CorporateEmployee);
      setIsAdmin(employeeData.is_admin);
      setCorporateAccount(employeeData.corporate_accounts as unknown as CorporateAccount);

      const accountId = employeeData.corporate_account_id;

      // Fetch all related data in parallel
      const [depsRes, empsRes, vehiclesRes, bookingsRes, invoicesRes, statsRes] = await Promise.all([
        supabase.from('corporate_departments').select('*').eq('corporate_account_id', accountId),
        supabase.from('corporate_employees').select('*').eq('corporate_account_id', accountId).eq('is_active', true),
        supabase.from('corporate_fleet_vehicles').select('*').eq('corporate_account_id', accountId).eq('status', 'active'),
        supabase.from('corporate_bookings').select('*').eq('corporate_account_id', accountId).order('created_at', { ascending: false }).limit(100),
        employeeData.is_admin ? supabase.from('corporate_invoices').select('*').eq('corporate_account_id', accountId).order('invoice_period_start', { ascending: false }) : Promise.resolve({ data: [], error: null }),
        employeeData.is_admin ? supabase.from('corporate_usage_stats').select('*').eq('corporate_account_id', accountId).order('period_month', { ascending: false }).limit(12) : Promise.resolve({ data: [], error: null }),
      ]);

      if (depsRes.data) setDepartments(depsRes.data as CorporateDepartment[]);
      if (empsRes.data) setEmployees(empsRes.data as CorporateEmployee[]);
      if (vehiclesRes.data) setFleetVehicles(vehiclesRes.data as CorporateFleetVehicle[]);
      if (bookingsRes.data) setBookings(bookingsRes.data as CorporateBooking[]);
      if (invoicesRes.data) setInvoices(invoicesRes.data as CorporateInvoice[]);
      if (statsRes.data) setUsageStats(statsRes.data as CorporateUsageStats[]);

    } catch (error) {
      console.error('Error fetching corporate data:', error);
      toast.error('Kunne ikke hente virksomhedsdata');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCorporateData();
  }, [fetchCorporateData]);

  const createBooking = async (vehicleId: string, purpose?: string, destination?: string) => {
    if (!currentEmployee || !corporateAccount) {
      toast.error('Du er ikke tilknyttet en virksomhedskonto');
      return null;
    }

    try {
      // Find the fleet vehicle
      const fleetVehicle = fleetVehicles.find(v => v.vehicle_id === vehicleId);
      
      const { data, error } = await supabase
        .from('corporate_bookings')
        .insert({
          corporate_account_id: corporateAccount.id,
          corporate_employee_id: currentEmployee.id,
          department_id: currentEmployee.department_id,
          fleet_vehicle_id: fleetVehicle?.id,
          booking_id: crypto.randomUUID(), // Will be linked to actual booking
          purpose,
          destination,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Booking oprettet');
      await fetchCorporateData();
      return data;
    } catch (error) {
      console.error('Error creating corporate booking:', error);
      toast.error('Kunne ikke oprette booking');
      return null;
    }
  };

  const addDepartment = async (name: string, costCenterCode?: string, budget?: number) => {
    if (!corporateAccount || !isAdmin) {
      toast.error('Du har ikke adgang til at oprette afdelinger');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('corporate_departments')
        .insert({
          corporate_account_id: corporateAccount.id,
          name,
          cost_center_code: costCenterCode,
          monthly_budget: budget,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Afdeling oprettet');
      await fetchCorporateData();
      return data;
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Kunne ikke oprette afdeling');
      return null;
    }
  };

  const addEmployee = async (employee: { full_name: string; email: string; phone?: string; employee_number?: string; department_id?: string | null; is_admin?: boolean }) => {
    if (!corporateAccount || !isAdmin) {
      toast.error('Du har ikke adgang til at tilføje medarbejdere');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('corporate_employees')
        .insert({
          corporate_account_id: corporateAccount.id,
          full_name: employee.full_name,
          email: employee.email,
          phone: employee.phone,
          employee_number: employee.employee_number,
          department_id: employee.department_id,
          is_admin: employee.is_admin || false,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Medarbejder tilføjet');
      await fetchCorporateData();
      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Kunne ikke tilføje medarbejder');
      return null;
    }
  };

  const updateEmployee = async (employeeId: string, updates: Partial<CorporateEmployee>) => {
    if (!isAdmin) {
      toast.error('Du har ikke adgang til at redigere medarbejdere');
      return false;
    }

    try {
      const { error } = await supabase
        .from('corporate_employees')
        .update(updates)
        .eq('id', employeeId);

      if (error) throw error;
      
      toast.success('Medarbejder opdateret');
      await fetchCorporateData();
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Kunne ikke opdatere medarbejder');
      return false;
    }
  };

  const getFleetUtilization = () => {
    if (fleetVehicles.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentBookings = bookings.filter(b => new Date(b.created_at) >= thirtyDaysAgo);
    const vehiclesUsed = new Set(recentBookings.map(b => b.fleet_vehicle_id)).size;
    
    return Math.round((vehiclesUsed / fleetVehicles.length) * 100);
  };

  const getTotalMonthlySpend = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthStats = usageStats.find(s => s.period_month.startsWith(currentMonth));
    return monthStats?.total_cost || 0;
  };

  const getDepartmentSpend = (departmentId: string) => {
    return bookings
      .filter(b => b.department_id === departmentId)
      .reduce((sum, b) => sum + (b.cost_allocated || 0), 0);
  };

  return {
    corporateAccount,
    departments,
    employees,
    fleetVehicles,
    bookings,
    invoices,
    usageStats,
    isLoading,
    isAdmin,
    currentEmployee,
    createBooking,
    addDepartment,
    addEmployee,
    updateEmployee,
    getFleetUtilization,
    getTotalMonthlySpend,
    getDepartmentSpend,
    refetch: fetchCorporateData,
  };
};
