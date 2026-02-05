import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFriVehicles, useDeleteVehicle } from '@/hooks/useFriData';
import { Loader2, Trash2, Edit2, Plus } from 'lucide-react';
import CreateVehicleModal from '@/components/fri/CreateVehicleModal';

export function VehiclesTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const { data: vehicles, isLoading } = useFriVehicles();
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = async (vehicleId: string) => {
    if (confirm('Er du sikker på, at du vil slette dette køretøj?')) {
      await deleteVehicle.mutateAsync(vehicleId);
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setIsCreateOpen(true);
  };

  const handleCreate = () => {
    setEditingVehicle(null);
    setIsCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Køretøjer</h2>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Tilføj køretøj
          </Button>
        </div>

        {!vehicles || vehicles.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Ingen køretøjer endnu. Opret dine første køretøj.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>År</TableHead>
                <TableHead>Licensnummer</TableHead>
                <TableHead>Dagpris</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kilometer</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle: any) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.make}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.license_plate}</TableCell>
                  <TableCell>kr. {vehicle.daily_rate.toLocaleString('da-DK')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      vehicle.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.status === 'available' ? '✅ Tilgængelig' : '🚫 Utilgængelig'}
                    </span>
                  </TableCell>
                  <TableCell>{vehicle.odometer || 0} km</TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={deleteVehicle.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CreateVehicleModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingVehicle(null);
        }}
        editingVehicle={editingVehicle}
      />
    </div>
  );
}
