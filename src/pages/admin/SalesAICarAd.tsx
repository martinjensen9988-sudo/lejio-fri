import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  Loader2, 
  Car, 
  Copy, 
  Check,
  MessageSquare,
  Sparkles,
  DollarSign,
  Clipboard
} from 'lucide-react';

interface CarAdAnalysis {
  carInfo: {
    make: string;
    model: string;
    year: string;
    estimatedValue: string;
    features: string[];
  } | null;
  estimatedMonthlyRental: string;
  message: string;
  shortMessage: string;
}

const SalesAICarAdPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CarAdAnalysis | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Handle paste from clipboard
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Show preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviewImage(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          
          // Analyze
          await analyzeImage(file);
        }
        break;
      }
    }
  }, []);

  // Add global paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 and analyze
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('analyze-car-ad', {
        body: { imageBase64: base64 }
      });

      if (error) {
        console.error('Error analyzing ad:', error);
        toast.error('Kunne ikke analysere annoncen');
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data);
      toast.success('Annonce analyseret!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Der opstod en fejl');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Kopieret til udklipsholder');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Kunne ikke kopiere');
    }
  };

  const resetAnalysis = () => {
    setPreviewImage(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AdminDashboardLayout activeTab="sales-ai">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sales-ai')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Analysér Bilannonce</h2>
            <p className="text-muted-foreground">
              Upload et billede af en Facebook-annonce og få en salgstekst genereret
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Upload Annonce
              </CardTitle>
              <CardDescription>
                Tag et screenshot af en bilannonce fra Facebook eller upload et billede
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              {!previewImage ? (
                <button
                  ref={dropZoneRef}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  disabled={isAnalyzing}
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Clipboard className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Indsæt billede (Ctrl+V)</p>
                    <p className="text-sm text-muted-foreground">eller klik for at uploade</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="w-3 h-3" />
                    <span>Understøtter PNG, JPG, WEBP</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={previewImage} 
                      alt="Annonce preview" 
                      className="w-full rounded-lg max-h-96 object-contain bg-muted"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm font-medium">Analyserer annonce...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={resetAnalysis}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    Upload nyt billede
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis?.carInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Bil Identificeret
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mærke</p>
                      <p className="font-medium">{analysis.carInfo.make || 'Ukendt'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{analysis.carInfo.model || 'Ukendt'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Årgang</p>
                      <p className="font-medium">{analysis.carInfo.year || 'Ukendt'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimeret værdi</p>
                      <p className="font-medium">{analysis.carInfo.estimatedValue || 'Ukendt'}</p>
                    </div>
                  </div>
                  {analysis.carInfo.features && analysis.carInfo.features.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Features</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.carInfo.features.map((feature, i) => (
                          <span 
                            key={i}
                            className="px-2 py-1 bg-muted rounded-md text-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {analysis?.estimatedMonthlyRental && (
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-400">Estimeret månedlig lejeindtægt</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {analysis.estimatedMonthlyRental}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis?.message && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Genereret Salgsbesked
                  </CardTitle>
                  <CardDescription>
                    Kopier denne besked og send til sælgeren
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      value={analysis.message}
                      readOnly
                      rows={10}
                      className="pr-12"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(analysis.message, 'message')}
                    >
                      {copiedField === 'message' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis?.shortMessage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Kort Besked (Messenger/SMS)
                  </CardTitle>
                  <CardDescription>
                    Kortere version til hurtige beskeder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Textarea 
                      value={analysis.shortMessage}
                      readOnly
                      rows={4}
                      className="pr-12"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(analysis.shortMessage, 'shortMessage')}
                    >
                      {copiedField === 'shortMessage' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!analysis && !isAnalyzing && previewImage && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI analyserer dit billede...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default SalesAICarAdPage;
