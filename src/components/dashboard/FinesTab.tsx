import { useState } from 'react';
import { useFines, Fine } from '@/hooks/useFines';
import { useVehicles } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/azure/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  AlertCircle, 
  Plus, 
  Send, 
  Check, 
  Upload, 
  FileText,
  Car,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const FINE_TYPES = [
  { value: 'parking', label: 'Parkeringsbøde' },
  { value: 'speed', label: 'Fartbøde' },
  { value: 'toll', label: 'Betalingsring/Bro' },
  { value: 'other', label: 'Andet' },
];

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Afventer', variant: 'secondary' },
  sent_to_renter: { label: 'Sendt til lejer', variant: 'default' },
  paid: { label: 'Betalt', variant: 'outline' },
  disputed: { label: 'Bestridt', variant: 'destructive' },
};

const FinesTab = () => {
  const { fines, isLoading, addFine, sendToRenter, markAsPaid, deleteFine } = useFines();
  const { vehicles } = useVehicles();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    renter_email: '',
    renter_name: '',
    fine_type: 'parking' as Fine['fine_type'],
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

  const handleSubmit = async () => {
    if (!formData.renter_email || !formData.fine_date || !formData.fine_amount) {
      toast.error('Udfyld påkrævede felter');
      return;
    }

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

    if (result) {
      setIsAddDialogOpen(false);
      setFormData({
        vehicle_id: '',
        renter_email: '',
        renter_name: '',
        fine_type: 'parking',
        fine_date: '',
        fine_amount: '',
        description: '',
        file_url: '',
      });
    }
  };

  const pendingFines = fines.filter(f => f.status === 'pending');
  const sentFines = fines.filter(f => f.status === 'sent_to_renter');
  const paidFines = fines.filter(f => f.status === 'paid');

  const totalPending = pendingFines.reduce((sum, f) => sum + f.total_amount, 0);
  const totalCollected = paidFines.reduce((sum, f) => sum + f.total_amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingFines.length}</p>
                <p className="text-sm text-muted-foreground">Afventer handling</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPending.toLocaleString()} kr</p>
                <p className="text-sm text-muted-foreground">Udestående</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCollected.toLocaleString()} kr</p>
                <p className="text-sm text-muted-foreground">Indsamlet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Fine Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Tilføj bøde/afgift
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tilføj bøde eller afgift</DialogTitle>
            <DialogDescription>
              Upload bøden og systemet vil automatisk matche med den relevante lejer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Køretøj (valgfrit - hjælper med auto-match)</Label>
              <Select 
                value={formData.vehicle_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, vehicle_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        {v.registration} - {v.make} {v.model}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bødetype *</Label>
                <Select 
                  value={formData.fine_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, fine_type: v as Fine['fine_type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
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
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bødebeløb (kr) *</Label>
              <Input
                type="number"
                value={formData.fine_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, fine_amount: e.target.value }))}
                placeholder="510"
              />
              <p className="text-xs text-muted-foreground">
                Administrationsgebyr på 500 kr. tillægges automatisk
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lejer email *</Label>
                <Input
                  type="email"
                  value={formData.renter_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, renter_email: e.target.value }))}
                  placeholder="lejer@email.dk"
                />
              </div>

              <div className="space-y-2">
                <Label>Lejer navn</Label>
                <Input
                  value={formData.renter_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, renter_name: e.target.value }))}
                  placeholder="Navn"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload bøde (PDF/billede)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {formData.file_url && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={formData.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Parkering på p-plads..."
              />
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
              {uploading ? 'Uploader...' : 'Tilføj bøde'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bøder & Afgifter
          </CardTitle>
          <CardDescription>
            Administrer og videresend bøder til lejere
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen bøder registreret endnu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Køretøj</TableHead>
                    <TableHead>Lejer</TableHead>
                    <TableHead>Beløb</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell>
                        {format(new Date(fine.fine_date), 'dd. MMM yyyy', { locale: da })}
                      </TableCell>
                      <TableCell>
                        {FINE_TYPES.find(t => t.value === fine.fine_type)?.label}
                      </TableCell>
                      <TableCell>
                        {fine.vehicle ? (
                          <span className="text-sm">
                            {fine.vehicle.registration}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fine.renter_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{fine.renter_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{fine.total_amount.toLocaleString()} kr</p>
                          <p className="text-xs text-muted-foreground">
                            ({fine.fine_amount} + {fine.admin_fee} gebyr)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[fine.status]?.variant}>
                          {STATUS_CONFIG[fine.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {fine.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={fine.file_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          {fine.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendToRenter(fine.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          )}
                          {fine.status === 'sent_to_renter' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => markAsPaid(fine.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Betalt
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteFine(fine.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinesTab;
