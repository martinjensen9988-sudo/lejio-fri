import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Facebook, Car, Sparkles, Send, Loader2, 
  Calendar, RefreshCw, Image, Star, History
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  registration: string;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  description: string | null;
  image_url: string | null;
  fuel_type: string | null;
  owner_id: string;
}

interface FacebookPost {
  id: string;
  vehicle_id: string | null;
  post_id: string;
  message: string;
  image_url: string | null;
  posted_at: string;
  posted_by: string;
  is_dagens_bil: boolean | null;
}

interface DagensBilSetting {
  id: string;
  vehicle_id: string | null;
  auto_rotate: boolean;
  post_time: string;
  last_posted_at: string | null;
}

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'private', label: '🏠 Private lejere', description: 'Privatpersoner der har brug for bil' },
  { value: 'business', label: '🏢 Erhverv/Firma', description: 'Virksomheder og erhvervskunder' },
  { value: 'weekend', label: '🎉 Weekend/Ferie', description: 'Folk der skal på tur eller ferie' },
  { value: 'young', label: '👨‍🎓 Unge lejere', description: 'Studerende og unge voksne' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Familier', description: 'Familier med børn' },
  { value: 'luxury', label: '✨ Luksus/Special', description: 'Kunder der søger premium oplevelser' },
  { value: 'custom', label: '✏️ Fri tekst', description: 'Skriv din egen målgruppe' },
];

const AdminFacebookPosts = () => {
  const isMountedRef = useRef(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postType, setPostType] = useState<'dagens_bil' | 'promotion' | 'custom' | 'lejio_promo'>('dagens_bil');
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  
  // Target audience
  const [targetAudience, setTargetAudience] = useState<string>('private');
  const [customTargetAudience, setCustomTargetAudience] = useState<string>('');
  
  // Dagens Bil settings
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedDagensBil, setSelectedDagensBil] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: data kunne ikke hentes. Prøv igen.')), 12000)
    );

    try {
      await Promise.race([
        (async () => {
          const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('id, make, model, year, registration, daily_price, weekly_price, monthly_price, description, image_url, fuel_type, owner_id')
            .order('created_at', { ascending: false });

          if (vehiclesError) {
            console.error('Error fetching vehicles:', vehiclesError);
            toast.error('Kunne ikke hente køretøjer');
          } else if (isMountedRef.current) {
            setVehicles((vehiclesData || []) as Vehicle[]);
          }

          const { data: postsData, error: postsError } = await supabase
            .from('facebook_posts')
            .select('*')
            .order('posted_at', { ascending: false })
            .limit(50);

          if (postsError) {
            console.error('Error fetching posts:', postsError);
            toast.error('Kunne ikke hente Facebook opslag');
          } else if (isMountedRef.current) {
            setPosts((postsData || []) as FacebookPost[]);
          }
        })(),
        timeout,
      ]);
    } catch (err: unknown) {
      console.error('AdminFacebookPosts fetchData failed:', err);
      toast.error(err?.message || 'Der skete en fejl ved hentning af data');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGeneratePost = async () => {
    // For lejio_promo, we don't need a vehicle
    if (postType !== 'lejio_promo' && !selectedVehicle) {
      toast.error('Vælg venligst et køretøj først');
      return;
    }

    setIsGenerating(true);

    try {
      // Determine the target audience text to send
      const audienceText = targetAudience === 'custom' 
        ? customTargetAudience 
        : TARGET_AUDIENCE_OPTIONS.find(o => o.value === targetAudience)?.label || '';
      
      const { data, error } = await supabase.functions.invoke('generate-facebook-post', {
        body: { 
          vehicle: selectedVehicle, 
          postType,
          targetAudience: audienceText,
        },
      });

      if (error) throw error;

      setGeneratedPost(data.post);
      toast.success('Opslag genereret!');
    } catch (error: unknown) {
      console.error('Error generating post:', error);
      toast.error('Kunne ikke generere opslag: ' + (error.message || 'Ukendt fejl'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostToFacebook = async () => {
    if (!generatedPost.trim()) {
      toast.error('Skriv venligst et opslag');
      return;
    }

    setIsPosting(true);

    try {
      const imageUrl = selectedVehicle?.image_url || null;

      const { data, error } = await supabase.functions.invoke('post-to-facebook', {
        body: { 
          message: generatedPost, 
          vehicleId: selectedVehicle?.id,
          imageUrl,
        },
      });

      if (error) throw error;

      toast.success('Opslaget er nu live på Facebook! 🎉');
      setShowPostDialog(false);
      setGeneratedPost('');
      setSelectedVehicle(null);
      fetchData();
    } catch (error: unknown) {
      console.error('Error posting to Facebook:', error);
      toast.error('Kunne ikke poste til Facebook: ' + (error.message || 'Ukendt fejl'));
    } finally {
      setIsPosting(false);
    }
  };

  const openPostDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setGeneratedPost('');
    setPostType('dagens_bil');
    setTargetAudience('private');
    setCustomTargetAudience('');
    setShowPostDialog(true);
  };

  const openPromoDialog = () => {
    setSelectedVehicle(null);
    setGeneratedPost('');
    setPostType('lejio_promo');
    setTargetAudience('private');
    setCustomTargetAudience('');
    setShowPromoDialog(true);
  };

  const getVehicleById = (id: string | null) => vehicles.find(v => v.id === id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Facebook className="w-10 h-10" />
              <div>
                <p className="text-3xl font-bold">{posts.length}</p>
                <p className="text-sm opacity-90">Facebook opslag</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Car className="w-10 h-10 text-primary" />
              <div>
                <p className="text-3xl font-bold">{vehicles.length}</p>
                <p className="text-sm text-muted-foreground">Tilgængelige biler</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="w-10 h-10 text-yellow-500" />
              <div>
                <p className="text-3xl font-bold">{posts.filter(p => p.is_dagens_bil).length}</p>
                <p className="text-sm text-muted-foreground">Dagens Bil opslag</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">
            <Sparkles className="w-4 h-4 mr-2" />
            Opret opslag
          </TabsTrigger>
          <TabsTrigger value="dagens-bil">
            <Star className="w-4 h-4 mr-2" />
            Dagens Bil
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Historik
          </TabsTrigger>
        </TabsList>

        {/* Create Post Tab */}
        <TabsContent value="create">
          <div className="space-y-6">
            {/* LEJIO Promo Card */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  LEJIO Reklame
                </CardTitle>
                <CardDescription>
                  Opret et generelt reklameopslag for LEJIO uden specifikt køretøj
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={openPromoDialog} className="w-full">
                  <Facebook className="w-4 h-4 mr-2" />
                  Opret LEJIO reklameopslag
                </Button>
              </CardContent>
            </Card>

            {/* Vehicle Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  Opret Facebook Opslag med AI
                </CardTitle>
                <CardDescription>
                  Vælg et køretøj og lad AI generere et engagerende opslag
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Ingen køretøjer tilgængelige</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.slice(0, 12).map((vehicle) => (
                      <Card 
                        key={vehicle.id} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => openPostDialog(vehicle)}
                      >
                        <CardContent className="pt-4">
                          {vehicle.image_url && (
                            <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={vehicle.image_url} 
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                            <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.registration}</p>
                            {vehicle.daily_price && (
                              <Badge variant="secondary">{vehicle.daily_price} kr/dag</Badge>
                            )}
                          </div>
                          <Button className="w-full mt-3" variant="outline" size="sm">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generer opslag
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dagens Bil Tab */}
        <TabsContent value="dagens-bil">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Dagens Bil
              </CardTitle>
              <CardDescription>
                Vælg en bil som "Dagens Bil" eller sæt automatisk rotation op
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Automatisk rotation</Label>
                  <p className="text-sm text-muted-foreground">
                    Systemet vælger automatisk en ny bil hver dag
                  </p>
                </div>
                <Switch 
                  checked={autoRotate} 
                  onCheckedChange={setAutoRotate}
                />
              </div>

              <div className="space-y-3">
                <Label>Vælg dagens bil manuelt</Label>
                <Select value={selectedDagensBil} onValueChange={setSelectedDagensBil}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg et køretøj" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDagensBil && (
                <div className="p-4 border rounded-lg">
                  {(() => {
                    const vehicle = getVehicleById(selectedDagensBil);
                    if (!vehicle) return null;
                    return (
                      <div className="flex items-center gap-4">
                        {vehicle.image_url && (
                          <img 
                            src={vehicle.image_url} 
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="w-24 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.daily_price} kr/dag</p>
                        </div>
                        <Button onClick={() => openPostDialog(vehicle)}>
                          <Facebook className="w-4 h-4 mr-2" />
                          Post som Dagens Bil
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Opslag Historik
              </CardTitle>
              <CardDescription>
                Oversigt over tidligere Facebook opslag
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Facebook className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ingen opslag endnu</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dato</TableHead>
                      <TableHead>Køretøj</TableHead>
                      <TableHead>Opslag</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => {
                      const vehicle = getVehicleById(post.vehicle_id);
                      return (
                        <TableRow key={post.id}>
                          <TableCell>
                            {format(new Date(post.posted_at), 'dd. MMM yyyy HH:mm', { locale: da })}
                          </TableCell>
                          <TableCell>
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : post.vehicle_id ? 'Ukendt' : 'LEJIO Reklame'}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {post.message.substring(0, 100)}...
                          </TableCell>
                          <TableCell>
                            {post.is_dagens_bil ? (
                              <Badge className="bg-yellow-500">Dagens Bil</Badge>
                            ) : !post.vehicle_id ? (
                              <Badge className="bg-primary">LEJIO Promo</Badge>
                            ) : (
                              <Badge variant="secondary">Standard</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Facebook className="w-5 h-5 text-blue-600" />
              Opret Facebook Opslag
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle && `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.registration})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedVehicle?.image_url && (
                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={selectedVehicle.image_url} 
                    alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Opslag type</Label>
                  <Select value={postType} onValueChange={(v: unknown) => setPostType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dagens_bil">⭐ Dagens Bil</SelectItem>
                      <SelectItem value="promotion">📢 Promotion</SelectItem>
                      <SelectItem value="custom">✏️ Brugerdefineret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Target Audience Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Målgruppe</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={targetAudience === option.value ? "default" : "outline"}
                    className="h-auto py-2 px-3 flex flex-col items-start text-left"
                    onClick={() => setTargetAudience(option.value)}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground opacity-80">{option.description}</span>
                  </Button>
                ))}
              </div>
              
              {targetAudience === 'custom' && (
                <div className="space-y-2">
                  <Label>Beskriv din målgruppe</Label>
                  <Input
                    value={customTargetAudience}
                    onChange={(e) => setCustomTargetAudience(e.target.value)}
                    placeholder="F.eks. 'Nybagte forældre der skal bruge stationcar' eller 'Håndværkere med behov for varevogn'"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opslag tekst</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Genererer...' : 'Generer med AI'}
                </Button>
              </div>
              <Textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                placeholder="Klik på 'Generer med AI' eller skriv dit eget opslag..."
                rows={8}
                className="resize-none"
              />
            </div>

            {selectedVehicle?.image_url && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image className="w-4 h-4" />
                Billede vil blive inkluderet i opslaget
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>
              Annuller
            </Button>
            <Button 
              onClick={handlePostToFacebook}
              disabled={isPosting || !generatedPost.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPosting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
            {isPosting ? 'Poster...' : 'Post til Facebook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LEJIO Promo Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              LEJIO Reklameopslag
            </DialogTitle>
            <DialogDescription>
              Opret et generelt reklameopslag for LEJIO platformen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Target Audience Selection for promo */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Målgruppe</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={targetAudience === option.value ? "default" : "outline"}
                    className="h-auto py-2 px-3 flex flex-col items-start text-left"
                    onClick={() => setTargetAudience(option.value)}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground opacity-80">{option.description}</span>
                  </Button>
                ))}
              </div>
              
              {targetAudience === 'custom' && (
                <div className="space-y-2">
                  <Label>Beskriv din målgruppe</Label>
                  <Input
                    value={customTargetAudience}
                    onChange={(e) => setCustomTargetAudience(e.target.value)}
                    placeholder="F.eks. 'Nybagte forældre der skal bruge stationcar'"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opslag tekst</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Genererer...' : 'Generer med AI'}
                </Button>
              </div>
              <Textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                placeholder="Klik på 'Generer med AI' eller skriv dit eget opslag..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Tips til LEJIO reklameopslag:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Fremhæv fordelene ved at leje bil via LEJIO</li>
                <li>Nævn nem booking og digitale kontrakter</li>
                <li>Inkluder en call-to-action (besøg lejio.dk)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromoDialog(false)}>
              Annuller
            </Button>
            <Button 
              onClick={handlePostToFacebook}
              disabled={isPosting || !generatedPost.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPosting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isPosting ? 'Poster...' : 'Post til Facebook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFacebookPosts;
