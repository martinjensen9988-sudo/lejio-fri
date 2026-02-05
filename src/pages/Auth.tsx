import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { supabase } from '@/integrations/azure/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LejioLogo from "@/components/LejioLogo";
import { toast } from "sonner";
import { z } from "zod";
import { User, ArrowLeft, ArrowRight, Check, Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Validation schemas
const emailSchema = z.string().email("Ugyldig email adresse").max(255);
const passwordSchema = z.string().min(8, "Adgangskode skal være mindst 8 tegn").max(128);
const nameSchema = z.string().min(2, "Navn skal være mindst 2 tegn").max(100);

type AuthMode = "login" | "signup";
type SignupStep = "credentials" | "profile";

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, loading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [signupStep, setSignupStep] = useState<SignupStep>("credentials");
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string | null>(null);
  const { applyReferralCode } = useReferral();
  const [searchParams] = useSearchParams();

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCodeFromUrl(refCode.toUpperCase());
      setMode('signup');
    }
  }, [searchParams]);

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      toast.error('Google login fejlede: ' + error.message);
    }
  };


  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateField = (field: string, value: string): string | null => {
    try {
      switch (field) {
        case "email": emailSchema.parse(value); break;
        case "password": passwordSchema.parse(value); break;
        case "fullName": nameSchema.parse(value); break;
      }
      return null;
    } catch (e) {
      if (e instanceof z.ZodError) return e.errors[0].message;
      return "Ugyldig værdi";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);

    if (emailError || passwordError) {
      setErrors({ email: emailError || "", password: passwordError || "" });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Forkert email eller adgangskode");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Velkommen tilbage!");
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);
    const nameError = validateField("fullName", fullName);

    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Adgangskoderne matcher ikke" }));
      return;
    }

    if (emailError || passwordError || nameError) {
      setErrors({ email: emailError || "", password: passwordError || "", fullName: nameError || "" });
      return;
    }

    if (!acceptedTerms) {
      toast.error('Du skal acceptere udlejervilkårene', { description: 'Marker boksen for at fortsætte.' });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email, password, fullName, "privat");
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        toast.error("Denne email er allerede registreret. Prøv at logge ind i stedet.");
      } else {
        toast.error(error.message);
      }
    } else {
      if (referralCodeFromUrl) {
        setTimeout(async () => {
          const result = await applyReferralCode(referralCodeFromUrl);
          if (result.success) {
            toast.success("Henvisningskode anvendt! Du får 500 kr. rabat på din første månedsleasing");
          }
        }, 1000);
      }
      toast.success("Konto oprettet! Velkommen til LEJIO 🎉");
      navigate("/");
    }
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword("");
    setFullName(""); setPhone("");
    setAcceptedTerms(false);
    setErrors({}); setSignupStep("credentials");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xl font-medium">Indlæser...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/15 rounded-full blur-[150px] animate-float" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lavender/10 rounded-full blur-[200px]" />

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block cursor-pointer" onClick={() => navigate("/")}>
            <LejioLogo />
          </div>
          <p className="text-muted-foreground mt-2">
            {mode === "login" ? "Log ind på din konto" : "Opret din konto"}
          </p>
        </div>

        {/* Referral Code Banner */}
        {referralCodeFromUrl && mode === 'signup' && (
          <motion.div 
            className="glass border border-mint/40 rounded-xl p-4 mb-4 flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-10 h-10 bg-mint/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-mint" />
            </div>
            <div>
              <p className="font-semibold text-mint">Henvisningskode aktiveret!</p>
              <p className="text-sm text-muted-foreground">Du får 500 kr. rabat på din første månedsleasing</p>
            </div>
          </motion.div>
        )}

        {/* Auth Card */}
        <div className="glass-strong rounded-3xl p-8 border border-border/50 glow-border">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.dk"
                  className="rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
                  required
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Adgangskode
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl bg-muted/30 border-border/50 focus:border-primary/50"
                  required
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Logger ind...</> : "Log ind"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Eller</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-3"
                onClick={handleGoogleSignIn}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Fortsæt med Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Har du ikke en konto?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="text-primary font-semibold hover:underline">
                  Opret konto
                </button>
              </p>
            </form>
          ) : (
            <>

              {signupStep === "credentials" && (
                <form onSubmit={(e) => { e.preventDefault(); setSignupStep("profile"); }} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-display font-bold text-foreground">Privat udlejer</h2>
                    <p className="text-sm text-muted-foreground">Trin 1 af 2 - Login oplysninger</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@email.dk" className="rounded-xl bg-muted/30 border-border/50" required />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Adgangskode
                    </Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mindst 8 tegn" className="rounded-xl bg-muted/30 border-border/50" required />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Bekræft adgangskode
                    </Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Gentag adgangskode" className="rounded-xl bg-muted/30 border-border/50" required />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    Fortsæt
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Eller</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full flex items-center justify-center gap-3"
                    onClick={handleGoogleSignIn}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Opret konto med Google
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Har du allerede en konto?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-primary font-semibold hover:underline">
                      Log ind
                    </button>
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    Er du forhandler?{" "}
                    <button type="button" onClick={() => navigate("/forhandler-opret")} className="text-primary font-semibold hover:underline">
                      Ansøg om partnerskab →
                    </button>
                  </p>
                </form>
              )}

              {signupStep === "profile" && (
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <button type="button" onClick={() => setSignupStep("credentials")} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground">Privat udlejer</h2>
                      <p className="text-sm text-muted-foreground">Trin 2 af 2 - Profiloplysninger</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Fulde navn
                    </Label>
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dit fulde navn" className="rounded-xl bg-muted/30 border-border/50" required />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-border bg-muted accent-primary" />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      Jeg accepterer{' '}
                      <a href="/udlejervilkaar" target="_blank" className="text-primary hover:underline">udlejervilkårene</a>
                      {' '}og{' '}
                      <a href="/privatlivspolitik" target="_blank" className="text-primary hover:underline">privatlivspolitikken</a>
                    </label>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Opretter konto...</> : <>Opret konto <ArrowRight className="w-4 h-4" /></>}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
