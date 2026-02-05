import { useState, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { safeStorage } from "@/lib/safeStorage";

const CookieBanner = forwardRef<HTMLDivElement>((props, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = safeStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    safeStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    safeStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div ref={ref} className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500" {...props}>
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
            <Cookie className="w-6 h-6 text-secondary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground mb-1">
              Vi bruger cookies 🍪
            </h3>
            <p className="text-sm text-muted-foreground">
              Vi bruger cookies for at forbedre din oplevelse på LEJIO. Ved at fortsætte accepterer du vores{" "}
              <Link to="/privatlivspolitik" className="text-primary hover:underline">
                privatlivspolitik
              </Link>
              .
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 md:flex-none"
            >
              Afvis
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 md:flex-none bg-primary hover:bg-primary/90"
            >
              Acceptér
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

CookieBanner.displayName = "CookieBanner";

export default CookieBanner;
