import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useDeductibleProfiles } from '@/hooks/useDeductibleProfiles';
import { Shield, ArrowLeft, Plus, Loader2 } from 'lucide-react';

const DeductiblesAddPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { profiles, createProfile, updateProfile } = useDeductibleProfiles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const editingProfile = editId ? profiles.find(p => p.id === editId) : null;
  
  const [formData, setFormData] = useState({
    name: editingProfile?.name || '',
    description: editingProfile?.description || '',
    base_deductible: editingProfile?.base_deductible || 5000,
    premium_deductible: editingProfile?.premium_deductible || 0,
    premium_daily_rate: editingProfile?.premium_daily_rate || 79,
    min_renter_rating: editingProfile?.min_renter_rating?.toString() || '',
    min_completed_bookings: editingProfile?.min_completed_bookings?.toString() || '',
    max_vehicle_value: editingProfile?.max_vehicle_value?.toString() || '',
    is_default: editingProfile?.is_default || false,
    is_active: editingProfile?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      name: formData.name,
      description: formData.description || null,
      base_deductible: formData.base_deductible,
      premium_deductible: formData.premium_deductible,
      premium_daily_rate: formData.premium_daily_rate,
      min_renter_rating: formData.min_renter_rating ? parseFloat(formData.min_renter_rating) : null,
      min_completed_bookings: formData.min_completed_bookings ? parseInt(formData.min_completed_bookings) : null,
      max_vehicle_value: formData.max_vehicle_value ? parseFloat(formData.max_vehicle_value) : null,
      is_default: formData.is_default,
      is_active: formData.is_active
    };

    if (editingProfile) {
      await updateProfile(editingProfile.id, data);
    } else {
      await createProfile(data);
    }

    navigate('/dashboard/deductibles');
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout activeTab="deductibles">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/deductibles')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{editingProfile ? 'Rediger profil' : 'Opret selvrisiko-profil'}</h2>
            <p className="text-muted-foreground">Dynamisk selvrisiko baseret på lejer og bil</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Selvrisiko-profil
            </CardTitle>
            <CardDescription>
              Opret eller rediger en selvrisiko-profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="f.eks. VIP-kunde"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kort beskrivelse"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Standard selvrisiko (kr)</Label>
                  <Input
                    type="number"
                    value={formData.base_deductible}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_deductible: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Premium selvrisiko (kr)</Label>
                  <Input
                    type="number"
                    value={formData.premium_deductible}
                    onChange={(e) => setFormData(prev => ({ ...prev, premium_deductible: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Premium dagspris (kr/dag)</Label>
                <Input
                  type="number"
                  value={formData.premium_daily_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, premium_daily_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Krav til lejer (valgfrit)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Min. rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.min_renter_rating}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_renter_rating: e.target.value }))}
                      placeholder="f.eks. 4.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Min. bookinger</Label>
                    <Input
                      type="number"
                      value={formData.min_completed_bookings}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_completed_bookings: e.target.value }))}
                      placeholder="f.eks. 5"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Maks. bilværdi (kr)</Label>
                <Input
                  type="number"
                  value={formData.max_vehicle_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_vehicle_value: e.target.value }))}
                  placeholder="f.eks. 500000"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-default">Standard profil</Label>
                <Switch
                  id="is-default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Aktiv</Label>
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard/deductibles')}>
                  Annuller
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {editingProfile ? 'Gem ændringer' : 'Opret profil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeductiblesAddPage;
