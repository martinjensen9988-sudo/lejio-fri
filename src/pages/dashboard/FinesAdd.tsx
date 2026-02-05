import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFines } from '@/hooks/useFines';
import { useVehicles } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/azure/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Upload, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

const FINE_TYPES = [
  { value: 'parking', label: 'Parkeringsbøde' },
  { value: 'speed', label: 'Fartbøde' },
  { value: 'toll', label: 'Betalingsring/Bro' },
  { value: 'other', label: 'Andet' },
];

const FinesAddPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addFine } = useFines();
  const { vehicles } = useVehicles();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    renter_email: '',
    renter_name: '',
    fine_type: 'parking',
    fine_date: '',
    fine_amount: '',
    description: '',
    file_url: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `fines/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, file_url: publicUrl }));
      toast.success('Fil uploadet');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Kunne ikke uploade fil');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.renter_email || !formData.fine_date || !formData.fine_amount) {
      toast.error('Udfyld påkrævede felter');
      return;
    }

    setSubmitting(true);
    const result = await addFine({
      vehicle_id: formData.vehicle_id || undefined,
      renter_email: formData.renter_email,
      renter_name: formData.renter_name || undefined,
      fine_type: formData.fine_type,
      fine_date: formData.fine_date,
      fine_amount: parseFloat(formData.fine_amount),
      description: formData.description || undefined,
      file_url: formData.file_url || undefined,
    });

    setSubmitting(false);

    if (result) {
      navigate('/dashboard/fines');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <DashboardLayout activeTab="fines">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/fines')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Tilføj bøde/afgift</h2>
            <p className="text-muted-foreground">Registrer en ny bøde og send til lejer</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Bøde detaljer
            </CardTitle>
            <CardDescription>
              Upload bøden og systemet vil automatisk matche med den relevante lejer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Køretøj (valgfrit)</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lejerens email *</Label>
                  <Input
                    type="email"
                    value={formData.renter_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, renter_email: e.target.value }))}
                    placeholder="lejer@email.dk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lejerens navn</Label>
                  <Input
                    value={formData.renter_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, renter_name: e.target.value }))}
                    placeholder="Fulde navn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bødetype *</Label>
                  <Select
                    value={formData.fine_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, fine_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bødedato *</Label>
                  <Input
                    type="date"
                    value={formData.fine_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, fine_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bødebeløb (DKK) *</Label>
                <Input
                  type="number"
                  value={formData.fine_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, fine_amount: e.target.value }))}
                  placeholder="0"
                  min={0}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Et administrationsgebyr på 150 kr. tillægges automatisk
                </p>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Yderligere detaljer..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload bødedokument</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                {formData.file_url && (
                  <p className="text-sm text-accent">✓ Fil uploadet</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/dashboard/fines')}>
                  Annuller
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting || uploading}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Tilføj bøde
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FinesAddPage;
