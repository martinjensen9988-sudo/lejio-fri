import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRevenueLoss } from '@/hooks/useRevenueLoss';
import { useVehicles } from '@/hooks/useVehicles';
import { TrendingDown, ArrowLeft, Calculator, Loader2 } from 'lucide-react';

const RevenueLossCalculatePage = () => {
  const navigate = useNavigate();
  const { calculateRevenueLoss, isCalculating } = useRevenueLoss();
  const { vehicles } = useVehicles();
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    repair_start_date: '',
    repair_end_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id) return;

    await calculateRevenueLoss(
      formData.vehicle_id,
      undefined,
      undefined,
      formData.repair_start_date || undefined,
      formData.repair_end_date || undefined
    );

    navigate('/dashboard/revenue-loss');
  };

  return (
    <DashboardLayout activeTab="revenue-loss">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/revenue-loss')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Beregn tab af indtægt</h2>
            <p className="text-muted-foreground">Automatisk beregning ved skader</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Beregn tab
            </CardTitle>
            <CardDescription>
              Beregn tabt indtægt når et køretøj er ude af drift
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Køretøj *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reparation start</Label>
                  <Input
                    type="date"
                    value={formData.repair_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, repair_start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forventet slut</Label>
                  <Input
                    type="date"
                    value={formData.repair_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, repair_end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">Sådan beregnes tabet:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>Historisk dagspris × dage ude af drift</li>
                  <li>Justeret for udnyttelsesgrad</li>
                  <li>Baseret på de seneste 20 bookinger</li>
                </ul>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/revenue-loss')}>
                  Annuller
                </Button>
                <Button type="submit" className="flex-1" disabled={!formData.vehicle_id || isCalculating}>
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Beregner...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Beregn tab
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RevenueLossCalculatePage;
