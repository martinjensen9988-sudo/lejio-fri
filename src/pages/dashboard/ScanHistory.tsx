import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, Loader2 } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { VehicleScanHistory } from '@/components/damage/VehicleScanHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ScanHistoryPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings, isLoading } = useBookings();

  const booking = bookings.find(b => b.id === bookingId);

  if (isLoading) {
    return (
      <DashboardLayout activeTab="bookings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout activeTab="bookings">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Booking ikke fundet</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til bookinger
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="bookings">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6" />
              Skanningshistorik
            </h2>
            <p className="text-muted-foreground">
              {booking.vehicle?.make} {booking.vehicle?.model} • {booking.renter_name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrerede skanninger</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleScanHistory bookingId={bookingId!} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScanHistoryPage;
