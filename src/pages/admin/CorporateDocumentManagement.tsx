import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCorporateFleet } from '@/hooks/useCorporateFleet';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Upload, Download, Trash2, Plus, FileIcon, Lock, Share2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';

interface Document {
  id: string;
  corporate_account_id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  visibility: 'private' | 'internal' | 'public';
  category: string;
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

const CorporateDocumentManagement = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const { corporateAccount, isLoading: dataLoading } = useCorporateFleet();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    visibility: 'internal' as const,
  });

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  useEffect(() => {
    if (corporateAccount?.id) {
      fetchDocuments();
    }
  }, [corporateAccount?.id]);

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const { data, error } = await supabase
        .from('corporate_documents')
        .select('*')
        .eq('corporate_account_id', corporateAccount?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Fejl ved hentning af dokumenter:', err);
      toast.error('Kunne ikke hente dokumenter');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!corporateAccount?.id || !formData.name) {
      toast.error('Udfyld dokumentnavn');
      return;
    }

    try {
      setUploadProgress(0);

      // Upload fil til storage
      const filePath = `${corporateAccount.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('corporate-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // Få download URL
      const { data: { publicUrl } } = supabase.storage
        .from('corporate-documents')
        .getPublicUrl(filePath);

      // Gem metadata
      const { error: insertError } = await supabase
        .from('corporate_documents')
        .insert({
          corporate_account_id: corporateAccount.id,
          name: formData.name,
          description: formData.description,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          category: formData.category,
          visibility: formData.visibility,
          uploaded_by: user?.email || 'unknown',
        });

      if (insertError) throw insertError;
      setUploadProgress(100);

      toast.success('Dokument uploadet');
      setIsOpen(false);
      setFormData({ name: '', description: '', category: 'other', visibility: 'internal' });
      setUploadProgress(0);
      fetchDocuments();
    } catch (err) {
      console.error('Fejl ved upload:', err);
      toast.error('Kunne ikke uploade dokument');
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Slet dokument?')) return;

    try {
      const { error } = await supabase
        .from('corporate_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      toast.success('Dokument slettet');
      fetchDocuments();
    } catch (err) {
      toast.error('Kunne ikke slette dokument');
    }
  };

  const handleDownloadDocument = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = ['all', 'contracts', 'reports', 'policies', 'finance', 'other'];
  const visibilityLabels = {
    private: 'Privat',
    internal: 'Intern',
    public: 'Offentlig',
  };

  const filteredDocs = selectedCategory === 'all'
    ? documents
    : documents.filter((d) => d.category === selectedCategory);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dokumenthåndtering</h1>
            <p className="text-muted-foreground">Upload og del dokumenter sikkert</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload dokument
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload nyt dokument</DialogTitle>
                <DialogDescription>
                  Vælg en fil og udfyld metadata
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-name">Dokumentnavn</Label>
                  <Input
                    id="doc-name"
                    placeholder="f.eks. Årsrapport 2025"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="doc-desc">Beskrivelse</Label>
                  <Input
                    id="doc-desc"
                    placeholder="Kort beskrivelse"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="doc-category">Kategori</Label>
                  <select
                    id="doc-category"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="other">Øvrigt</option>
                    <option value="contracts">Kontrakter</option>
                    <option value="reports">Rapporter</option>
                    <option value="policies">Politikker</option>
                    <option value="finance">Økonomi</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="doc-visibility">Synlighed</Label>
                  <select
                    id="doc-visibility"
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  >
                    <option value="private">Privat (kun mig)</option>
                    <option value="internal">Intern (alle medarbejdere)</option>
                    <option value="public">Offentlig</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="doc-file">Vælg fil</Label>
                  <input
                    id="doc-file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadDocument(file);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 pb-4">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'Alle' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        {isLoadingDocs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileIcon className="w-6 h-6 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline">{doc.category}</Badge>
                          <Badge
                            variant={doc.visibility === 'public' ? 'default' : 'secondary'}
                          >
                            {doc.visibility === 'private' ? (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Privat
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3 mr-1" />
                                {visibilityLabels[doc.visibility]}
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(doc.created_at).toLocaleDateString('da-DK')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadDocument(doc.file_url, doc.name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredDocs.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Ingen dokumenter i denne kategori
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default CorporateDocumentManagement;
