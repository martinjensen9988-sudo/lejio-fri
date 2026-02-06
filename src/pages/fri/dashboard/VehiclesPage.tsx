import React from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { VehiclesTab } from '@/components/fri/VehiclesTab';

export function FriVehiclesPage() {
  return (
    <FriDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Køretøjer</h1>
          <p className="text-gray-500 mt-1">Administrer din flåde af køretøjer</p>
        </div>
        <VehiclesTab />
      </div>
    </FriDashboardLayout>
  );
}

export default FriVehiclesPage;
