import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/azure/client';
import { Contract, useContracts } from "@/hooks/useContracts";
import { usePayments } from "@/hooks/usePayments";
import {
  Car,
  Calendar,
  FileText,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileCheck,
  User,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Download,
  CreditCard,
  Navigation2,
  Receipt,
  Files,
} from "lucide-react";
import { toast } from "sonner";

interface RentalBooking {
  id: string;
  vehicle_id: string;
  lessor_id: string;
  start_date: string;
  end_date: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  total_price: number;
  status: string;
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  created_at: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    registration: string;
    image_url: string | null;
    use_custom_location: boolean;
    location_address: string | null;
    location_postal_code: string | null;
    location_city: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}

interface RenterInvoice {
  id: string;
  invoice_number: string;
  booking_id: string;
  lessor_id: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  pdf_url: string | null;
  booking?: {
    start_date: string;
    end_date: string;
    vehicle?: {
      make: string;
      model: string;
      registration: string;
    };
  };
  lessor?: {
    full_name: string | null;
    company_name: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Afventer bekræftelse", variant: "outline", icon: Clock },
  confirmed: { label: "Bekræftet", variant: "default", icon: CheckCircle },
  active: { label: "Aktiv", variant: "default", icon: Car },
  completed: { label: "Afsluttet", variant: "secondary", icon: CheckCircle },
  cancelled: { label: "Annulleret", variant: "destructive", icon: XCircle },
};

const MyRentals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { contracts, downloadContractPdf, refetch: refetchContracts } = useContracts();
  const { redirectToPayment, isProcessing: isPaymentProcessing } = usePayments();
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [invoices, setInvoices] = useState<RenterInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for contractId in URL params (from email link)
  const contractIdFromUrl = searchParams.get("contractId");

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to auth with return URL
      const returnUrl = contractIdFromUrl 
        ? `/my-rentals?contractId=${contractIdFromUrl}`
        : "/my-rentals";
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, navigate, contractIdFromUrl]);

  // Fetch renter's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            vehicle:vehicles(id, make, model, registration, image_url, use_custom_location, location_address, location_postal_code, location_city, latitude, longitude)
          `)
          .eq("renter_email", user.email)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  // Fetch renter's invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user || !bookings.length) return;

      try {
        // Get all booking IDs for this renter
        const bookingIds = bookings.map(b => b.id);
        
        const { data, error } = await supabase
          .from("invoices")
          .select(`
            *,
            booking:bookings(
              start_date,
              end_date,
              vehicle:vehicles(make, model, registration)
            )
          `)
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setInvoices((data) || []);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, [user, bookings]);

  // Navigate to contract page from URL param
  useEffect(() => {
    if (contractIdFromUrl && contracts.length > 0) {
      const contract = contracts.find(c => c.id === contractIdFromUrl);
      if (contract) {
        navigate(`/dashboard/contract/sign/${contract.id}`, { replace: true });
      }
    }
  }, [contractIdFromUrl, contracts, navigate]);

  const getContractForBooking = (bookingId: string) => {
    return contracts.find(c => c.booking_id === bookingId);
  };

  const handleViewContract = (contract: Contract) => {
    navigate(`/dashboard/contract/sign/${contract.id}`);
  };

  const handleRebook = (booking: RentalBooking) => {
    if (booking.vehicle?.id) {
      navigate(`/booking/${booking.vehicle.id}`);
    }
  };

  const handlePayment = async (bookingId: string) => {
    await redirectToPayment(bookingId);
  };

  const openDirections = (booking: RentalBooking) => {
    const vehicle = booking.vehicle;
    if (!vehicle) return;

    // Get address or coordinates
    let destination = '';
    
    if (vehicle.latitude && vehicle.longitude) {
      destination = `${vehicle.latitude},${vehicle.longitude}`;
    } else if (vehicle.use_custom_location && vehicle.location_address) {
      destination = encodeURIComponent(
        [vehicle.location_address, vehicle.location_postal_code, vehicle.location_city, 'Denmark']
          .filter(Boolean)
          .join(', ')
      );
    } else {
      toast.error('Ingen adresse tilgængelig for dette køretøj');
      return;
    }

    // Detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (isIOS || isMac) {
      // Apple Maps
      window.open(`https://maps.apple.com/?daddr=${destination}`, '_blank');
    } else {
      // Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  };

  const canShowDirections = (booking: RentalBooking, contract: Contract | undefined) => {
    // Only show directions if contract is signed by both parties
    return contract?.renter_signature && contract?.lessor_signature && 
           booking.vehicle && 
           (booking.vehicle.latitude && booking.vehicle.longitude || 
            (booking.vehicle.use_custom_location && booking.vehicle.location_address));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const activeBookings = bookings.filter(b => ["pending", "confirmed", "active"].includes(b.status));
  const pastBookings = bookings.filter(b => ["completed", "cancelled"].includes(b.status));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="pt-20 pb-12 relative">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-mint/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary mb-4">
              <Car className="w-4 h-4" />
              <span>Dine udlejninger</span>
            </div>
            <h1 className="font-display text-4xl font-black mb-2">Mine lejeaftaler</h1>
            <p className="text-muted-foreground text-lg">
              Se dine bookinger, underskriv kontrakter og genbestil biler
            </p>
          </div>

          {/* Profile Summary */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm border-2 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                Min profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{profile?.full_name || "Ikke angivet"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{profile?.phone || "Ikke angivet"}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 font-medium"
                onClick={() => navigate("/settings")}
              >
                Rediger profil
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-lg h-12 p-1 bg-muted/50">
              <TabsTrigger value="active" className="gap-2 font-bold data-[state=active]:shadow-lg">
                <Car className="w-4 h-4" />
                Aktive ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 font-bold data-[state=active]:shadow-lg">
                <Clock className="w-4 h-4" />
                Historik ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 font-bold data-[state=active]:shadow-lg">
                <Files className="w-4 h-4" />
                Dokumenter ({invoices.length + contracts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Ingen aktive bookinger</h3>
                    <p className="text-muted-foreground mb-4">
                      Du har ingen aktive eller afventende bookinger
                    </p>
                    <Button onClick={() => navigate("/search")}>
                      Find en bil
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                activeBookings.map((booking) => {
                  const contract = getContractForBooking(booking.id);
                  const StatusIcon = statusConfig[booking.status]?.icon || Clock;

                  return (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Vehicle Image */}
                          <div className="w-full md:w-48 h-32 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                            {booking.vehicle?.image_url ? (
                              <img
                                src={booking.vehicle.image_url}
                                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {booking.vehicle?.make} {booking.vehicle?.model}
                                </h3>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {booking.vehicle?.registration}
                                </p>
                              </div>
                              <Badge variant={statusConfig[booking.status]?.variant || "outline"}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[booking.status]?.label || booking.status}
                              </Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {format(new Date(booking.start_date), "d. MMM", { locale: da })} - {format(new Date(booking.end_date), "d. MMM yyyy", { locale: da })}
                                </span>
                              </div>
                              <div className="font-semibold text-primary">
                                {booking.total_price.toLocaleString("da-DK")} kr
                              </div>
                              {(booking.pickup_time || booking.dropoff_time) && (
                                <div className="flex items-center gap-2 col-span-2 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    Afhentning kl. {booking.pickup_time || '10:00'} · Aflevering senest kl. {booking.dropoff_time || '08:00'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Contract Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {/* Payment button for pending bookings */}
                              {booking.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="gap-1 bg-primary hover:bg-primary/90"
                                  onClick={() => handlePayment(booking.id)}
                                  disabled={isPaymentProcessing}
                                >
                                  {isPaymentProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-4 h-4" />
                                  )}
                                  Betal nu
                                </Button>
                              )}
                              
                              {contract ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant={contract.renter_signature ? "outline" : "default"}
                                    className="gap-1"
                                    onClick={() => handleViewContract(contract)}
                                  >
                                    {contract.renter_signature ? (
                                      <>
                                        <FileCheck className="w-4 h-4" />
                                        Se kontrakt
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-4 h-4" />
                                        Underskriv kontrakt
                                      </>
                                    )}
                                  </Button>
                                  {contract.pdf_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={() => downloadContractPdf(contract)}
                                    >
                                      <Download className="w-4 h-4" />
                                      Download PDF
                                    </Button>
                                  )}
                                  {/* Directions button - only when contract is fully signed */}
                                  {canShowDirections(booking, contract) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
                                      onClick={() => openDirections(booking)}
                                    >
                                      <Navigation2 className="w-4 h-4" />
                                      Rutevejledning
                                    </Button>
                                  )}
                                </>
                              ) : booking.status === "confirmed" ? (
                                <p className="text-sm text-muted-foreground">
                                  Kontrakt afventer oprettelse...
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Ingen tidligere lejeaftaler</h3>
                    <p className="text-muted-foreground">
                      Dine afsluttede bookinger vil blive vist her
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map((booking) => {
                  const contract = getContractForBooking(booking.id);
                  const StatusIcon = statusConfig[booking.status]?.icon || Clock;

                  return (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Vehicle Image */}
                          <div className="w-full md:w-48 h-32 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                            {booking.vehicle?.image_url ? (
                              <img
                                src={booking.vehicle.image_url}
                                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {booking.vehicle?.make} {booking.vehicle?.model}
                                </h3>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {booking.vehicle?.registration}
                                </p>
                              </div>
                              <Badge variant={statusConfig[booking.status]?.variant || "outline"}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig[booking.status]?.label || booking.status}
                              </Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {format(new Date(booking.start_date), "d. MMM", { locale: da })} - {format(new Date(booking.end_date), "d. MMM yyyy", { locale: da })}
                                </span>
                              </div>
                              <div className="font-semibold">
                                {booking.total_price.toLocaleString("da-DK")} kr
                              </div>
                              {(booking.pickup_time || booking.dropoff_time) && (
                                <div className="flex items-center gap-2 col-span-2 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    Afhentning kl. {booking.pickup_time || '10:00'} · Aflevering senest kl. {booking.dropoff_time || '08:00'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              {contract && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => handleViewContract(contract)}
                                  >
                                    <FileCheck className="w-4 h-4" />
                                    Se kontrakt
                                  </Button>
                                  {contract.pdf_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={() => downloadContractPdf(contract)}
                                    >
                                      <Download className="w-4 h-4" />
                                      Download PDF
                                    </Button>
                                  )}
                                </>
                              )}
                              {booking.status === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleRebook(booking)}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Lej igen
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {/* Invoices Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Fakturaer ({invoices.length})
                </h3>
                {invoices.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <h4 className="font-medium mb-1">Ingen fakturaer endnu</h4>
                      <p className="text-sm text-muted-foreground">
                        Dine fakturaer vil blive vist her når de er oprettet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  invoices.map((invoice) => (
                    <Card key={invoice.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Faktura #{invoice.invoice_number}</span>
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                                {invoice.status === 'paid' ? 'Betalt' : invoice.status === 'sent' ? 'Sendt' : 'Kladde'}
                              </Badge>
                            </div>
                            {invoice.booking?.vehicle && (
                              <p className="text-sm text-muted-foreground">
                                {invoice.booking.vehicle.make} {invoice.booking.vehicle.model} ({invoice.booking.vehicle.registration})
                              </p>
                            )}
                            {invoice.booking && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(invoice.booking.start_date), "d. MMM", { locale: da })} - {format(new Date(invoice.booking.end_date), "d. MMM yyyy", { locale: da })}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Oprettet: {format(new Date(invoice.created_at), "d. MMM yyyy", { locale: da })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-lg text-primary">
                                {invoice.total_amount.toLocaleString('da-DK')} kr
                              </p>
                              <p className="text-xs text-muted-foreground">
                                heraf moms: {invoice.vat_amount.toLocaleString('da-DK')} kr
                              </p>
                            </div>
                            {invoice.pdf_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => window.open(invoice.pdf_url!, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Contracts Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Kontrakter ({contracts.length})
                </h3>
                {contracts.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <h4 className="font-medium mb-1">Ingen kontrakter endnu</h4>
                      <p className="text-sm text-muted-foreground">
                        Dine lejekontrakter vil blive vist her
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  contracts.map((contract) => (
                    <Card key={contract.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Kontrakt #{contract.contract_number}</span>
                              <Badge variant={contract.renter_signature && contract.lessor_signature ? 'default' : 'outline'}>
                                {contract.renter_signature && contract.lessor_signature 
                                  ? 'Underskrevet' 
                                  : contract.renter_signature 
                                    ? 'Afventer udlejer' 
                                    : 'Afventer underskrift'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {contract.vehicle_make} {contract.vehicle_model} ({contract.vehicle_registration})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(contract.start_date), "d. MMM", { locale: da })} - {format(new Date(contract.end_date), "d. MMM yyyy", { locale: da })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-2">
                              <p className="font-bold text-lg text-primary">
                                {contract.total_price.toLocaleString('da-DK')} kr
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={contract.renter_signature ? "outline" : "default"}
                              className="gap-1"
                              onClick={() => handleViewContract(contract)}
                            >
                              {contract.renter_signature ? (
                                <>
                                  <FileCheck className="w-4 h-4" />
                                  Se
                                </>
                              ) : (
                                <>
                                  <FileText className="w-4 h-4" />
                                  Underskriv
                                </>
                              )}
                            </Button>
                            {contract.pdf_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => downloadContractPdf(contract)}
                              >
                                <Download className="w-4 h-4" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default MyRentals;
