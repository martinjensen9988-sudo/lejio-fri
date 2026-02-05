import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, Search, Download, Loader2, TrendingUp, 
  Users, Car, DollarSign, ArrowUpDown, FileSpreadsheet
} from 'lucide-react';

interface LessorBookingStats {
  lessor_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  user_type: string;
  total_bookings: number;
  total_revenue: number;
  monthly_bookings: number;
  monthly_revenue: number;
  last_booking_date: string | null;
}

interface BookingForExport {
  id: string;
  lessor_id: string;
  lessor_email: string;
  lessor_name: string;
  renter_name: string | null;
  renter_email: string | null;
  vehicle_registration: string;
  vehicle_make: string;
  vehicle_model: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
}

type SortField = 'total_bookings' | 'total_revenue' | 'monthly_bookings' | 'email';
type SortDirection = 'asc' | 'desc';

const AdminBookingStats = () => {
  const [stats, setStats] = useState<LessorBookingStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_bookings');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<'all' | 'month' | 'year'>('month');

  const fetchStats = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, user_type');

      if (profilesError) throw profilesError;

      // Fetch all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('lessor_id, total_price, created_at');

      if (bookingsError) throw bookingsError;

      // Calculate current month start
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate stats per lessor
      const lessorStats: LessorBookingStats[] = (profiles || []).map(profile => {
        const lessorBookings = (bookings || []).filter(b => b.lessor_id === profile.id);
        const monthlyBookings = lessorBookings.filter(b => 
          new Date(b.created_at) >= monthStart
        );

        const sortedBookings = [...lessorBookings].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return {
          lessor_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          company_name: profile.company_name,
          user_type: profile.user_type,
          total_bookings: lessorBookings.length,
          total_revenue: lessorBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
          monthly_bookings: monthlyBookings.length,
          monthly_revenue: monthlyBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
          last_booking_date: sortedBookings[0]?.created_at || null,
        };
      });

      setStats(lessorStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Kunne ikke hente statistik');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedStats = useMemo(() => {
    let filtered = stats.filter(s => 
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Only show users with at least 1 booking (or all if search is active)
    if (!searchQuery) {
      filtered = filtered.filter(s => s.total_bookings > 0);
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'total_bookings':
          comparison = a.total_bookings - b.total_bookings;
          break;
        case 'total_revenue':
          comparison = a.total_revenue - b.total_revenue;
          break;
        case 'monthly_bookings':
          comparison = a.monthly_bookings - b.monthly_bookings;
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [stats, searchQuery, sortField, sortDirection]);

  const exportToCSV = async () => {
    setIsExporting(true);
    
    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date | null = null;
      
      if (exportDateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (exportDateRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      // Fetch bookings with vehicle data
      let query = supabase
        .from('bookings')
        .select(`
          id, lessor_id, renter_name, renter_email, 
          start_date, end_date, total_price, status, created_at,
          vehicle:vehicles(registration, make, model)
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: bookings, error: bookingsError } = await query;
      if (bookingsError) throw bookingsError;

      // Get lessor profiles
      const lessorIds = [...new Set((bookings || []).map(b => b.lessor_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name')
        .in('id', lessorIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Build export data
      const exportData: BookingForExport[] = (bookings || []).map(b => {
        const profile = profileMap.get(b.lessor_id);
        const vehicle = b.vehicle as { registration: string; make: string; model: string } | null;
        return {
          id: b.id,
          lessor_id: b.lessor_id,
          lessor_email: profile?.email || '',
          lessor_name: profile?.full_name || profile?.company_name || '',
          renter_name: b.renter_name,
          renter_email: b.renter_email,
          vehicle_registration: vehicle?.registration || '',
          vehicle_make: vehicle?.make || '',
          vehicle_model: vehicle?.model || '',
          start_date: b.start_date,
          end_date: b.end_date,
          total_price: b.total_price,
          status: b.status,
          created_at: b.created_at,
        };
      });

      // Convert to CSV
      const headers = [
        'Booking ID', 'Udlejer Email', 'Udlejer Navn', 
        'Lejer Navn', 'Lejer Email',
        'Nummerplade', 'Mærke', 'Model',
        'Start Dato', 'Slut Dato', 'Pris (DKK)', 'Status', 'Oprettet'
      ];

      const rows = exportData.map(b => [
        b.id,
        b.lessor_email,
        b.lessor_name,
        b.renter_name || '',
        b.renter_email || '',
        b.vehicle_registration,
        b.vehicle_make,
        b.vehicle_model,
        b.start_date,
        b.end_date,
        b.total_price.toString(),
        b.status,
        format(new Date(b.created_at), 'yyyy-MM-dd HH:mm')
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');

      // Download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lejio-bookings-${format(now, 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Eksporterede ${exportData.length} bookinger`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Kunne ikke eksportere data');
    } finally {
      setIsExporting(false);
    }
  };

  const totals = useMemo(() => ({
    totalBookings: stats.reduce((sum, s) => sum + s.total_bookings, 0),
    totalRevenue: stats.reduce((sum, s) => sum + s.total_revenue, 0),
    monthlyBookings: stats.reduce((sum, s) => sum + s.monthly_bookings, 0),
    monthlyRevenue: stats.reduce((sum, s) => sum + s.monthly_revenue, 0),
    activeLessors: stats.filter(s => s.total_bookings > 0).length,
  }), [stats]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totals.totalBookings}</p>
                <p className="text-xs text-muted-foreground">Bookinger i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{totals.totalRevenue.toLocaleString('da-DK')} kr</p>
                <p className="text-xs text-muted-foreground">Total omsætning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-warm" />
              <div>
                <p className="text-2xl font-bold">{totals.monthlyBookings}</p>
                <p className="text-xs text-muted-foreground">Denne måned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{totals.monthlyRevenue.toLocaleString('da-DK')} kr</p>
                <p className="text-xs text-muted-foreground">Månedlig omsætning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totals.activeLessors}</p>
                <p className="text-xs text-muted-foreground">Aktive udlejere</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Eksporter bookingdata
              </CardTitle>
              <CardDescription>Download alle bookinger som CSV-fil</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={exportDateRange} onValueChange={(v: 'all' | 'month' | 'year') => setExportDateRange(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Denne måned</SelectItem>
                  <SelectItem value="year">Dette år</SelectItem>
                  <SelectItem value="all">Alle bookinger</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Eksporter CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Booking-statistik per udlejer</CardTitle>
              <CardDescription>Oversigt over alle udlejeres aktivitet</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søg udlejere..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('email')}
                    className="font-semibold -ml-4"
                  >
                    Udlejer
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('total_bookings')}
                    className="font-semibold"
                  >
                    Bookinger i alt
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('total_revenue')}
                    className="font-semibold"
                  >
                    Total omsætning
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('monthly_bookings')}
                    className="font-semibold"
                  >
                    Denne måned
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>Seneste booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStats.map((stat) => (
                <TableRow key={stat.lessor_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{stat.full_name || stat.company_name || 'Ukendt'}</p>
                      <p className="text-sm text-muted-foreground">{stat.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {stat.user_type === 'professionel' ? 'Forhandler' : 'Privat'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{stat.total_bookings}</span>
                  </TableCell>
                  <TableCell>
                    {stat.total_revenue.toLocaleString('da-DK')} kr
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-semibold">{stat.monthly_bookings}</span>
                      <span className="text-muted-foreground text-sm ml-1">
                        ({stat.monthly_revenue.toLocaleString('da-DK')} kr)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {stat.last_booking_date ? (
                      format(new Date(stat.last_booking_date), 'dd. MMM yyyy', { locale: da })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Ingen udlejere fundet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingStats;
