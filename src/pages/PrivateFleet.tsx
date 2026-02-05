import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PrivateFleetExplainer from "@/components/PrivateFleetExplainer";
import CookieBanner from "@/components/CookieBanner";
import { LiveChatWidget } from "@/components/chat/LiveChatWidget";

const PrivateFleet = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <Navigation />
      <main className="flex-1 pt-16">
        <PrivateFleetExplainer />
      </main>
      <Footer />
      <CookieBanner />
      <LiveChatWidget />
    </div>
  );
};

export default PrivateFleet;
