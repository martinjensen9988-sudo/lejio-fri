import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Vehicle, CreateVehicleInput } from '@/hooks/useFriVehicles';

interface FriVehicleFormProps {
  vehicle?: Vehicle | null;
  onSubmit: (data: CreateVehicleInput) => Promise<void>;
  onCancel: () => void;
}

export function FriVehicleForm({ vehicle, onSubmit, onCancel }: FriVehicleFormProps) {
  const [formData, setFormData] = useState<CreateVehicleInput>({
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year,
    license_plate: vehicle?.license_plate || '',
    vin: vehicle?.vin,
    daily_rate: vehicle?.daily_rate,
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
      setError(err instanceof Error ? err.message : 'Error saving vehicle');
    } finally {
      setLoading(false);
    }
  };

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
          {vehicle ? 'Rediger køretøj' : 'Tilføj nyt køretøj'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Køretøjsoplysninger</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mærke *
                </label>
                <Input
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="f.eks. Toyota"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="f.eks. Camry"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  År
                </label>
                <Input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nummerplade *
                </label>
                <Input
                  value={formData.license_plate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      license_plate: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="AB12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN (Stelnummer)
                </label>
                <Input
                  value={formData.vin || ''}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="f.eks. WVWZZZ3C94WE12345"
                />
              </div>
            </div>

            {/* Rental Info */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Udlejningsinformation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dagpris (kr.)
                  </label>
                  <Input
                    type="number"
                    step="50"
                    value={formData.daily_rate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daily_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="499"
                  />
                </div>

              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end border-t pt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Annuller
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Gemmer...' : 'Gem køretøj'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
