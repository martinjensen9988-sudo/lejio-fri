import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DriverLicense {
  id: string;
  user_id: string;
  license_number: string | null;
  license_country: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  front_image_url: string | null;
  back_image_url: string | null;
  verification_status: string;
  ai_verification_result: unknown;
  created_at: string;
  rejection_reason: string | null;
  user_profile?: {
    full_name: string | null;
    email: string | null;
    account_banned_at?: string | null;
    account_banned_reason?: string | null;
  } | null;
}

const DriverLicenseReview = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminAuth();
  const [licenses, setLicenses] = useState<DriverLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<DriverLicense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [signedUrls, setSignedUrls] = useState<{ front?: string; back?: string }>({});
  const [banning, setBanning] = useState(false);
  const [userBanned, setUserBanned] = useState(false);

  // Helper to get signed URL for private bucket images
  const getSignedUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    try {
      // Try to extract the file path for the private bucket
      // Accept both public and private URL patterns
      let filePath = null;
      // Pattern 1: Supabase public URL
      const urlObj = new URL(url, window.location.origin);
      const match1 = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|private)\/driver-licenses\/(.+)/);
      if (match1) filePath = decodeURIComponent(match1[1]);
      // Pattern 2: Just the path
      if (!filePath) {
        const match2 = url.match(/driver-licenses\/(.+)$/);
        if (match2) filePath = decodeURIComponent(match2[1]);
      }
      if (filePath) {
        const { data, error } = await supabase.storage
          .from('driver-licenses')
          .createSignedUrl(filePath, 3600); // 1 hour expiry
        if (error) {
          console.error('Error creating signed URL:', error);
          return null;
        }
        return data.signedUrl;
      }
      // If no match, return original (should not happen for valid images)
      return url;
    } catch (e) {
      console.error('Error parsing URL for signed image:', e);
      return url;
    }
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      // First fetch licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from('driver_licenses')
        .select('*')
        .in('verification_status', ['pending_admin_review', 'pending_review', 'pending'])
        .order('created_at', { ascending: false });

      if (licensesError) throw licensesError;

      // Then fetch profiles for each license
      const licensesWithProfiles: DriverLicense[] = [];
      for (const license of licensesData || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, account_banned_at, account_banned_reason')
          .eq('id', license.user_id)
          .single();
        licensesWithProfiles.push({
          ...license,
          user_profile: profile || null,
        });
      }

      setLicenses(licensesWithProfiles);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast.error('Kunne ikke hente kørekort');
    } finally {
      setLoading(false);
    }
  };

  // Load signed URLs when a license is selected
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (selectedLicense) {
        const [frontUrl, backUrl] = await Promise.all([
          getSignedUrl(selectedLicense.front_image_url),
          getSignedUrl(selectedLicense.back_image_url),
        ]);
        setSignedUrls({ front: frontUrl || undefined, back: backUrl || undefined });
        // Check if user is banned
        setUserBanned(false);
      } else {
        setSignedUrls({});
        setUserBanned(false);
      }
    };
    loadSignedUrls();
  }, [selectedLicense]);
  const handleBanUser = async (license: DriverLicense) => {
    if (!rejectionReason.trim()) {
      toast.error('Angiv en begrundelse for spærring');
      return;
    }
    setBanning(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_banned_at: new Date().toISOString(),
          account_banned_reason: rejectionReason,
        })
        .eq('id', license.user_id);
      if (error) throw error;
      toast.success('Bruger spærret for udlejning');
      setUserBanned(true);
      fetchLicenses();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Kunne ikke spærre bruger');
    } finally {
      setBanning(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLicenses();
    }
  }, [isAdmin]);

  const handleApprove = async (license: DriverLicense) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('driver_licenses')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', license.id);

      if (error) throw error;
      
      toast.success('Kørekort godkendt');
      fetchLicenses();
      setSelectedLicense(null);
    } catch (error) {
      console.error('Error approving license:', error);
      toast.error('Kunne ikke godkende kørekort');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (license: DriverLicense) => {
    if (!rejectionReason.trim()) {
      toast.error('Angiv en begrundelse for afvisning');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('driver_licenses')
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason,
          verified_at: null,
        })
        .eq('id', license.id);

      if (error) throw error;
      
      toast.success('Kørekort afvist');
      fetchLicenses();
      setSelectedLicense(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting license:', error);
      toast.error('Kunne ikke afvise kørekort');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_admin_review':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Afventer admin</Badge>;
      case 'pending_review':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Afventer gennemgang</Badge>;
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Afventer</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (adminLoading || loading) {
    return (
      <AdminDashboardLayout activeTab="driver-licenses">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminDashboardLayout activeTab="driver-licenses">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Ingen adgang</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab="driver-licenses">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kørekortsverificering</h1>
            <p className="text-muted-foreground">Gennemgå og godkend kørekort manuelt</p>
          </div>
          <Button variant="outline" onClick={fetchLicenses} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
        </div>

        {licenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Ingen kørekort afventer gennemgang</p>
              <p className="text-muted-foreground">Alle kørekort er blevet verificeret</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {licenses.map((license) => (
              <Card key={license.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {license.user_profile?.full_name || 'Ukendt bruger'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {license.user_profile?.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Indsendt: {format(new Date(license.created_at), 'dd. MMM yyyy HH:mm', { locale: da })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(license.verification_status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLicense(license);
                          setRejectionReason('');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Gennemgå
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Modal */}
        <Dialog open={!!selectedLicense} onOpenChange={() => setSelectedLicense(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gennemgå kørekort</DialogTitle>
            </DialogHeader>

            {selectedLicense && (
              <div className="space-y-6">
                {/* User info */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedLicense.user_profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedLicense.user_profile?.email}</p>
                  {selectedLicense.license_number && (
                    <p className="text-sm mt-2">Kørekortnummer: <span className="font-mono">{selectedLicense.license_number}</span></p>
                  )}
                  {selectedLicense.license_country && (
                    <p className="text-sm">Land: {selectedLicense.license_country}</p>
                  )}
                  {userBanned && (
                    <p className="mt-2"><Badge variant="destructive">Bruger spærret</Badge></p>
                  )}
                  {selectedLicense.user_profile?.account_banned_reason && (
                    <p className="text-xs text-muted-foreground mt-1">Spærret grund: {selectedLicense.user_profile.account_banned_reason}</p>
                  )}
                </div>

                {/* Images */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Forside</p>
                    {signedUrls.front ? (
                      <a href={signedUrls.front} target="_blank" rel="noopener noreferrer">
                        <img
                          src={signedUrls.front}
                          alt="Kørekort forside"
                          className="w-full rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            console.error('Failed to load front image');
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </a>
                    ) : selectedLicense.front_image_url ? (
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        Ingen billede
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Bagside</p>
                    {signedUrls.back ? (
                      <a href={signedUrls.back} target="_blank" rel="noopener noreferrer">
                        <img
                          src={signedUrls.back}
                          alt="Kørekort bagside"
                          className="w-full rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            console.error('Failed to load back image');
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </a>
                    ) : selectedLicense.back_image_url ? (
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        Ingen billede
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Result */}
                {selectedLicense.ai_verification_result && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">AI Analyse</p>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLicense.ai_verification_result, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Rejection reason input */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Begrundelse for afvisning (hvis relevant)
                  </label>
                  <Textarea
                    placeholder="Angiv begrundelse..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLicense(null)}
                    disabled={processing || banning}
                  >
                    Annuller
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedLicense)}
                    disabled={processing || banning}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Afvis
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedLicense)}
                    disabled={processing || banning}
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Godkend
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleBanUser(selectedLicense)}
                    disabled={banning || userBanned || processing}
                  >
                    {banning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                    Spær bruger
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
};

export default DriverLicenseReview;
