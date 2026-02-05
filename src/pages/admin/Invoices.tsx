import { useState, useMemo } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useBookings } from '@/hooks/useBookings';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Search } from 'lucide-react';
import { format, parse } from 'date-fns';
import { da } from 'date-fns/locale';

const AdminInvoicesPage = () => {
  const { invoices, isLoading, generateInvoice, markAsPaid, cancelInvoice, refetch } = useInvoices();
  const { bookings } = useBookings();
  const [generating, setGenerating] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter bookings that don't have invoices yet
  const availableBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Check if booking already has an invoice
      const hasInvoice = invoices.some(inv => inv.booking_id === booking.id);
      
      // Include if no invoice and booking is completed or payment received
      if (!hasInvoice && (booking.status === 'completed' || booking.payment_received)) {
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            booking.renter_name?.toLowerCase().includes(query) ||
            booking.renter_email?.toLowerCase().includes(query) ||
            booking.vehicle?.registration?.toLowerCase().includes(query)
          );
        }
        return true;
      }
      return false;
    });
  }, [bookings, invoices, searchQuery]);

  const handleGenerate = async () => {
    if (!selectedBookingId) {
      alert('Vælg venligst en booking');
      return;
    }

    setGenerating(true);
    try {
      await generateInvoice(selectedBookingId);
      setSelectedBookingId('');
      setDialogOpen(false);
      await refetch();
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setGenerating(false);
    }
  };

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  return (
    <AdminDashboardLayout activeTab="invoices">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Fakturaer til udlejere</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Opret faktura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Opret ny faktura</DialogTitle>
              <DialogDescription>
                Vælg en booking for at generere en faktura
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg efter lejer, email eller registreringsnummer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Booking selector */}
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg en booking..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBookings.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {searchQuery ? 'Ingen bookinger matcher søgningen' : 'Ingen bookinger tilgængelige'}
                    </div>
                  ) : (
                    availableBookings.map(booking => (
                      <SelectItem key={booking.id} value={booking.id}>
                        <div className="flex flex-col">
                          <span>{booking.renter_name || 'Navnløs lejer'}</span>
                          <span className="text-xs text-muted-foreground">
                            {booking.vehicle?.registration} • {format(new Date(booking.start_date), 'dd/MM/yyyy', { locale: da })} → {format(new Date(booking.end_date), 'dd/MM/yyyy', { locale: da })}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Booking summary */}
              {selectedBooking && (
                <Card>
                  <CardContent className="pt-6 space-y-2 text-sm">
                    <div><strong>Lejer:</strong> {selectedBooking.renter_name}</div>
                    <div><strong>Email:</strong> {selectedBooking.renter_email}</div>
                    <div><strong>Bil:</strong> {selectedBooking.vehicle?.registration}</div>
                    <div><strong>Periode:</strong> {format(new Date(selectedBooking.start_date), 'dd/MM/yyyy', { locale: da })} - {format(new Date(selectedBooking.end_date), 'dd/MM/yyyy', { locale: da })}</div>
                    <div><strong>Beløb:</strong> {selectedBooking.total_price} DKK</div>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedBookingId || generating}
                  className="flex-1"
                >
                  {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {generating ? 'Genererer...' : 'Opret faktura'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Annuller
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Alle fakturaer</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Ingen fakturaer endnu. Opret en ved at klikke på "Opret faktura" ovenfor.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faktura nr.</TableHead>
                    <TableHead>Udlejer</TableHead>
                    <TableHead>Beløb</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Oprettet</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.lessor_id}</TableCell>
                      <TableCell>{inv.total_amount} {inv.currency}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                          inv.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {inv.status === 'paid' ? 'Betalt' : inv.status === 'unpaid' ? 'Ubetalt' : 'Sendt'}
                        </span>
                      </TableCell>
                      <TableCell>{inv.created_at?.slice(0,10)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => markAsPaid(inv.id)} 
                            disabled={inv.status === 'paid'}
                          >
                            Markér betalt
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => cancelInvoice(inv.id)} 
                            disabled={inv.status === 'cancelled'}
                          >
                            Annullér
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminInvoicesPage;
