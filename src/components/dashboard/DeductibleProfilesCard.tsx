import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDeductibleProfiles, DeductibleProfile } from '@/hooks/useDeductibleProfiles';
import { Shield, Plus, Star, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DeductibleProfilesCard = () => {
  const { profiles, isLoading, createProfile, updateProfile, deleteProfile } = useDeductibleProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DeductibleProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_deductible: 5000,
    premium_deductible: 0,
    premium_daily_rate: 79,
    min_renter_rating: '',
    min_completed_bookings: '',
    max_vehicle_value: '',
    is_default: false,
    is_active: true
  });

  const openCreateDialog = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      description: '',
      base_deductible: 5000,
      premium_deductible: 0,
      premium_daily_rate: 79,
      min_renter_rating: '',
      min_completed_bookings: '',
      max_vehicle_value: '',
      is_default: false,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (profile: DeductibleProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      base_deductible: profile.base_deductible,
      premium_deductible: profile.premium_deductible,
      premium_daily_rate: profile.premium_daily_rate,
      min_renter_rating: profile.min_renter_rating?.toString() || '',
      min_completed_bookings: profile.min_completed_bookings?.toString() || '',
      max_vehicle_value: profile.max_vehicle_value?.toString() || '',
      is_default: profile.is_default,
      is_active: profile.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Selvrisiko-profiler
          </CardTitle>
          <CardDescription>
            Dynamisk selvrisiko baseret på lejer og bil
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Ny profil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? 'Rediger profil' : 'Opret selvrisiko-profil'}
              </DialogTitle>
            </DialogHeader>
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

              <Button type="submit" className="w-full">
                {editingProfile ? 'Gem ændringer' : 'Opret profil'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {profiles.length > 0 ? (
          profiles.map(profile => (
            <ProfileItem 
              key={profile.id} 
              profile={profile}
              onEdit={() => openEditDialog(profile)}
              onDelete={() => deleteProfile(profile.id)}
            />
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen selvrisiko-profiler</p>
            <p className="text-sm">Opret profiler for at tilbyde forskellige selvrisiko-niveauer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ProfileItemProps {
  profile: DeductibleProfile;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileItem: React.FC<ProfileItemProps> = ({ profile, onEdit, onDelete }) => {
  return (
    <div className={`border rounded-lg p-3 ${!profile.is_active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{profile.name}</span>
          {profile.is_default && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Standard
            </Badge>
          )}
          {!profile.is_active && (
            <Badge variant="outline" className="text-xs">Inaktiv</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {profile.description && (
        <p className="text-xs text-muted-foreground mt-1">{profile.description}</p>
      )}

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted rounded p-2">
          <p className="text-muted-foreground">Standard</p>
          <p className="font-bold">{profile.base_deductible.toLocaleString('da-DK')} kr</p>
        </div>
        <div className="bg-primary/10 rounded p-2">
          <p className="text-muted-foreground">Premium</p>
          <p className="font-bold">{profile.premium_deductible.toLocaleString('da-DK')} kr</p>
          <p className="text-[10px] text-muted-foreground">+{profile.premium_daily_rate} kr/dag</p>
        </div>
      </div>

      {(profile.min_renter_rating || profile.min_completed_bookings || profile.max_vehicle_value) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.min_renter_rating && (
            <Badge variant="outline" className="text-[10px]">
              Min. rating: {profile.min_renter_rating}⭐
            </Badge>
          )}
          {profile.min_completed_bookings && (
            <Badge variant="outline" className="text-[10px]">
              Min. {profile.min_completed_bookings} bookinger
            </Badge>
          )}
          {profile.max_vehicle_value && (
            <Badge variant="outline" className="text-[10px]">
              Maks. {(profile.max_vehicle_value / 1000).toFixed(0)}k kr bil
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
