import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { useBookings } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BookingsTable from '@/components/dashboard/BookingsTable';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Loader2, Plus } from 'lucide-react';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { vehicles } = useVehicles();
  const { bookings, isLoading: bookingsLoading, updateBookingStatus } = useBookings();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  return (
    <DashboardLayout activeTab="bookings">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Bookinger</h2>
            <p className="text-muted-foreground">{pendingBookings} afventer godkendelse</p>
          </div>
          <Button onClick={() => navigate('/dashboard/bookings/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Manuel booking
          </Button>
        </div>
        {bookingsLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <BookingsTable bookings={bookings} onUpdateStatus={updateBookingStatus} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookingsPage;
