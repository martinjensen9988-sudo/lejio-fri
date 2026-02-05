import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { CheckInOutWizard } from '@/components/checkinout/CheckInOutWizard';

const CheckInOutPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') as 'check_in' | 'check_out') || 'check_in';
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
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bookings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {mode === 'check_in' ? 'Ind-tjek' : 'Ud-tjek'}
            </h2>
            <p className="text-muted-foreground">
              {booking.vehicle?.make} {booking.vehicle?.model} • {booking.renter_name}
            </p>
          </div>
        </div>

        <CheckInOutWizard
          open={true}
          onOpenChange={(open) => {
            if (!open) navigate('/dashboard/bookings');
          }}
          mode={mode}
          booking={{
            id: booking.id,
            vehicle_id: booking.vehicle_id,
            lessor_id: booking.lessor_id,
            renter_id: booking.renter_id,
            vehicle: booking.vehicle ? {
              registration: booking.vehicle.registration,
              make: booking.vehicle.make,
              model: booking.vehicle.model,
            } : undefined,
          }}
          onComplete={() => navigate('/dashboard/bookings')}
        />
      </div>
    </DashboardLayout>
  );
};

export default CheckInOutPage;
