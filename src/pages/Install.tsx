import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Monitor, Tablet, Download, Check, Share, Plus, MoreVertical } from 'lucide-react';
import LejioLogo from '@/components/LejioLogo';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cream to-background">
      <header className="container mx-auto px-4 py-6">
        <Link to="/">
          <LejioLogo />
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <img src="/pwa-192x192.png" alt="LEJIO" className="w-16 h-16 rounded-xl" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Installer LEJIO
          </h1>
          <p className="text-muted-foreground text-lg">
            Få den fulde app-oplevelse på din enhed
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-mint/30 bg-mint/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-mint">
                <Check className="w-6 h-6" />
                <span className="font-semibold text-lg">LEJIO er allerede installeret!</span>
              </div>
              <p className="text-muted-foreground mt-2">
                Du kan finde appen på din startskærm eller i din app-liste.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/">Åbn LEJIO</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Native install button for supported browsers */}
            {deferredPrompt && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                    <Download className="w-5 h-5" />
                    Installer LEJIO nu
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Klik for at installere appen direkte
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Platform-specific instructions */}
            <div className="grid gap-4">
              {platform === 'ios' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      iPhone & iPad
                    </CardTitle>
                    <CardDescription>Installer via Safari</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</span>
                        <div>
                          <p className="font-medium">Tryk på Del-knappen</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <Share className="w-4 h-4" />
                            <span>I bunden af Safari</span>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</span>
                        <div>
                          <p className="font-medium">Vælg "Føj til hjemmeskærm"</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <Plus className="w-4 h-4" />
                            <span>Scroll ned i menuen</span>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">3</span>
                        <div>
                          <p className="font-medium">Tryk "Tilføj"</p>
                          <p className="text-muted-foreground text-sm mt-1">LEJIO vil nu være på din hjemmeskærm</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {platform === 'android' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-primary" />
                      Android
                    </CardTitle>
                    <CardDescription>Installer via Chrome</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</span>
                        <div>
                          <p className="font-medium">Tryk på menu-knappen</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <MoreVertical className="w-4 h-4" />
                            <span>De tre prikker øverst til højre</span>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</span>
                        <div>
                          <p className="font-medium">Vælg "Installer app" eller "Føj til startskærm"</p>
                          <p className="text-muted-foreground text-sm mt-1">Afhængigt af din browser</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">3</span>
                        <div>
                          <p className="font-medium">Bekræft installation</p>
                          <p className="text-muted-foreground text-sm mt-1">LEJIO vil nu være på din startskærm</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}

              {platform === 'desktop' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      Computer
                    </CardTitle>
                    <CardDescription>Installer via Chrome, Edge eller andre browsere</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</span>
                        <div>
                          <p className="font-medium">Kig efter installations-ikonet</p>
                          <p className="text-muted-foreground text-sm mt-1">I adresselinjen til højre (ser ud som en skærm med pil)</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</span>
                        <div>
                          <p className="font-medium">Klik på "Installer"</p>
                          <p className="text-muted-foreground text-sm mt-1">Bekræft installationen</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">3</span>
                        <div>
                          <p className="font-medium">Færdig!</p>
                          <p className="text-muted-foreground text-sm mt-1">LEJIO åbner som en selvstændig app</p>
                        </div>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Benefits section */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Fordele ved at installere</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-mint" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Hurtig adgang</p>
                      <p className="text-xs text-muted-foreground">Åbn direkte fra startskærm</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fuld skærm</p>
                      <p className="text-xs text-muted-foreground">Ingen browserlinje</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow/20 flex items-center justify-center shrink-0">
                      <Tablet className="w-5 h-5 text-yellow" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Virker offline</p>
                      <p className="text-xs text-muted-foreground">Basale funktioner uden net</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Install;
