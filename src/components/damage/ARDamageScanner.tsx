import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Camera,
  ScanLine,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  RotateCcw,
  Save,
  ChevronRight,
  Sparkles,
  Car,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DetectedDamage {
  id: string;
  position: string;
  severity: 'minor' | 'moderate' | 'severe';
  damageType: string;
  description: string;
  confidence: number;
  imageUrl?: string;
}

interface ScanResult {
  area: string;
  areaLabel: string;
  imageUrl: string;
  damages: DetectedDamage[];
  scannedAt: string;
}

interface ARDamageScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleInfo: {
    id: string;
    make: string;
    model: string;
    registration: string;
  };
  mode: 'check_in' | 'check_out';
  onComplete: (results: ScanResult[]) => void;
}

const SCAN_AREAS = [
  { id: 'front', label: 'Front', instruction: 'Tag et billede af bilens forside (kofanger, lygte, motorhjelm)' },
  { id: 'left-side', label: 'Venstre side', instruction: 'Tag et billede af venstre side (dør, skærm, spejl)' },
  { id: 'right-side', label: 'Højre side', instruction: 'Tag et billede af højre side (dør, skærm, spejl)' },
  { id: 'rear', label: 'Bagside', instruction: 'Tag et billede af bilens bagside (kofanger, lygte, bagklap)' },
  { id: 'interior', label: 'Kabine', instruction: 'Tag et billede af kabinen (sæder, rat, instrumentbræt)' },
];

const SEVERITY_CONFIG = {
  minor: { label: 'Mindre', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-100' },
  moderate: { label: 'Moderat', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-100' },
  severe: { label: 'Alvorlig', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-100' },
};

export const ARDamageScanner = ({
  open,
  onOpenChange,
  vehicleInfo,
  mode,
  onComplete
}: ARDamageScannerProps) => {
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentArea = SCAN_AREAS[currentAreaIndex];
  const progress = ((currentAreaIndex + (scanResults.length > currentAreaIndex ? 1 : 0)) / SCAN_AREAS.length) * 100;

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (open && !showResults) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [open, showResults]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Kunne ikke starte kamera. Tjek tilladelser.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const analyzeImage = async (imageUrl: string): Promise<DetectedDamage[]> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-vehicle-damage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            image: imageUrl,
            vehicleArea: currentArea.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analyse fejlede');
      }

      const result = await response.json();
      return (result.damages || []).map((d: unknown, i: number) => ({
        ...d,
        id: `${currentArea.id}-${i}-${Date.now()}`,
        imageUrl,
      }));
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  };

  const handleCapture = async () => {
    const image = captureImage();
    if (!image) {
      toast.error('Kunne ikke tage billede');
      return;
    }

    setCapturedImage(image);
    setIsAnalyzing(true);

    try {
      const damages = await analyzeImage(image);

      const result: ScanResult = {
        area: currentArea.id,
        areaLabel: currentArea.label,
        imageUrl: image,
        damages,
        scannedAt: new Date().toISOString(),
      };

      setScanResults(prev => [...prev.filter(r => r.area !== currentArea.id), result]);

      if (damages.length > 0) {
        toast.warning(`Fundet ${damages.length} ${damages.length === 1 ? 'skade' : 'skader'} på ${currentArea.label.toLowerCase()}`);
      } else {
        toast.success(`Ingen skader fundet på ${currentArea.label.toLowerCase()}`);
      }

      // Move to next area or show results
      if (currentAreaIndex < SCAN_AREAS.length - 1) {
        setCapturedImage(null);
        setCurrentAreaIndex(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Analyse fejlede');
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSkipArea = () => {
    if (currentAreaIndex < SCAN_AREAS.length - 1) {
      setCurrentAreaIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleComplete = () => {
    onComplete(scanResults);
    onOpenChange(false);
    resetScanner();
  };

  const resetScanner = () => {
    setCurrentAreaIndex(0);
    setScanResults([]);
    setCapturedImage(null);
    setShowResults(false);
  };

  const totalDamages = scanResults.reduce((acc, r) => acc + r.damages.length, 0);
  const hasSevereDamage = scanResults.some(r => r.damages.some(d => d.severity === 'severe'));

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetScanner();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />

        {!showResults ? (
          <>
            {/* Scanner Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  AR Skadesscanner
                </DialogTitle>
              </DialogHeader>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {vehicleInfo.make} {vehicleInfo.model} • {vehicleInfo.registration}
                  </span>
                  <Badge variant={mode === 'check_in' ? 'default' : 'secondary'}>
                    {mode === 'check_in' ? 'Check-in' : 'Check-out'}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Område {currentAreaIndex + 1} af {SCAN_AREAS.length}</span>
                  <span>{Math.round(progress)}% færdig</span>
                </div>
              </div>
            </div>

            {/* Camera View */}
            <div className="relative bg-black aspect-video">
              {cameraActive && !capturedImage ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* AR Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner guides */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/70" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/70" />
                    <div className="absolute bottom-20 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/70" />
                    <div className="absolute bottom-20 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/70" />

                    {/* Scan line animation */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" 
                      style={{ animation: 'scanLine 2s ease-in-out infinite' }} 
                    />
                  </div>
                </>
              ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                    <div className="absolute inset-0 animate-ping">
                      <Sparkles className="w-10 h-10 text-primary/50" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">AI analyserer billede...</p>
                  <p className="text-xs text-muted-foreground">Leder efter skader, ridser og buler</p>
                </div>
              )}
            </div>

            {/* Instructions & Controls */}
            <div className="p-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-start gap-2">
                  <Camera className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{currentArea.label}</p>
                    <p className="text-sm text-muted-foreground">{currentArea.instruction}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {capturedImage && !isAnalyzing ? (
                  <Button variant="outline" onClick={handleRetake} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tag nyt billede
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleSkipArea} className="flex-1" disabled={isAnalyzing}>
                    Spring over
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                <Button 
                  onClick={handleCapture} 
                  disabled={isAnalyzing || !cameraActive || !!capturedImage}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyserer...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Tag billede
                    </>
                  )}
                </Button>
              </div>

              {/* Quick stats */}
              {scanResults.length > 0 && (
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>{scanResults.length} områder scannet</span>
                  <span>•</span>
                  <span className={totalDamages > 0 ? 'text-amber-600 font-medium' : ''}>
                    {totalDamages} skader fundet
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Results View */
          <>
            <div className="p-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Scanning fuldført
                </DialogTitle>
              </DialogHeader>
            </div>

            <ScrollArea className="max-h-[60vh]">
              <div className="p-4 space-y-4">
                {/* Summary Card */}
                <Card className={cn(
                  "border-2",
                  hasSevereDamage ? "border-red-300 bg-red-50" : 
                  totalDamages > 0 ? "border-amber-300 bg-amber-50" : 
                  "border-green-300 bg-green-50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {hasSevereDamage ? (
                        <XCircle className="w-8 h-8 text-red-600" />
                      ) : totalDamages > 0 ? (
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      )}
                      <div>
                        <p className="font-semibold text-lg">
                          {totalDamages === 0 ? 'Ingen skader fundet' : `${totalDamages} ${totalDamages === 1 ? 'skade' : 'skader'} fundet`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {scanResults.length} af {SCAN_AREAS.length} områder scannet
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Damage List by Area */}
                {scanResults.map((result) => (
                  <Card key={result.area}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{result.areaLabel}</span>
                        </div>
                        {result.damages.length === 0 ? (
                          <Badge variant="outline" className="bg-green-100 text-green-700">OK</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700">
                            {result.damages.length} skade{result.damages.length !== 1 && 'r'}
                          </Badge>
                        )}
                      </div>

                      {result.damages.length > 0 && (
                        <div className="space-y-2">
                          {result.damages.map((damage) => (
                            <div
                              key={damage.id}
                              className={cn(
                                "p-2 rounded-lg border",
                                SEVERITY_CONFIG[damage.severity].bgLight
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full",
                                      SEVERITY_CONFIG[damage.severity].color
                                    )} />
                                    <span className="font-medium text-sm capitalize">
                                      {damage.damageType}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {SEVERITY_CONFIG[damage.severity].label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {damage.description}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(damage.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.imageUrl && (
                        <Button variant="ghost" size="sm" className="mt-2 w-full" asChild>
                          <a href={result.imageUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-2" />
                            Se billede
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" onClick={resetScanner} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Scan igen
              </Button>
              <Button onClick={handleComplete} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Gem rapport
              </Button>
            </div>
          </>
        )}
      </DialogContent>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(300px); opacity: 1; }
        }
      `}</style>
    </Dialog>
  );
};
