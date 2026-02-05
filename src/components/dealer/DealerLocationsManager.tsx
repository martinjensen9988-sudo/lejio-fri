import { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MapPin, Plus, Building2, Clock, Phone, Mail, 
  ChevronDown, ChevronUp, Loader2, Trash2, Edit, Calendar,
  CheckCircle, XCircle
} from 'lucide-react';
import { 
  useDealerLocations, 
  DealerLocation, 
  CreateLocationInput,
  LocationOpeningHours 
} from '@/hooks/useDealerLocations';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface DealerLocationsManagerProps {
  partnerId: string;
  isAdmin?: boolean;
}

const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

export const DealerLocationsManager = ({ partnerId, isAdmin = false }: DealerLocationsManagerProps) => {
  const { 
    locations, 
    isLoading, 
    createLocation, 
    updateLocation, 
    deleteLocation,
    updateOpeningHours,
    addSpecialDay,
    removeSpecialDay
  } = useDealerLocations(partnerId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DealerLocation | null>(null);
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateLocationInput>({
    partner_id: partnerId,
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    is_headquarters: false,
    preparation_time_minutes: 120,
    notes: '',
  });

  // Opening hours editing
  const [editingHours, setEditingHours] = useState<Record<number, { opens_at: string; closes_at: string; is_closed: boolean }>>({});
  const [showHoursDialog, setShowHoursDialog] = useState(false);

  // Special day form
  const [showSpecialDayDialog, setShowSpecialDayDialog] = useState(false);
  const [specialDayForm, setSpecialDayForm] = useState({
    date: '',
    is_closed: true,
    opens_at: '',
    closes_at: '',
    reason: '',
  });

  const handleCreateLocation = async () => {
    if (!createForm.name || !createForm.address || !createForm.city || !createForm.postal_code) {
      return;
    }

    setIsSaving(true);
    await createLocation(createForm);
    setIsSaving(false);
    setShowCreateDialog(false);
    setCreateForm({
      partner_id: partnerId,
      name: '',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
      email: '',
      is_headquarters: false,
      preparation_time_minutes: 120,
      notes: '',
    });
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return;
    setIsSaving(true);
    await deleteLocation(selectedLocation.id);
    setIsSaving(false);
    setShowDeleteDialog(false);
    setSelectedLocation(null);
  };

  const handleToggleActive = async (location: DealerLocation) => {
    await updateLocation(location.id, { is_active: !location.is_active });
  };

  const openHoursDialog = (location: DealerLocation) => {
    setSelectedLocation(location);
    const hours: Record<number, { opens_at: string; closes_at: string; is_closed: boolean }> = {};
    for (let i = 0; i <= 6; i++) {
      const existing = location.opening_hours?.find(h => h.day_of_week === i);
      hours[i] = {
        opens_at: existing?.opens_at || '08:00',
        closes_at: existing?.closes_at || '17:00',
        is_closed: existing?.is_closed ?? (i === 0),
      };
    }
    setEditingHours(hours);
    setShowHoursDialog(true);
  };

  const handleSaveHours = async () => {
    if (!selectedLocation) return;
    
    setIsSaving(true);
    const hoursArray = Object.entries(editingHours).map(([day, h]) => ({
      day_of_week: parseInt(day),
      opens_at: h.is_closed ? null : h.opens_at,
      closes_at: h.is_closed ? null : h.closes_at,
      is_closed: h.is_closed,
    }));
    
    await updateOpeningHours(selectedLocation.id, hoursArray);
    setIsSaving(false);
    setShowHoursDialog(false);
    setSelectedLocation(null);
  };

  const openSpecialDayDialog = (location: DealerLocation) => {
    setSelectedLocation(location);
    setSpecialDayForm({
      date: '',
      is_closed: true,
      opens_at: '',
      closes_at: '',
      reason: '',
    });
    setShowSpecialDayDialog(true);
  };

  const handleAddSpecialDay = async () => {
    if (!selectedLocation || !specialDayForm.date) return;

    setIsSaving(true);
    await addSpecialDay(selectedLocation.id, {
      date: specialDayForm.date,
      is_closed: specialDayForm.is_closed,
      opens_at: specialDayForm.is_closed ? null : specialDayForm.opens_at || null,
      closes_at: specialDayForm.is_closed ? null : specialDayForm.closes_at || null,
      reason: specialDayForm.reason || null,
    });
    setIsSaving(false);
    setShowSpecialDayDialog(false);
    setSelectedLocation(null);
  };

  const formatOpeningHours = (hours: LocationOpeningHours[] | undefined) => {
    if (!hours || hours.length === 0) return 'Ikke sat op';
    
    const mondayHours = hours.find(h => h.day_of_week === 1);
    if (!mondayHours) return 'Ikke sat op';
    if (mondayHours.is_closed) return 'Lukket';
    return `${mondayHours.opens_at?.slice(0, 5)} - ${mondayHours.closes_at?.slice(0, 5)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lokationer</h2>
          <p className="text-muted-foreground">Administrer dine afdelinger og åbningstider</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tilføj lokation
        </Button>
      </div>

      {/* Locations list */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen lokationer endnu</h3>
            <p className="text-muted-foreground mb-4">
              Tilføj din første afdeling for at komme i gang
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj lokation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {locations.map((location) => (
            <Collapsible
              key={location.id}
              open={expandedLocationId === location.id}
              onOpenChange={(open) => setExpandedLocationId(open ? location.id : null)}
            >
              <Card className={!location.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${location.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{location.name}</CardTitle>
                          {location.is_headquarters && (
                            <Badge variant="secondary">
                              <Building2 className="w-3 h-3 mr-1" />
                              Hovedkontor
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {location.address}, {location.postal_code} {location.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatOpeningHours(location.opening_hours)}
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={location.is_active}
                        onCheckedChange={() => handleToggleActive(location)}
                      />
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {expandedLocationId === location.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-4 border-t">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Contact info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Kontaktinfo</h4>
                        {location.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {location.phone}
                          </div>
                        )}
                        {location.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {location.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Klargøringstid: {location.preparation_time_minutes} min
                        </div>
                      </div>

                      {/* Opening hours */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Åbningstider</h4>
                          <Button variant="outline" size="sm" onClick={() => openHoursDialog(location)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Rediger
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          {DAY_NAMES.map((day, i) => {
                            const hours = location.opening_hours?.find(h => h.day_of_week === i);
                            return (
                              <div key={i} className="flex justify-between">
                                <span className="text-muted-foreground">{day.slice(0, 3)}:</span>
                                <span>
                                  {hours?.is_closed ? 'Lukket' : 
                                    hours ? `${hours.opens_at?.slice(0, 5)}-${hours.closes_at?.slice(0, 5)}` : '-'
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Special days */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">Særlige lukkedage</h4>
                        <Button variant="outline" size="sm" onClick={() => openSpecialDayDialog(location)}>
                          <Calendar className="w-3 h-3 mr-1" />
                          Tilføj
                        </Button>
                      </div>
                      {location.special_days && location.special_days.length > 0 ? (
                        <div className="space-y-2">
                          {location.special_days.map((day) => (
                            <div key={day.id} className="flex items-center justify-between text-sm bg-muted/50 px-3 py-2 rounded">
                              <div className="flex items-center gap-2">
                                {day.is_closed ? (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                <span>{format(new Date(day.date), 'd. MMMM yyyy', { locale: da })}</span>
                                {day.reason && <span className="text-muted-foreground">({day.reason})</span>}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => removeSpecialDay(day.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen særlige lukkedage</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t flex justify-end gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedLocation(location);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Slet
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Create Location Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tilføj ny lokation</DialogTitle>
            <DialogDescription>
              Opret en ny afdeling eller udleveringssted
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Navn *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="F.eks. Aalborg afdeling"
                />
              </div>
              <div className="col-span-2">
                <Label>Adresse *</Label>
                <Input
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Vejnavn 123"
                />
              </div>
              <div>
                <Label>Postnummer *</Label>
                <Input
                  value={createForm.postal_code}
                  onChange={(e) => setCreateForm({ ...createForm, postal_code: e.target.value })}
                  placeholder="9000"
                />
              </div>
              <div>
                <Label>By *</Label>
                <Input
                  value={createForm.city}
                  onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  placeholder="Aalborg"
                />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input
                  value={createForm.phone || ''}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={createForm.email || ''}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="afdeling@firma.dk"
                />
              </div>
              <div>
                <Label>Klargøringstid (min)</Label>
                <Input
                  type="number"
                  value={createForm.preparation_time_minutes || 120}
                  onChange={(e) => setCreateForm({ ...createForm, preparation_time_minutes: parseInt(e.target.value) || 120 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={createForm.is_headquarters}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, is_headquarters: checked })}
                />
                <Label>Hovedkontor</Label>
              </div>
              <div className="col-span-2">
                <Label>Noter</Label>
                <Textarea
                  value={createForm.notes || ''}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Interne noter..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleCreateLocation} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Opret lokation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Opening Hours Dialog */}
      <Dialog open={showHoursDialog} onOpenChange={setShowHoursDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger åbningstider</DialogTitle>
            <DialogDescription>
              {selectedLocation?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {DAY_NAMES.map((day, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-20 font-medium text-sm">{day}</div>
                <Switch
                  checked={!editingHours[i]?.is_closed}
                  onCheckedChange={(open) => 
                    setEditingHours({ ...editingHours, [i]: { ...editingHours[i], is_closed: !open } })
                  }
                />
                {!editingHours[i]?.is_closed && (
                  <>
                    <Input
                      type="time"
                      value={editingHours[i]?.opens_at || '08:00'}
                      onChange={(e) => 
                        setEditingHours({ ...editingHours, [i]: { ...editingHours[i], opens_at: e.target.value } })
                      }
                      className="w-28"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={editingHours[i]?.closes_at || '17:00'}
                      onChange={(e) => 
                        setEditingHours({ ...editingHours, [i]: { ...editingHours[i], closes_at: e.target.value } })
                      }
                      className="w-28"
                    />
                  </>
                )}
                {editingHours[i]?.is_closed && (
                  <span className="text-muted-foreground text-sm">Lukket</span>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoursDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleSaveHours} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gem åbningstider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Special Day Dialog */}
      <Dialog open={showSpecialDayDialog} onOpenChange={setShowSpecialDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj særlig dag</DialogTitle>
            <DialogDescription>
              Tilføj en helligdag eller anden særlig lukkedag
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Dato *</Label>
              <Input
                type="date"
                value={specialDayForm.date}
                onChange={(e) => setSpecialDayForm({ ...specialDayForm, date: e.target.value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Åbner</Label>
                  <Input
                    type="time"
                    value={specialDayForm.opens_at}
                    onChange={(e) => setSpecialDayForm({ ...specialDayForm, opens_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Lukker</Label>
                  <Input
                    type="time"
                    value={specialDayForm.closes_at}
                    onChange={(e) => setSpecialDayForm({ ...specialDayForm, closes_at: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Begrundelse</Label>
              <Input
                value={specialDayForm.reason}
                onChange={(e) => setSpecialDayForm({ ...specialDayForm, reason: e.target.value })}
                placeholder="F.eks. Helligdag, Ferie..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSpecialDayDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleAddSpecialDay} disabled={isSaving || !specialDayForm.date}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tilføj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet lokation?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette "{selectedLocation?.name}"? 
              Alle køretøjer tilknyttet denne lokation vil blive frakoblet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation} className="bg-destructive text-destructive-foreground">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Slet'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DealerLocationsManager;
