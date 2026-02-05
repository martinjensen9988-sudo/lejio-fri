import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, ChevronDown, Search, MessageCircle, FileText, Settings, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import LejioLogo from "./LejioLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, profile, signOut, loading } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';
  const showLandingLinks = isHomePage && !user;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 20) {
        setIsVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
        if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate("/");
  };

  const navLinkClass = "text-foreground/80 hover:text-primary font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full";

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: isVisible || isOpen ? 0 : -100 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-sm border-b border-border bg-card/95 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <a href={user ? "/dashboard" : "/"} onClick={(e) => { e.preventDefault(); navigate(user ? "/dashboard" : "/"); }}>
            <LejioLogo size="md" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="/search" onClick={(e) => { e.preventDefault(); navigate("/search"); }} className={navLinkClass}>
              Find bil
            </a>
            
            {showLandingLinks && (
              <>
                <a href="#features" className={navLinkClass}>Funktioner</a>
                <a href="#how-it-works" className={navLinkClass}>Sådan virker det</a>
                <a href="#pricing" className={navLinkClass}>Priser</a>
              </>
            )}
            
            {!user && (
              <a href="/faq" onClick={(e) => { e.preventDefault(); navigate("/faq"); }} className={navLinkClass}>FAQ</a>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-muted rounded-lg animate-pulse" />
            ) : user ? (
              <>
                <Button variant="glass" size="sm" onClick={() => navigate("/my-rentals")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Mine lejeaftaler
                </Button>
                <Button variant="glass" size="sm" onClick={() => navigate("/beskeder")} className="relative">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Beskeder
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border hover:border-primary/40 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${profile?.user_type === 'professionel' ? 'bg-primary animate-pulse' : 'bg-accent'}`} />
                      <span className="text-sm font-medium text-foreground">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </span>
                      {profile?.user_type === 'professionel' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Pro</span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 glass-strong border-border/50">
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Indstillinger
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/corporate")} className="cursor-pointer">
                      <Building2 className="w-4 h-4 mr-2" />
                      Virksomhed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/faq")} className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      FAQ
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log ud
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Log ind</Button>
                <Button variant="warm" size="sm" onClick={() => navigate("/bliv-udlejer")}>Bliv Udlejer</Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="lg:hidden text-foreground p-2.5 rounded-lg bg-muted border border-border hover:border-primary/40 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 flex flex-col gap-1">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-4 rounded-xl glass mb-3">
                      <div className={`w-3 h-3 rounded-full ${profile?.user_type === 'professionel' ? 'bg-primary animate-pulse' : 'bg-accent'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{profile?.full_name || user.email}</span>
                        {profile?.user_type === 'professionel' && (
                          <span className="text-xs text-primary font-medium">Pro-bruger</span>
                        )}
                      </div>
                    </div>
                    
                    <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); setIsOpen(false); }} className="flex items-center gap-3 text-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px]">
                      <User className="w-5 h-5" />
                      Dashboard
                    </a>
                    <a href="/search" onClick={(e) => { e.preventDefault(); navigate("/search"); setIsOpen(false); }} className="flex items-center gap-3 text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px]">
                      <Search className="w-5 h-5" />
                      Find bil
                    </a>
                    <a href="/my-rentals" onClick={(e) => { e.preventDefault(); navigate("/my-rentals"); setIsOpen(false); }} className="flex items-center gap-3 text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px]">
                      <FileText className="w-5 h-5" />
                      Mine lejeaftaler
                    </a>
                    <a href="/beskeder" onClick={(e) => { e.preventDefault(); navigate("/beskeder"); setIsOpen(false); }} className="flex items-center gap-3 text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px]">
                      <MessageCircle className="w-5 h-5" />
                      Beskeder
                      {unreadCount > 0 && (
                        <span className="ml-auto min-w-5 h-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </a>
                    <a href="/settings" onClick={(e) => { e.preventDefault(); navigate("/settings"); setIsOpen(false); }} className="flex items-center gap-3 text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px]">
                      <Settings className="w-5 h-5" />
                      Indstillinger
                    </a>
                    
                    <div className="border-t border-border/50 mt-3 pt-3">
                      <button onClick={handleSignOut} className="flex items-center gap-3 text-destructive font-medium py-3.5 px-4 rounded-xl hover:bg-destructive/10 transition-colors w-full min-h-[48px]">
                        <LogOut className="w-5 h-5" />
                        Log ud
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <a href="/search" onClick={(e) => { e.preventDefault(); navigate("/search"); setIsOpen(false); }} className="text-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px] flex items-center">Find bil</a>
                    <a href="#features" onClick={() => setIsOpen(false)} className="text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px] flex items-center">Funktioner</a>
                    <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px] flex items-center">Sådan virker det</a>
                    <a href="#pricing" onClick={() => setIsOpen(false)} className="text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px] flex items-center">Priser</a>
                    <a href="/faq" onClick={(e) => { e.preventDefault(); navigate("/faq"); setIsOpen(false); }} className="text-muted-foreground font-medium py-3.5 px-4 rounded-xl hover:bg-muted/50 transition-colors min-h-[48px] flex items-center">FAQ</a>
                    
                    <div className="flex flex-col gap-2 pt-4 border-t border-border/50 mt-3">
                      <Button variant="ghost" size="lg" className="w-full h-12" onClick={() => { navigate("/auth"); setIsOpen(false); }}>Log ind</Button>
                      <Button variant="warm" size="lg" className="w-full h-12" onClick={() => { navigate("/bliv-udlejer"); setIsOpen(false); }}>Bliv Udlejer</Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
