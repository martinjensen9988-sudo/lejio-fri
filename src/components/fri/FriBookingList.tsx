import { useFriBookings, Booking, CreateBookingInput } from '@/hooks/useFriBookings';
import { useFriVehicles } from '@/hooks/useFriVehicles';
import { useState } from 'react';
import { AlertCircle, Trash2, Edit2, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FriBookingForm } from './FriBookingForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FriBookingListProps {
  lessorId: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabel: Record<string, string> = {
  pending: 'Afventer',
  confirmed: 'Bekræftet',
  completed: 'Afsluttet',
  cancelled: 'Aflyst',
};

export function FriBookingList({ lessorId }: FriBookingListProps) {
  const { bookings, loading, error, addBooking, updateBooking, deleteBooking, updateStatus } =
    useFriBookings(lessorId);
  const { vehicles } = useFriVehicles(lessorId);

  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddBooking = async (data: CreateBookingInput) => {
    try {
      setFormError(null);
      await addBooking(data);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error adding booking');
    }
  };

  const handleUpdateBooking = async (data: CreateBookingInput) => {
    try {
      setFormError(null);
      if (!editingBooking) return;
      await updateBooking(editingBooking.id, data);
      setEditingBooking(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error updating booking');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      setFormError(null);
      await deleteBooking(id);
      setDeleteId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error deleting booking');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    try {
      setFormError(null);
      await updateStatus(id, newStatus);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error updating status');
    }
  };

  if (showForm || editingBooking) {
    return (
      <FriBookingForm
        booking={editingBooking}
        vehicles={vehicles}
        onSubmit={editingBooking ? handleUpdateBooking : handleAddBooking}
        onCancel={() => {
          setShowForm(false);
          setEditingBooking(null);
        }}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-8">Indlæser bookinger...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Bookinger</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Ny booking
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fejl ved indlæsning</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Ingen bookinger endnu</p>
          <Button onClick={() => setShowForm(true)}>Opret første booking</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            const days = Math.max(
              1,
              Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{booking.customer_name}</h3>
                    <Badge className={statusColors[booking.status]}>
                      {statusLabel[booking.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <p className="text-gray-500">Køretøj</p>
                      <p className="font-semibold text-gray-900">
                        {booking.vehicle_make} {booking.vehicle_model}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Fra dato</p>
                      <p className="font-semibold text-gray-900">
                        {startDate.toLocaleDateString('da-DK')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Til dato</p>
                      <p className="font-semibold text-gray-900">
                        {endDate.toLocaleDateString('da-DK')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Dage</p>
                      <p className="font-semibold text-gray-900">{days} dage</p>
                    </div>

                    {booking.total_price && (
                      <div>
                        <p className="text-gray-500">Pris</p>
                        <p className="font-semibold text-gray-900">
                          kr. {booking.total_price.toLocaleString('da-DK')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      <span className="text-gray-500">Email:</span>{' '}
                      <a href={`mailto:${booking.customer_email}`} className="text-blue-600 hover:underline">
                        {booking.customer_email}
                      </a>
                    </p>
                    <p>
                      <span className="text-gray-500">Telefon:</span>{' '}
                      <a href={`tel:${booking.customer_phone}`} className="text-blue-600 hover:underline">
                        {booking.customer_phone}
                      </a>
                    </p>
                    {booking.notes && (
                      <p className="text-gray-600 italic mt-1">Noter: {booking.notes}</p>
                    )}
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        className="text-xs"
                      >
                        Bekræft
                      </Button>
                    )}
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(booking.id, 'completed')}
                        className="text-xs"
                      >
                        Afslut
                      </Button>
                    )}
                    {booking.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Aflys
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingBooking(booking)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(booking.id)}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette denne booking? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && handleDeleteBooking(deleteId)}
            >
              Slet
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
