import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Car, Search, MoreHorizontal, Loader2, CheckCircle, 
  XCircle, AlertTriangle, FileText, Mail, ShieldCheck
} from 'lucide-react';

interface VehicleWithOwner {
  id: string;
  make: string;
  model: string;
  registration: string;
  year: number | null;
  vehicle_value: number | null;
  value_verified: boolean;
  value_verified_at: string | null;
  value_verified_by: string | null;
  value_verification_notes: string | null;
  value_documentation_requested: boolean;
  value_documentation_requested_at: string | null;
  owner_id: string;
  owner_email: string;
  owner_name: string | null;
  owner_company: string | null;
}

const AdminVehicleValueVerification = () => {
  const [vehicles, setVehicles] = useState<VehicleWithOwner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithOwner | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'requested'>('all');

  const fetchVehicles = async () => {
    setIsLoading(true);

    // Fetch vehicles with owner info
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id, make, model, registration, year, vehicle_value,
        value_verified, value_verified_at, value_verified_by,
        value_verification_notes, value_documentation_requested,
        value_documentation_requested_at, owner_id
      `)
      .not('vehicle_value', 'is', null)
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      toast.error('Kunne ikke hente køretøjer');
      setIsLoading(false);
      return;
    }

    // Fetch owner profiles
    const ownerIds = [...new Set((vehiclesData || []).map(v => v.owner_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name')
      .in('id', ownerIds);

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.id, p])
    );

    const vehiclesWithOwners: VehicleWithOwner[] = (vehiclesData || []).map(v => {
      const owner = profilesMap.get(v.owner_id);
      return {
        ...v,
        owner_email: owner?.email || '',
        owner_name: owner?.full_name || null,
        owner_company: owner?.company_name || null,
      };
    });

    setVehicles(vehiclesWithOwners);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.owner_company?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'verified') return matchesSearch && v.value_verified;
    if (filterStatus === 'requested') return matchesSearch && v.value_documentation_requested && !v.value_verified;
    if (filterStatus === 'pending') return matchesSearch && !v.value_verified && !v.value_documentation_requested;
    
    return matchesSearch;
  });

  const handleRequestDocumentation = async (vehicle: VehicleWithOwner) => {
    setIsSubmitting(true);

    // Update vehicle to mark documentation as requested
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        value_documentation_requested: true,
        value_documentation_requested_at: new Date().toISOString(),
      })
      .eq('id', vehicle.id);

    if (updateError) {
      toast.error('Kunne ikke anmode om dokumentation');
      setIsSubmitting(false);
      return;
    }

    // Send email to owner
    const { error: emailError } = await supabase.functions.invoke('send-admin-email', {
      body: {
        to: vehicle.owner_email,
        subject: 'LEJIO Stikprøvekontrol - Dokumentation påkrævet',
        content: `Kære ${vehicle.owner_name || vehicle.owner_company || 'udlejer'},

Vi foretager en stikprøvekontrol af bilværdien på dit køretøj:

${vehicle.make} ${vehicle.model} (${vehicle.registration})
Angivet værdi: ${vehicle.vehicle_value?.toLocaleString('da-DK')} kr

I henhold til vores retningslinjer beder vi dig venligst om at indsende dokumentation for bilens værdi. Dette kan være:
- Slutseddel fra købet
- Bankoverførsel som bekræfter købspris
- Faktura fra bilforhandler

Du kan svare direkte på denne email med dokumentationen vedhæftet.

Bemærk: Den angivne værdi må aldrig overstige den faktiske købspris.

Med venlig hilsen,
LEJIO Team`,
      },
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      toast.error('Køretøj opdateret, men email kunne ikke sendes');
    } else {
      toast.success('Dokumentationsanmodning sendt til udlejer');
    }

    fetchVehicles();
    setIsSubmitting(false);
  };

  const handleVerify = async (approved: boolean) => {
    if (!selectedVehicle) return;

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('vehicles')
      .update({
        value_verified: approved,
        value_verified_at: new Date().toISOString(),
        value_verified_by: user?.id,
        value_verification_notes: verificationNotes || null,
      })
      .eq('id', selectedVehicle.id);

    if (error) {
      toast.error('Kunne ikke opdatere verifikationsstatus');
    } else {
      toast.success(approved ? 'Bilværdi godkendt' : 'Bilværdi afvist');
      
      // Send notification to owner
      await supabase.functions.invoke('send-admin-email', {
        body: {
          to: selectedVehicle.owner_email,
          subject: approved 
            ? 'LEJIO - Din bilværdi er blevet godkendt' 
            : 'LEJIO - Din bilværdi kræver justering',
          content: approved 
            ? `Kære ${selectedVehicle.owner_name || selectedVehicle.owner_company || 'udlejer'},

Din angivne bilværdi for ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.registration}) er blevet godkendt efter vores stikprøvekontrol.

Med venlig hilsen,
LEJIO Team`
            : `Kære ${selectedVehicle.owner_name || selectedVehicle.owner_company || 'udlejer'},

Efter gennemgang af dokumentationen for ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.registration}) har vi fundet, at den angivne bilværdi kræver justering.

${verificationNotes ? `Bemærkning: ${verificationNotes}` : ''}

Kontakt os venligst for at opdatere værdien.

Med venlig hilsen,
LEJIO Team`,
        },
      });

      setShowVerifyDialog(false);
      setSelectedVehicle(null);
      setVerificationNotes('');
      fetchVehicles();
    }

    setIsSubmitting(false);
  };

  const openVerifyDialog = (vehicle: VehicleWithOwner) => {
    setSelectedVehicle(vehicle);
    setVerificationNotes(vehicle.value_verification_notes || '');
    setShowVerifyDialog(true);
  };

  const stats = {
    total: vehicles.length,
    verified: vehicles.filter(v => v.value_verified).length,
    pending: vehicles.filter(v => !v.value_verified && !v.value_documentation_requested).length,
    requested: vehicles.filter(v => v.value_documentation_requested && !v.value_verified).length,
  };

  const getStatusBadge = (vehicle: VehicleWithOwner) => {
    if (vehicle.value_verified) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Godkendt</Badge>;
    }
    if (vehicle.value_documentation_requested) {
      return <Badge variant="secondary" className="bg-amber-500 text-white"><FileText className="w-3 h-3 mr-1" /> Afventer dok.</Badge>;
    }
    return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" /> Ikke verificeret</Badge>;
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setFilterStatus('all')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Biler med værdi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500" onClick={() => setFilterStatus('verified')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-xs text-muted-foreground">Godkendte</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500" onClick={() => setFilterStatus('requested')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.requested}</p>
                <p className="text-xs text-muted-foreground">Afventer dok.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500" onClick={() => setFilterStatus('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Ikke verificeret</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Bilværdi Stikprøvekontrol
              </CardTitle>
              <CardDescription>
                Verificer bilværdier og anmod om dokumentation (slutseddel/bankoverførsel)
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søg køretøjer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ingen køretøjer med angivet værdi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Køretøj</TableHead>
                  <TableHead>Udlejer</TableHead>
                  <TableHead>Angivet værdi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verificeret</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.registration} {vehicle.year && `• ${vehicle.year}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vehicle.owner_company || vehicle.owner_name || '-'}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.owner_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {vehicle.vehicle_value?.toLocaleString('da-DK')} kr
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle)}</TableCell>
                    <TableCell>
                      {vehicle.value_verified_at ? (
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(vehicle.value_verified_at), 'd. MMM yyyy', { locale: da })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openVerifyDialog(vehicle)}>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Verificer værdi
                          </DropdownMenuItem>
                          {!vehicle.value_documentation_requested && (
                            <DropdownMenuItem 
                              onClick={() => handleRequestDocumentation(vehicle)}
                              disabled={isSubmitting}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Anmod om dokumentation
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {vehicle.value_verification_notes && (
                            <DropdownMenuItem disabled>
                              <FileText className="w-4 h-4 mr-2" />
                              {vehicle.value_verification_notes.substring(0, 30)}...
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificer Bilværdi</DialogTitle>
            <DialogDescription>
              Gennemgå dokumentation og godkend eller afvis den angivne bilværdi.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicle.registration} {selectedVehicle.year && `• ${selectedVehicle.year}`}
                </p>
                <p className="text-lg font-bold">
                  Angivet værdi: {selectedVehicle.vehicle_value?.toLocaleString('da-DK')} kr
                </p>
                <p className="text-sm">
                  Udlejer: {selectedVehicle.owner_company || selectedVehicle.owner_name || selectedVehicle.owner_email}
                </p>
                {selectedVehicle.value_documentation_requested && (
                  <Badge variant="secondary" className="mt-2">
                    <FileText className="w-3 h-3 mr-1" />
                    Dokumentation anmodet {selectedVehicle.value_documentation_requested_at && 
                      format(new Date(selectedVehicle.value_documentation_requested_at), 'd. MMM yyyy', { locale: da })}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Noter (valgfrit)</label>
                <Textarea
                  placeholder="Tilføj noter om verifikationen..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVerifyDialog(false)}
              disabled={isSubmitting}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleVerify(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Afvis
            </Button>
            <Button
              onClick={() => handleVerify(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Godkend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVehicleValueVerification;
