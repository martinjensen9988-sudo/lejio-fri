import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { useBookings } from '@/hooks/useBookings';
import { supabase } from '@/integrations/azure/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SmartBookingCalendar from '@/components/dashboard/SmartBookingCalendar';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const CalendarPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleReschedule = async (bookingId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;
      await refetchBookings();
      toast.success('Booking opdateret');
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      throw error;
    }
  };

  const handleEdit = (bookingId: string) => {
    navigate(`/dashboard/bookings/${bookingId}/edit`);
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
      await refetchBookings();
      toast.success('Booking annulleret');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Kunne ikke annullere booking');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout activeTab="calendar">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Booking-kalender</h2>
            <p className="text-muted-foreground">Visuelt overblik over alle dine bookinger med drag-and-drop</p>
          </div>
          <Button onClick={() => navigate('/dashboard/bookings/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Ny booking
          </Button>
        </div>
        {bookingsLoading || vehiclesLoading ? (
          <Skeleton className="h-[600px] rounded-2xl" />
        ) : (
          <SmartBookingCalendar
            bookings={bookings}
            vehicles={vehicles}
            onReschedule={handleReschedule}
            onEdit={handleEdit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
