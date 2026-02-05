import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Booking, CreateBookingInput } from '@/hooks/useFriBookings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FriBookingFormProps {
  booking?: Booking | null;
  vehicles: Array<{ id: string; make: string; model: string; license_plate: string }>;
  onSubmit: (data: CreateBookingInput) => Promise<void>;
  onCancel: () => void;
}

export function FriBookingForm({
  booking,
  vehicles,
  onSubmit,
  onCancel,
}: FriBookingFormProps) {
  const [formData, setFormData] = useState<CreateBookingInput>({
    vehicle_id: booking?.vehicle_id || '',
    customer_name: booking?.customer_name || '',
    customer_email: booking?.customer_email || '',
    customer_phone: booking?.customer_phone || '',
    start_date: booking?.start_date || '',
    end_date: booking?.end_date || '',
    total_price: booking?.total_price,
    notes: booking?.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving booking');
    } finally {
      setLoading(false);
    }
  };

  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);
  const days =
    formData.start_date && formData.end_date
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">
          {booking ? 'Rediger booking' : 'Opret ny booking'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookingoplysninger</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Køretøj *
              </label>
              <Select value={formData.vehicle_id} onValueChange={(value) =>
                setFormData({ ...formData, vehicle_id: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Kundeoplysninger</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Navn *
                  </label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    placeholder="Kunde navn"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                    placeholder="kunde@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                    placeholder="+45 XX XX XX XX"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rental Dates */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Udlejningsperiode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start dato *
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slut dato *
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              {days > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Udlejningsperiode: <span className="font-semibold">{days} dage</span>
                </p>
              )}
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Pris</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Samlet pris (kr.)
                </label>
                <Input
                  type="number"
                  step="50"
                  value={formData.total_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_price: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Noter
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Specielle betingelser, notes, osv."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuller
              </Button>
              <Button type="submit" disabled={loading || !formData.vehicle_id}>
                {loading ? 'Gemmer...' : 'Gem booking'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
