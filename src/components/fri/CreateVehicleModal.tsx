import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/useFriData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVehicle?: any;
}

export default function CreateVehicleModal({
  isOpen,
  onClose,
  editingVehicle,
}: CreateVehicleModalProps) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    daily_rate: '',
    fuel_type: 'Benzin',
    transmission: 'Automatisk',
  });

  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        make: editingVehicle.make,
        model: editingVehicle.model,
        year: editingVehicle.year,
        license_plate: editingVehicle.license_plate,
        daily_rate: editingVehicle.daily_rate,
        fuel_type: editingVehicle.fuel_type || 'Benzin',
        transmission: editingVehicle.transmission || 'Automatisk',
      });
    } else {
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        daily_rate: '',
        fuel_type: 'Benzin',
        transmission: 'Automatisk',
      });
    }
  }, [editingVehicle, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'daily_rate' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.make || !formData.model || !formData.license_plate || !formData.daily_rate) {
      alert('Udfyld alle påkrævede felter');
      return;
    }

    try {
      if (editingVehicle) {
        await updateVehicle.mutateAsync({
          id: editingVehicle.id,
          ...formData,
        });
      } else {
        await createVehicle.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Der opstod en fejl');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingVehicle ? 'Rediger køretøj' : 'Tilføj nyt køretøj'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Make *</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                placeholder="f.eks. Toyota"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="f.eks. Corolla"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">År *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="2000"
                max={new Date().getFullYear()}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Licensnummer *</label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="f.eks. AB12345"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dagpris (kr.) *</label>
              <input
                type="number"
                name="daily_rate"
                value={formData.daily_rate}
                onChange={handleChange}
                placeholder="f.eks. 299"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brændstof</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option>Benzin</option>
                <option>Diesel</option>
                <option>Hybrid</option>
                <option>Elektrik</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Transmission</label>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option>Manuelt</option>
              <option>Automatisk</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Afbryd
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createVehicle.isPending || updateVehicle.isPending}
            >
              {createVehicle.isPending || updateVehicle.isPending
                ? 'Gemmer...'
                : editingVehicle
                  ? 'Opdater'
                  : 'Opret'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
