import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCVRLookup } from "@/hooks/useCVRLookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { z } from "zod";
import { 
  Building2, ArrowLeft, ArrowRight, Check, Mail, Phone, User, 
  Loader2, Car, FileText, PhoneCall, Sparkles, CheckCircle2,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '@/integrations/azure/client';

// Validation schemas
const emailSchema = z.string().email("Ugyldig email").max(255);
const phoneSchema = z.string().min(8, "Telefon skal være mindst 8 cifre").max(20);
const nameSchema = z.string().min(2, "Navn skal være mindst 2 tegn").max(100);
const cvrSchema = z.string().regex(/^\d{8}$/, "CVR-nummer skal være 8 cifre");

type RegistrationPath = "contract" | "wizard" | null;
type WizardStep = 1 | 2 | 3 | 4;

const FLEET_CATEGORIES = [
  { id: "small", label: "Små biler", description: "Mikrobiler, bybiler" },
  { id: "medium", label: "Mellemklasse", description: "Kompakt, sedan" },
  { id: "large", label: "Store biler", description: "Stationcar, SUV" },
  { id: "premium", label: "Premium/Luksus", description: "Premium, sportsvogne" },
  { id: "van", label: "Varevogne", description: "Varebiler, kassevogne" },
  { id: "other", label: "Andre", description: "Motorcykler, campere, trailere" },
];

const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "349",
    vehicles: "1-5 biler",
    commission: "3%",
    features: ["Op til 5 køretøjer", "Ubegrænsede bookinger", "Digitale kontrakter"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "599",
    vehicles: "6-15 biler",
    commission: "3%",
    features: ["Op til 15 køretøjer", "Prioriteret support", "Dashboard & statistik"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "899",
    vehicles: "16-35 biler",
    commission: "3%",
    features: ["Op til 35 køretøjer", "Dedikeret support", "API adgang"],
  },
];

const FLEET_MODELS = [
  {
    id: "partner_starter",
    name: "Partner Starter",
    commission: "15%",
    vehicles: "35+ biler",
    description: "Basis platformadgang, standard support",
  },
  {
    id: "fleet_basic",
    name: "Fleet Basic",
    commission: "25%",
    vehicles: "35+ biler",
    description: "Udvidet synlighed, prioriteret support, analyserapporter",
  },
  {
    id: "fleet_premium",
    name: "Fleet Premium",
    commission: "35%",
    vehicles: "35+ biler",
    description: "Maksimal synlighed, dedikeret account manager, API-adgang",
  },
];

const DealerRegistration = () => {
  const navigate = useNavigate();
  const { lookupCVR, isLoading: cvrLoading } = useCVRLookup();
  
  // Path selection
  const [selectedPath, setSelectedPath] = useState<RegistrationPath>(null);
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  
  // Form data
  const [formData, setFormData] = useState({
    // Company info (Step 1)
    cvrNumber: "",
    companyName: "",
    companyAddress: "",
    
    // Contact info (Step 2)
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    
    // Fleet info (Step 3)
    fleetCounts: {} as Record<string, number>,
    totalVehicles: 0,
    
    // Plan selection (Step 4)
    selectedPlan: "",
    wantsCallback: false,
    notes: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate total vehicles
  const calculateTotal = () => {
    return Object.values(formData.fleetCounts).reduce((sum, count) => sum + (count || 0), 0);
  };

  // Auto-lookup CVR
  const handleCVRChange = async (cvr: string) => {
    setFormData(prev => ({ ...prev, cvrNumber: cvr }));
    
    const cleanCvr = cvr.replace(/\D/g, '');
    if (cleanCvr.length === 8) {
      const result = await lookupCVR(cleanCvr);
      if (result?.companyName && result.isActive) {
        setFormData(prev => ({ 
          ...prev, 
          companyName: result.companyName || "",
          companyAddress: result.address || ""
        }));
        toast.success('Virksomhed fundet!', { description: result.companyName });
      } else if (result?.companyName && !result.isActive) {
        toast.error('Virksomheden er ikke aktiv');
      }
    }
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      try { cvrSchema.parse(formData.cvrNumber); } 
      catch { newErrors.cvrNumber = "CVR-nummer skal være 8 cifre"; }
      if (!formData.companyName) newErrors.companyName = "Virksomhedsnavn er påkrævet";
    }
    
    if (step === 2) {
      try { nameSchema.parse(formData.contactName); } 
      catch { newErrors.contactName = "Navn er påkrævet"; }
      try { emailSchema.parse(formData.contactEmail); } 
      catch { newErrors.contactEmail = "Ugyldig email"; }
      try { phoneSchema.parse(formData.contactPhone); } 
      catch { newErrors.contactPhone = "Telefon er påkrævet"; }
    }
    
    if (step === 3) {
      const total = calculateTotal();
      if (total < 1) newErrors.fleetCounts = "Angiv mindst 1 køretøj";
    }
    
    if (step === 4) {
      if (!formData.selectedPlan && !formData.wantsCallback) {
        newErrors.selectedPlan = "Vælg en plan eller anmod om opkald";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      if (wizardStep < 4) {
        setWizardStep((wizardStep + 1) as WizardStep);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const totalVehicles = calculateTotal();
      
      // Submit to contact_submissions or a dedicated table
      const { error } = await supabase.from('contact_submissions').insert({
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
        message: `
Forhandler-registrering:
- CVR: ${formData.cvrNumber}
- Virksomhed: ${formData.companyName}
- Adresse: ${formData.companyAddress}
- Total køretøjer: ${totalVehicles}
- Fordeling: ${JSON.stringify(formData.fleetCounts)}
- Valgt plan: ${formData.selectedPlan || 'Ønsker opkald'}
- Noter: ${formData.notes || 'Ingen'}
        `.trim(),
        status: 'new',
      });
      
      if (error) throw error;
      
      setShowSuccess(true);
      toast.success('Tak for din henvendelse!', { description: 'Vi kontakter dig snarest.' });
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke sende. Prøv igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContractSubmit = async () => {
    // Validate contract form
    const newErrors: Record<string, string> = {};
    try { cvrSchema.parse(formData.cvrNumber); } catch { newErrors.cvrNumber = "CVR-nummer skal være 8 cifre"; }
    if (!formData.companyName) newErrors.companyName = "Virksomhedsnavn er påkrævet";
    try { nameSchema.parse(formData.contactName); } catch { newErrors.contactName = "Navn er påkrævet"; }
    try { emailSchema.parse(formData.contactEmail); } catch { newErrors.contactEmail = "Ugyldig email"; }
    try { phoneSchema.parse(formData.contactPhone); } catch { newErrors.contactPhone = "Telefon er påkrævet"; }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    setIsSubmitting(true);
    
    try {
      const totalVehicles = calculateTotal();
      
      const { error } = await supabase.from('contact_submissions').insert({
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
        message: `
Forhandler ønsker at blive kontaktet (Hurtig kontakt):
- CVR: ${formData.cvrNumber}
- Virksomhed: ${formData.companyName}
- Antal køretøjer: ${totalVehicles || 'Ikke angivet'}
- Noter: ${formData.notes || 'Ingen'}
        `.trim(),
        status: 'new',
      });
      
      if (error) throw error;
      
      setShowSuccess(true);
      toast.success('Tak! Vi ringer dig op snarest.');
    } catch (err) {
      console.error(err);
      toast.error('Kunne ikke sende. Prøv igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-mint/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-mint" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Tak for din ansøgning!</h1>
            <p className="text-muted-foreground mb-8">
              Vi har modtaget dine oplysninger og gennemgår din ansøgning. 
              Du hører fra os inden for 1-2 hverdage, hvor vi kontakter dig 
              for at færdiggøre din partneroprettelse.
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              Tilbage til forsiden
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary/30 bg-primary/5">
              <Building2 className="w-4 h-4 mr-2 text-primary" />
              Forhandler-ansøgning
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Ansøg om partnerskab hos LEJIO
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Som forhandler gennemgår vi din ansøgning og kontakter dig inden for 1-2 hverdage 
              for at oprette dit partnerskab.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Er du privat udlejer?{" "}
              <a href="/auth" className="text-primary font-semibold hover:underline">
                Opret konto direkte her →
              </a>
            </p>
          </div>

          {/* Path Selection */}
          {!selectedPath && (
            <motion.div 
              className="grid md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Option 1: Quick contact */}
              <Card 
                className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-lg group"
                onClick={() => setSelectedPath("contract")}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-mint/20 to-mint/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PhoneCall className="w-8 h-8 text-mint" />
                  </div>
                  <CardTitle className="text-xl">Ring mig op</CardTitle>
                  <CardDescription>
                    Udfyld kort formular og vi kontakter dig
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-mint" />
                      Personlig rådgivning
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-mint" />
                      Skræddersyet løsning
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-mint" />
                      Svar inden 24 timer
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full group-hover:bg-mint/10">
                    Vælg denne mulighed
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Option 2: Self-service wizard */}
              <Card 
                className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-lg group"
                onClick={() => setSelectedPath("wizard")}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Opret selv</CardTitle>
                  <CardDescription>
                    Gennemgå 4 trin og vælg din plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Hurtig oprettelse
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Se alle planer
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Kom i gang med det samme
                    </li>
                  </ul>
                  <Button className="w-full">
                    Vælg denne mulighed
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Contract/Callback Form (Option 1) */}
          <AnimatePresence mode="wait">
            {selectedPath === "contract" && (
              <motion.div
                key="contract"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPath(null)}>
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div>
                        <CardTitle>Udfyld dine oplysninger</CardTitle>
                        <CardDescription>Vi ringer dig op inden for 24 timer</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CVR-nummer *</Label>
                        <Input
                          value={formData.cvrNumber}
                          onChange={(e) => handleCVRChange(e.target.value)}
                          placeholder="12345678"
                          maxLength={8}
                        />
                        {errors.cvrNumber && <p className="text-sm text-destructive">{errors.cvrNumber}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Virksomhedsnavn *</Label>
                        <Input
                          value={formData.companyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Din Biludlejning ApS"
                        />
                        {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dit navn *</Label>
                        <Input
                          value={formData.contactName}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Hans Hansen"
                        />
                        {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Telefon *</Label>
                        <Input
                          value={formData.contactPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                          placeholder="+45 12 34 56 78"
                        />
                        {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="hans@biludlejning.dk"
                      />
                      {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Hvor mange køretøjer udlejer du?</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.fleetCounts.total || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          fleetCounts: { ...prev.fleetCounts, total: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="Antal køretøjer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Eventuelle noter</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Fortæl os gerne om din forretning..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleContractSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sender...</>
                      ) : (
                        <>Ring mig op <PhoneCall className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Multi-step Wizard (Option 2) */}
            {selectedPath === "wizard" && (
              <motion.div
                key="wizard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                          step === wizardStep 
                            ? 'bg-primary text-primary-foreground' 
                            : step < wizardStep 
                              ? 'bg-mint text-white' 
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step < wizardStep ? <Check className="w-5 h-5" /> : step}
                      </div>
                      {step < 4 && (
                        <div className={`w-12 h-1 mx-1 rounded ${step < wizardStep ? 'bg-mint' : 'bg-muted'}`} />
                      )}
                    </div>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => wizardStep === 1 ? setSelectedPath(null) : setWizardStep((wizardStep - 1) as WizardStep)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div>
                        <CardTitle>
                          {wizardStep === 1 && "Virksomhedsoplysninger"}
                          {wizardStep === 2 && "Kontaktoplysninger"}
                          {wizardStep === 3 && "Din bilflåde"}
                          {wizardStep === 4 && "Vælg din plan"}
                        </CardTitle>
                        <CardDescription>Trin {wizardStep} af 4</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Step 1: Company Info */}
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            CVR-nummer *
                          </Label>
                          <Input
                            value={formData.cvrNumber}
                            onChange={(e) => handleCVRChange(e.target.value)}
                            placeholder="12345678"
                            maxLength={8}
                          />
                          {cvrLoading && <p className="text-sm text-muted-foreground">Søger...</p>}
                          {errors.cvrNumber && <p className="text-sm text-destructive">{errors.cvrNumber}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Virksomhedsnavn *</Label>
                          <Input
                            value={formData.companyName}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            placeholder="Din Biludlejning ApS"
                          />
                          {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Adresse</Label>
                          <Input
                            value={formData.companyAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                            placeholder="Hovedgaden 1, 1000 København"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: Contact Info */}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            Kontaktperson *
                          </Label>
                          <Input
                            value={formData.contactName}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                            placeholder="Hans Hansen"
                          />
                          {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Email *
                          </Label>
                          <Input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                            placeholder="hans@biludlejning.dk"
                          />
                          {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            Telefon *
                          </Label>
                          <Input
                            value={formData.contactPhone}
                            onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                            placeholder="+45 12 34 56 78"
                          />
                          {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone}</p>}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Fleet Info */}
                    {wizardStep === 3 && (
                      <div className="space-y-6">
                        <p className="text-muted-foreground">
                          Fortæl os om din bilflåde. Det hjælper os med at anbefale den rigtige løsning.
                        </p>
                        
                        <div className="grid gap-4">
                          {FLEET_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                              <div>
                                <p className="font-medium">{cat.label}</p>
                                <p className="text-sm text-muted-foreground">{cat.description}</p>
                              </div>
                              <Input
                                type="number"
                                min="0"
                                className="w-20 text-center"
                                value={formData.fleetCounts[cat.id] || ""}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  fleetCounts: { 
                                    ...prev.fleetCounts, 
                                    [cat.id]: parseInt(e.target.value) || 0 
                                  }
                                }))}
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <span className="font-semibold">Total antal køretøjer</span>
                          <span className="text-2xl font-bold text-primary">{calculateTotal()}</span>
                        </div>
                        
                        {errors.fleetCounts && <p className="text-sm text-destructive">{errors.fleetCounts}</p>}
                      </div>
                    )}

                    {/* Step 4: Plan Selection */}
                    {wizardStep === 4 && (
                      <div className="space-y-6">
                        {calculateTotal() <= 35 ? (
                          <>
                            <div>
                              <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Abonnementer
                              </h3>
                              <RadioGroup 
                                value={formData.selectedPlan} 
                                onValueChange={(val) => setFormData(prev => ({ ...prev, selectedPlan: val, wantsCallback: false }))}
                              >
                                <div className="grid gap-3">
                                  {SUBSCRIPTION_PLANS.map((plan) => (
                                    <label
                                      key={plan.id}
                                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                                        formData.selectedPlan === plan.id 
                                          ? 'border-primary bg-primary/5' 
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <RadioGroupItem value={plan.id} />
                                        <div>
                                          <p className="font-semibold">{plan.name}</p>
                                          <p className="text-sm text-muted-foreground">{plan.vehicles} • +{plan.commission} kommission</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xl font-bold">{plan.price} <span className="text-sm font-normal">kr/md</span></p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Fleet-modeller (35+ biler)
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Med over 35 køretøjer anbefaler vi en af vores Fleet-modeller med procentbaseret kommission.
                              </p>
                              <RadioGroup 
                                value={formData.selectedPlan} 
                                onValueChange={(val) => setFormData(prev => ({ ...prev, selectedPlan: val, wantsCallback: false }))}
                              >
                                <div className="grid gap-3">
                                  {FLEET_MODELS.map((model) => (
                                    <label
                                      key={model.id}
                                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                                        formData.selectedPlan === model.id 
                                          ? 'border-primary bg-primary/5' 
                                          : 'border-border hover:border-primary/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <RadioGroupItem value={model.id} />
                                        <div>
                                          <p className="font-semibold">{model.name}</p>
                                          <p className="text-sm text-muted-foreground">{model.description}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xl font-bold text-primary">{model.commission}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        )}

                        {/* Callback option */}
                        <div 
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            formData.wantsCallback 
                              ? 'border-mint bg-mint/5' 
                              : 'border-dashed border-border hover:border-mint/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, wantsCallback: !prev.wantsCallback, selectedPlan: "" }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.wantsCallback ? 'border-mint bg-mint' : 'border-muted-foreground'
                            }`}>
                              {formData.wantsCallback && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-semibold">LEJIO skal hjælpe mig</p>
                              <p className="text-sm text-muted-foreground">Vi ringer dig op og finder den bedste løsning sammen</p>
                            </div>
                          </div>
                        </div>

                        {errors.selectedPlan && <p className="text-sm text-destructive">{errors.selectedPlan}</p>}

                        <div className="space-y-2">
                          <Label>Eventuelle noter</Label>
                          <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Er der noget særligt vi skal vide?"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => wizardStep === 1 ? setSelectedPath(null) : setWizardStep((wizardStep - 1) as WizardStep)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Tilbage
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleNextStep}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sender...</>
                        ) : wizardStep === 4 ? (
                          <>Send anmodning <Check className="w-4 h-4 ml-2" /></>
                        ) : (
                          <>Fortsæt <ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DealerRegistration;
