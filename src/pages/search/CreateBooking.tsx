import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { differenceInDays, format, addMonths } from 'date-fns';
import { da } from 'date-fns/locale';
import { Calendar, Car, Check, User, Mail, Phone, Loader2, MapPin, Bike, ArrowLeft, Lock, Eye, EyeOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import VehicleLocationMap from '@/components/search/VehicleLocationMap';
import { MCLicenseCheck } from '@/components/search/MCLicenseCheck';
import { MCCategory } from '@/lib/mcLicenseValidation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PaymentMethodSelector, PaymentMethod } from '@/components/booking/PaymentMethodSelector';
import { PaymentPlanSelector, PaymentPlan } from '@/components/booking/PaymentPlanSelector';

const CreateBookingPage = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signUp } = useAuth();

  const [vehicle, setVehicle] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'account' | 'success'>('details');
  const [licenseValid, setLicenseValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<Record<string, unknown> | null>(null);
  const [lessorPaymentSettings, setLessorPaymentSettings] = useState<{
    accepted_payment_methods: PaymentMethod[];
    mobilepay_number: string | null;
    bank_reg_number: string | null;
    bank_account_number: string | null;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan>('upfront');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    acceptTerms: false,
    // Account creation fields
    password: '',
    confirmPassword: '',
    // Pickup/Dropoff times
    pickupTime: '10:00',
    dropoffTime: '08:00',
  });

  // Parse dates from URL params
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null;
  const periodType = (searchParams.get('periodType') as 'daily' | 'weekly' | 'monthly') || 'daily';
  const periodCount = parseInt(searchParams.get('periodCount') || '1');

  // Fetch vehicle data and lessor payment settings
  useEffect(() => {
    const fetchVehicleAndPaymentSettings = async () => {
      if (!vehicleId) return;

      try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles_public')
          .select('*')
          .eq('id', vehicleId)
          .single();

        if (vehicleError) throw vehicleError;
        setVehicle(vehicleData);
        
        // Set default pickup/dropoff times from vehicle settings
        const vehicleAny = vehicleData;
        setFormData(prev => ({
          ...prev,
          pickupTime: vehicleAny.default_pickup_time || '10:00',
          dropoffTime: vehicleAny.default_dropoff_time || '08:00',
        }));

        // Fetch lessor's payment settings
        if (vehicleData?.owner_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('accepted_payment_methods, mobilepay_number, bank_reg_number, bank_account_number')
            .eq('id', vehicleData.owner_id)
            .single();

          if (!profileError && profileData) {
            const acceptedMethods = (profileData.accepted_payment_methods as PaymentMethod[]) || ['cash'];
            setLessorPaymentSettings({
              accepted_payment_methods: acceptedMethods,
              mobilepay_number: profileData.mobilepay_number,
              bank_reg_number: profileData.bank_reg_number,
              bank_account_number: profileData.bank_account_number,
            });
            // Auto-select first available method
            if (acceptedMethods.length > 0) {
              setSelectedPaymentMethod(acceptedMethods[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke hente køretøjsoplysninger',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicleAndPaymentSettings();
  }, [vehicleId]);

  // Determine vehicle type
  const vehicleType = vehicle?.vehicle_type as string;
  const isMCOrScooter = vehicleType === 'motorcykel' || vehicleType === 'scooter';
  const mcCategory = isMCOrScooter ? (vehicle?.mc_category as MCCategory) : null;

  // Check if subscription is available for this vehicle
  const subscriptionAvailable = vehicle?.subscription_available === true;
  const subscriptionMonthlyPrice = vehicle?.subscription_monthly_price || vehicle?.monthly_price;

  // Calculate pricing based on selected payment plan
  const pricing = useMemo(() => {
    if (!vehicle) return { unitPrice: 0, unitLabel: '', totalPrice: 0, periodCount: 1, periodType: 'daily', days: 1, isSubscription: false };

    let unitPrice = 0;
    let unitLabel = '';
    let totalPrice = 0;
    let days = 1;

    // Calculate actual days from dates - this is the source of truth
    if (startDate && endDate) {
      // For daily rentals: Jan 22 to Jan 24 means pickup on 22, return on 24 = 2 rental days
      // differenceInDays gives us the number of nights, which equals rental days
      days = Math.max(1, differenceInDays(endDate, startDate));
    }

    // If subscription is selected, use subscription pricing
    if (selectedPaymentPlan === 'subscription' && subscriptionAvailable) {
      unitPrice = subscriptionMonthlyPrice || (vehicle.daily_price || 0) * 30;
      unitLabel = 'pr. måned (abonnement)';
      totalPrice = unitPrice; // First month only
      return { unitPrice, unitLabel, totalPrice, periodCount: 1, periodType: 'monthly', days, isSubscription: true };
    }

    // Standard pricing based on period type
    // Use the calculated days for daily pricing to ensure consistency with displayed dates
    switch (periodType) {
      case 'monthly':
        unitPrice = vehicle.monthly_price || (vehicle.daily_price || 0) * 30;
        unitLabel = 'pr. måned';
        totalPrice = unitPrice * periodCount;
        break;
      case 'weekly':
        unitPrice = vehicle.weekly_price || (vehicle.daily_price || 0) * 7;
        unitLabel = 'pr. uge';
        totalPrice = unitPrice * periodCount;
        break;
      default:
        // For daily rentals, use actual days calculated from dates
        unitPrice = vehicle.daily_price || 0;
        unitLabel = 'pr. dag';
        totalPrice = unitPrice * days;
    }

    return { unitPrice, unitLabel, totalPrice, periodCount: days, periodType, days, isSubscription: false };
  }, [vehicle, startDate, endDate, periodType, periodCount, selectedPaymentPlan, subscriptionAvailable, subscriptionMonthlyPrice]);

  // Handle proceeding to account step
  const handleProceedToAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast({ title: 'Udfyld alle felter', description: 'Navn, email og telefon er påkrævet', variant: 'destructive' });
      return;
    }

    if (!formData.acceptTerms) {
      toast({ title: 'Acceptér betingelser', description: 'Du skal acceptere lejebetingelserne', variant: 'destructive' });
      return;
    }

    if (isMCOrScooter && !licenseValid) {
      toast({ title: 'Kørekort kræves', description: 'Du skal have gyldigt kørekort til denne køretøjstype', variant: 'destructive' });
      return;
    }

    if (!startDate || !endDate) {
      toast({ title: 'Vælg datoer', description: 'Vælg venligst start- og slutdato', variant: 'destructive' });
      return;
    }

    // Validate payment method selection if lessor has configured payment methods
    if (lessorPaymentSettings && lessorPaymentSettings.accepted_payment_methods.length > 0 && !selectedPaymentMethod) {
      toast({ title: 'Vælg betalingsmetode', description: 'Du skal vælge en betalingsmetode', variant: 'destructive' });
      return;
    }

    // If user is already logged in, create booking directly
    if (user) {
      await createBookingAndFinish();
      return;
    }

    // Store pending booking data and proceed to account creation
    setPendingBookingData({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      notes: formData.notes,
    });
    setStep('account');
  };

  // Create booking (called after account creation or if already logged in)
  const createBookingAndFinish = async (userId?: string) => {
    setIsSubmitting(true);

    try {
      // Fetch full vehicle data
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('owner_id, registration, current_location_id')
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicleData) throw new Error('Kunne ikke finde køretøj');

      const bookingData = pendingBookingData || formData;

      // Create booking
      const { data: createdBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          vehicle_id: vehicleId,
          lessor_id: vehicleData.owner_id,
          renter_id: userId || user?.id || null,
          start_date: format(startDate!, 'yyyy-MM-dd'),
          end_date: pricing.isSubscription ? format(addMonths(startDate!, 1), 'yyyy-MM-dd') : format(endDate!, 'yyyy-MM-dd'),
          total_price: pricing.totalPrice,
          status: 'pending',
          renter_name: bookingData.name,
          renter_email: bookingData.email || formData.email,
          renter_phone: bookingData.phone,
          notes: pricing.isSubscription ? `Abonnement - løbende månedlig betaling. ${bookingData.notes || ''}`.trim() : (bookingData.notes || null),
          pickup_location_id: vehicleData.current_location_id || null,
          dropoff_location_id: vehicleData.current_location_id || null,
          payment_method: selectedPaymentMethod,
          // Pricing details for contract
          period_type: pricing.isSubscription ? 'monthly' : periodType,
          period_count: pricing.isSubscription ? 1 : periodCount,
          daily_price: vehicle?.daily_price || null,
          weekly_price: vehicle?.weekly_price || null,
          monthly_price: pricing.isSubscription ? pricing.unitPrice : (vehicle?.monthly_price || null),
          base_price: pricing.unitPrice,
          included_km: vehicle?.included_km || null,
          extra_km_price: vehicle?.extra_km_price || null,
          unlimited_km: vehicle?.unlimited_km || false,
          original_deductible: 5000,
          pickup_time: formData.pickupTime,
          dropoff_time: formData.dropoffTime,
        })
        .select('id')
        .single();

      if (bookingError) throw new Error('Kunne ikke oprette booking');

      // If subscription selected, create recurring rental entry
      if (pricing.isSubscription && createdBooking) {
        const nextBillingDate = addMonths(startDate!, 1);
        await supabase
          .from('recurring_rentals')
          .insert({
            booking_id: createdBooking.id,
            vehicle_id: vehicleId!,
            lessor_id: vehicleData.owner_id,
            renter_id: userId || user?.id || null,
            renter_email: bookingData.email || formData.email,
            renter_name: bookingData.name,
            renter_phone: bookingData.phone,
            monthly_price: pricing.unitPrice,
            deposit_amount: 0,
            included_km: vehicle?.included_km || 100,
            extra_km_price: vehicle?.extra_km_price || 2.5,
            billing_day: startDate!.getDate(),
            next_billing_date: format(nextBillingDate, 'yyyy-MM-dd'),
            status: 'active',
          });
      }

      // Send notification to lessor
      try {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', vehicleData.owner_id)
          .single();

        if (ownerProfile) {
          await supabase.functions.invoke('send-booking-notification', {
            body: {
              lessorEmail: ownerProfile.email,
              lessorName: ownerProfile.full_name || 'Udlejer',
              renterName: bookingData.name,
              renterEmail: bookingData.email || formData.email,
              renterPhone: bookingData.phone,
              vehicleMake: vehicle.make,
              vehicleModel: vehicle.model,
              startDate: format(startDate!, 'dd. MMMM yyyy', { locale: da }),
              endDate: format(endDate!, 'dd. MMMM yyyy', { locale: da }),
              totalPrice: pricing.totalPrice,
              notes: bookingData.notes,
            },
          });
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
        // Don't fail the booking if notification fails
      }

      setStep('success');
      toast({ title: 'Booking sendt!', description: 'Du vil modtage en bekræftelse på email' });
    } catch (error) {
      console.error('Booking error:', error);
      toast({ title: 'Fejl', description: error instanceof Error ? error.message : 'Der opstod en fejl', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle account creation and then booking
  const handleCreateAccountAndBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || formData.password.length < 6) {
      toast({ title: 'Adgangskode påkrævet', description: 'Adgangskoden skal være mindst 6 tegn', variant: 'destructive' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Adgangskoder matcher ikke', description: 'Bekræft at begge adgangskoder er ens', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create account
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        pendingBookingData?.name || formData.name,
        'privat' // Default to private user
      );

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({ 
            title: 'Email allerede registreret', 
            description: 'Log ind eller brug en anden email',
            variant: 'destructive' 
          });
        } else {
          throw signUpError;
        }
        setIsSubmitting(false);
        return;
      }

      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get the newly created user
      const { data: { user: newUser } } = await supabase.auth.getUser();

      // Create booking with the new user ID
      await createBookingAndFinish(newUser?.id);

    } catch (error) {
      console.error('Account creation error:', error);
      toast({ 
        title: 'Fejl ved oprettelse', 
        description: error instanceof Error ? error.message : 'Der opstod en fejl',
        variant: 'destructive' 
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Køretøj ikke fundet</h2>
          <Button variant="outline" onClick={() => navigate('/search')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage til søgning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => step === 'account' ? setStep('details') : navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                {isMCOrScooter ? <Bike className="w-6 h-6 text-primary" /> : <Car className="w-6 h-6 text-primary" />}
                Book {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-muted-foreground">
                {step === 'details' && 'Udfyld dine oplysninger'}
                {step === 'account' && 'Opret konto for at modtage lejekontrakt'}
                {step === 'success' && 'Booking gennemført'}
              </p>
            </div>
          </div>

          {/* Progress steps */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-mint text-white'}`}>
                {step === 'account' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-12 h-1 rounded ${step === 'account' ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'account' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
            </div>
          )}

          {step === 'success' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-mint" />
                </div>
                <h2 className="text-xl font-bold mb-2">Booking sendt!</h2>
                <p className="text-muted-foreground mb-2">
                  Din forespørgsel er sendt til udlejeren. Du vil modtage en bekræftelse på email.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Din konto er oprettet og du kan nu logge ind for at se dine bookinger og lejekontrakter.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate('/search')}>Tilbage til søgning</Button>
                  <Button onClick={() => navigate('/my-rentals')}>Se mine bookinger</Button>
                </div>
              </CardContent>
            </Card>
          ) : step === 'account' ? (
            <>
              {/* Account Creation Step */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Opret din konto
                  </CardTitle>
                  <CardDescription>
                    For at modtage din lejekontrakt og kunne administrere din booking, skal du oprette en konto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAccountAndBook} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-display">Email</Label>
                      <Input
                        id="email-display"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Din email bruges som login</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Adgangskode *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Mindst 6 tegn"
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Bekræft adgangskode *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Gentag adgangskode"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep('details')} className="flex-1">
                        Tilbage
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Opretter...
                          </>
                        ) : (
                          'Opret konto & book'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Summary in account step */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Booking oversigt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Køretøj:</span>
                    <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periode:</span>
                    <span className="font-medium">
                      {startDate && endDate && `${format(startDate, 'dd. MMM', { locale: da })} - ${format(endDate, 'dd. MMM yyyy', { locale: da })}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">{pricing.totalPrice.toLocaleString('da-DK')} kr</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Afhentningssted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VehicleLocationMap
                    latitude={vehicle.latitude}
                    longitude={vehicle.longitude}
                    address={vehicle.location_address || vehicle.display_address}
                    postalCode={vehicle.location_postal_code || vehicle.display_postal_code}
                    city={vehicle.location_city || vehicle.display_city}
                    className="h-40"
                  />
                </CardContent>
              </Card>

              {/* Pickup/Dropoff Times */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Afhentnings- og afleveringstid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime">Afhentning kl.</Label>
                      <Input
                        id="pickupTime"
                        type="time"
                        value={formData.pickupTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, pickupTime: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Tidligst kl. {(vehicle)?.default_pickup_time || '10:00'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dropoffTime">Aflevering senest kl.</Label>
                      <Input
                        id="dropoffTime"
                        type="time"
                        value={formData.dropoffTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, dropoffTime: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Senest kl. {(vehicle)?.default_dropoff_time || '08:00'}
                      </p>
                    </div>
                  </div>
                  {(vehicle)?.late_return_charge_enabled !== false && (
                    <p className="text-xs text-destructive mt-3">
                      ⚠️ Ved aflevering efter kl. {(vehicle)?.default_dropoff_time || '08:00'} opkræves gebyr for en ekstra lejedag
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Plan Selection - only show if subscription is available AND rental is at least 1 month */}
              {subscriptionAvailable && (periodType === 'monthly' || pricing.days >= 30) && (
                <Card>
                  <CardContent className="pt-6">
                    <PaymentPlanSelector
                      selectedPlan={selectedPaymentPlan}
                      onPlanChange={setSelectedPaymentPlan}
                      subscriptionAvailable={subscriptionAvailable}
                      monthlyPrice={subscriptionMonthlyPrice}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking oversigt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Køretøj:</span>
                    <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                  </div>
                  {pricing.isSubscription && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium text-accent">Månedligt abonnement</span>
                    </div>
                  )}
                  {startDate && endDate && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Periode:</span>
                        <span className="font-medium">
                          {format(startDate, 'dd. MMM', { locale: da })} - {format(endDate, 'dd. MMM yyyy', { locale: da })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Afhentning:</span>
                        <span className="font-medium">kl. {formData.pickupTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Aflevering senest:</span>
                        <span className="font-medium">kl. {formData.dropoffTime}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pris {pricing.unitLabel}:</span>
                    <span className="font-medium">{pricing.unitPrice.toLocaleString('da-DK')} kr</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-semibold">{pricing.isSubscription ? 'Første måned:' : 'Total:'}</span>
                    <span className="font-bold text-lg text-primary">{pricing.totalPrice.toLocaleString('da-DK')} kr</span>
                  </div>
                  {pricing.isSubscription && (
                    <p className="text-xs text-muted-foreground mt-2">
                      * Herefter trækkes {pricing.unitPrice.toLocaleString('da-DK')} kr automatisk hver måned
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Selection */}
              {lessorPaymentSettings && lessorPaymentSettings.accepted_payment_methods.length > 0 && (
                <PaymentMethodSelector
                  acceptedMethods={lessorPaymentSettings.accepted_payment_methods}
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={setSelectedPaymentMethod}
                  lessorPaymentDetails={{
                    mobilepay_number: lessorPaymentSettings.mobilepay_number,
                    bank_reg_number: lessorPaymentSettings.bank_reg_number,
                    bank_account_number: lessorPaymentSettings.bank_account_number,
                  }}
                />
              )}

              {/* MC License Check */}
              {isMCOrScooter && mcCategory && (
                <MCLicenseCheck mcCategory={mcCategory} onValidationChange={setLicenseValid} />
              )}

              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Dine oplysninger</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProceedToAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Fulde navn *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Dit navn"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="din@email.dk"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+45 12 34 56 78"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Bemærkninger</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Eventuelle spørgsmål eller ønsker..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked === true }))}
                      />
                      <Label htmlFor="terms" className="text-sm cursor-pointer">
                        Jeg accepterer lejebetingelserne
                      </Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                        Annuller
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Sender...
                          </>
                        ) : user ? (
                          'Send booking'
                        ) : (
                          'Fortsæt til oprettelse'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateBookingPage;
