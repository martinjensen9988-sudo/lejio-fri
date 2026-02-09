import React, { useState } from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFriBookings } from '@/hooks/useFriData';
import { Calendar, Search, Filter, Plus, Clock, CheckCircle, XCircle, Loader2, TrendingUp, Users, Car } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Afventer', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Bekræftet', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Aktiv', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Afsluttet', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Annulleret', color: 'bg-red-100 text-red-800' },
};

export function FriBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: bookings, isLoading } = useFriBookings(statusFilter === 'all' ? undefined : statusFilter);

  const filteredBookings = (bookings || []).filter((b: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.renter_name?.toLowerCase().includes(q) ||
      b.renter_email?.toLowerCase().includes(q) ||
      b.vehicle_info?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: bookings?.length || 0,
    active: bookings?.filter((b: any) => b.status === 'active').length || 0,
    pending: bookings?.filter((b: any) => b.status === 'pending').length || 0,
    revenue: bookings
      ?.filter((b: any) => b.status === 'completed')
      .reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0,
  };

  return (
    <FriDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brown-900">Bookinger</h1>
            <p className="text-gray-500 mt-1">Administrer alle dine reservationer</p>
          </div>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ny Booking
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Bookinger</p>
                  <p className="text-2xl font-bold text-brown-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Aktive Nu</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Car className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Afventer Svar</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Omsætning</p>
                  <p className="text-2xl font-bold text-brown-900 mt-1">kr {stats.revenue.toLocaleString('da-DK')}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Søg efter kunde, email eller køretøj..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 border-gray-200">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Alle status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle status</SelectItem>
                  <SelectItem value="pending">Afventer</SelectItem>
                  <SelectItem value="confirmed">Bekræftet</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="completed">Afsluttet</SelectItem>
                  <SelectItem value="cancelled">Annulleret</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-gray-100">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brown-900 mb-1">Ingen bookinger endnu</h3>
                <p className="text-gray-500 mb-4">Opret din første booking for at komme i gang</p>
                <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Opret Booking
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-600">Kunde</TableHead>
                    <TableHead className="text-gray-600">Køretøj</TableHead>
                    <TableHead className="text-gray-600">Periode</TableHead>
                    <TableHead className="text-gray-600">Pris</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-right text-gray-600">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking: any) => {
                    const status = statusLabels[booking.status] || statusLabels.pending;
                    return (
                      <TableRow key={booking.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-brown-900">{booking.renter_name || 'Ukendt'}</p>
                            <p className="text-sm text-gray-500">{booking.renter_email || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{booking.vehicle_info || `Køretøj ${booking.vehicle_id?.substring(0, 8)}`}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-brown-900">{booking.start_date ? new Date(booking.start_date).toLocaleDateString('da-DK') : '-'}</p>
                            <p className="text-gray-500">til {booking.end_date ? new Date(booking.end_date).toLocaleDateString('da-DK') : '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-brown-900">kr {(booking.total_price || 0).toLocaleString('da-DK')}</TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-pink-600">
                            Se detaljer
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </FriDashboardLayout>
  );
}

export default FriBookingsPage;
