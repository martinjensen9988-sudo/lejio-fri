import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, MapPin, Clock, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDealerLocations, DealerLocation } from '@/hooks/useDealerLocations';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

const LocationEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    locations, 
    isLoading, 
    updateLocation, 
    deleteLocation,
    updateOpeningHours,
    addSpecialDay,
    removeSpecialDay 
  } = useDealerLocations(user?.id || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const location = locations.find(l => l.id === id);

  // Form state
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    is_headquarters: false,
    is_active: true,
    preparation_time_minutes: 120,
    notes: '',
  });

  // Opening hours state
  const [hours, setHours] = useState<Record<number, { opens_at: string; closes_at: string; is_closed: boolean }>>({});

  // Special day form
  const [specialDayForm, setSpecialDayForm] = useState({
    date: '',
    is_closed: true,
    opens_at: '08:00',
    closes_at: '17:00',
    reason: '',
  });

  useEffect(() => {
    if (location) {
      setForm({
        name: location.name,
        address: location.address,
        city: location.city,
        postal_code: location.postal_code,
        phone: location.phone || '',
        email: location.email || '',
        is_headquarters: location.is_headquarters,
        is_active: location.is_active,
        preparation_time_minutes: location.preparation_time_minutes,
        notes: location.notes || '',
      });

      // Initialize opening hours
      const hoursMap: Record<number, { opens_at: string; closes_at: string; is_closed: boolean }> = {};
      for (let i = 0; i <= 6; i++) {
        const existing = location.opening_hours?.find(h => h.day_of_week === i);
        hoursMap[i] = {
          opens_at: existing?.opens_at || '08:00',
          closes_at: existing?.closes_at || '17:00',
          is_closed: existing?.is_closed ?? (i === 0),
        };
      }
      setHours(hoursMap);
    }
  }, [location]);

  const handleSave = async () => {
    if (!id || !form.name || !form.address || !form.city || !form.postal_code) return;

    setIsSaving(true);
    await updateLocation(id, form);
    setIsSaving(false);
    navigate('/dashboard/locations');
  };

  const handleSaveHours = async () => {
    if (!id) return;

    setIsSaving(true);
    const hoursArray = Object.entries(hours).map(([day, h]) => ({
      day_of_week: parseInt(day),
      opens_at: h.is_closed ? null : h.opens_at,
      closes_at: h.is_closed ? null : h.closes_at,
      is_closed: h.is_closed,
    }));
    await updateOpeningHours(id, hoursArray);
    setIsSaving(false);
  };

  const handleAddSpecialDay = async () => {
    if (!id || !specialDayForm.date) return;

    setIsSaving(true);
    await addSpecialDay(id, {
      date: specialDayForm.date,
      is_closed: specialDayForm.is_closed,
      opens_at: specialDayForm.is_closed ? null : specialDayForm.opens_at,
      closes_at: specialDayForm.is_closed ? null : specialDayForm.closes_at,
      reason: specialDayForm.reason || null,
    });
    setSpecialDayForm({ date: '', is_closed: true, opens_at: '08:00', closes_at: '17:00', reason: '' });
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Er du sikker på at du vil slette denne lokation?')) return;

    setIsDeleting(true);
    await deleteLocation(id);
    setIsDeleting(false);
    navigate('/dashboard/locations');
  };

  if (isLoading) {
    return (
      <DashboardLayout activeTab="locations">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!location) {
    return (
      <DashboardLayout activeTab="locations">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lokation ikke fundet</p>
          <Button onClick={() => navigate('/dashboard/locations')} className="mt-4">
            Tilbage til lokationer
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="locations">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/locations')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage til lokationer
        </Button>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Lokationsoplysninger</CardTitle>
                <CardDescription>Rediger grundlæggende oplysninger</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Navn *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Adresse *</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Postnummer *</Label>
                <Input
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                />
              </div>
              <div>
                <Label>By *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Klargøringstid (minutter)</Label>
                <Input
                  type="number"
                  value={form.preparation_time_minutes}
                  onChange={(e) => setForm({ ...form, preparation_time_minutes: parseInt(e.target.value) || 120 })}
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_headquarters}
                    onCheckedChange={(checked) => setForm({ ...form, is_headquarters: checked })}
                  />
                  <Label>Hovedkontor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label>Aktiv</Label>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Noter</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Gem ændringer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Åbningstider</CardTitle>
                <CardDescription>Angiv hvornår lokationen er åben</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAY_NAMES.map((day, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 font-medium text-sm">{day}</div>
                <Switch
                  checked={!hours[i]?.is_closed}
                  onCheckedChange={(open) => 
                    setHours({ ...hours, [i]: { ...hours[i], is_closed: !open } })
                  }
                />
                {!hours[i]?.is_closed ? (
                  <>
                    <Input
                      type="time"
                      value={hours[i]?.opens_at || '08:00'}
                      onChange={(e) => 
                        setHours({ ...hours, [i]: { ...hours[i], opens_at: e.target.value } })
                      }
                      className="w-28"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={hours[i]?.closes_at || '17:00'}
                      onChange={(e) => 
                        setHours({ ...hours, [i]: { ...hours[i], closes_at: e.target.value } })
                      }
                      className="w-28"
                    />
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Lukket</span>
                )}
              </div>
            ))}

            <Button onClick={handleSaveHours} disabled={isSaving} className="mt-4">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gem åbningstider
            </Button>
          </CardContent>
        </Card>

        {/* Special Days */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-mint/10 rounded-lg">
                <Calendar className="w-5 h-5 text-mint" />
              </div>
              <div>
                <CardTitle>Særlige dage</CardTitle>
                <CardDescription>Helligdage og andre lukkedage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing special days */}
            {location.special_days && location.special_days.length > 0 && (
              <div className="space-y-2 mb-4">
                {location.special_days.map((day) => (
                  <div key={day.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium">
                        {format(new Date(day.date), 'd. MMMM yyyy', { locale: da })}
                      </span>
                      {day.reason && <span className="text-muted-foreground ml-2">- {day.reason}</span>}
                      <span className="text-sm text-muted-foreground ml-2">
                        {day.is_closed ? '(Lukket)' : `(${day.opens_at} - ${day.closes_at})`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecialDay(day.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Add new special day */}
            <div className="space-y-4 pt-4">
              <h4 className="font-medium">Tilføj ny særlig dag</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Dato</Label>
                  <Input
                    type="date"
                    value={specialDayForm.date}
                    onChange={(e) => setSpecialDayForm({ ...specialDayForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Begrundelse</Label>
                  <Input
                    value={specialDayForm.reason}
                    onChange={(e) => setSpecialDayForm({ ...specialDayForm, reason: e.target.value })}
                    placeholder="F.eks. Juleaften"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={specialDayForm.is_closed}
                    onCheckedChange={(closed) => setSpecialDayForm({ ...specialDayForm, is_closed: closed })}
                  />
                  <Label>Helt lukket</Label>
                </div>
                {!specialDayForm.is_closed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={specialDayForm.opens_at}
                      onChange={(e) => setSpecialDayForm({ ...specialDayForm, opens_at: e.target.value })}
                      className="w-28"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={specialDayForm.closes_at}
                      onChange={(e) => setSpecialDayForm({ ...specialDayForm, closes_at: e.target.value })}
                      className="w-28"
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleAddSpecialDay} disabled={!specialDayForm.date || isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tilføj særlig dag
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Slet lokation</CardTitle>
            <CardDescription>Denne handling kan ikke fortrydes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-2" />
              Slet lokation
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LocationEditPage;
