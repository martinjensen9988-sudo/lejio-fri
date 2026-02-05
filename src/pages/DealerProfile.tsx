
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { Card } from '@/components/ui/card';

interface DealerProfile {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_hours?: string;
  images?: string[];
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string;
  image_url?: string;
  [key: string]: unknown;
}

export default function DealerProfile() {
  const { id } = useParams();
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function fetchDealer() {
      // Hent forhandler-data
      const dealerResult = await (supabase.from('dealer_profiles' as any).select('*').eq('id', id).single() as any);
      setDealer(dealerResult.data as DealerProfile | null);
      // Hent forhandlerens biler
      const vehiclesResult = await (supabase.from('vehicles' as any).select('*').eq('dealer_id', id) as any);
      setVehicles((vehiclesResult.data || []) as Vehicle[]);
    }
    fetchDealer();
  }, [id]);

  if (!dealer) return <div className="min-h-screen flex items-center justify-center">Indlæser...</div>;

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{dealer.name}</h1>
        <div className="mb-2">{dealer.description}</div>
        <div className="mb-2">Adresse: {dealer.address}</div>
        <div className="mb-2">Telefon: {dealer.phone}</div>
        <div className="mb-2">Email: {dealer.email}</div>
        <div className="mb-2">Åbningstider: {dealer.opening_hours}</div>
        <div className="mb-4 flex gap-2 flex-wrap">
          {dealer.images?.map((url: string) => <img key={url} src={url} alt="billede" className="h-20 rounded" />)}
        </div>
        <h2 className="text-xl font-bold mt-6 mb-2">Biler hos forhandleren</h2>
        <div className="grid gap-2">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="p-2 flex flex-col gap-1">
              <div className="font-bold">{vehicle.make} {vehicle.model}</div>
              <div>Årgang: {vehicle.year}</div>
              <div>Nummerplade: {vehicle.license_plate}</div>
              {vehicle.image_url && <img src={vehicle.image_url} alt="bil" className="h-12 rounded mt-1" />}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
