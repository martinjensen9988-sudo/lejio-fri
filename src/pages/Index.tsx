import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import FriPromo from "@/components/FriPromo";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import LeaderSection from "@/components/LeaderSection";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && !location.pathname.startsWith('/admin')) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  // Show nothing while checking auth to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only render landing page for non-logged-in users
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <main className="flex-1">
        <Hero />
        <Features />
        <FriPromo />
        <HowItWorks />
        <Pricing />
        <LeaderSection />
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
};

export default Index;
