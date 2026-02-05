import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useSalesLeads } from '@/hooks/useSalesLeads';
import { ArrowLeft, FileText, Facebook, Loader2, Upload, CheckCircle } from 'lucide-react';

const SalesAIImportPage = () => {
  const navigate = useNavigate();
  const { importFromCSV, addLead } = useSalesLeads();
  
  const [csvText, setCsvText] = useState('');
  const [facebookText, setFacebookText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number } | null>(null);

  const handleImportCSV = async () => {
    if (!csvText.trim()) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    const result = await importFromCSV(csvText);
    
    if (result) {
      setImportResult({ success: true, count: result.length });
      setCsvText('');
    } else {
      setImportResult({ success: false, count: 0 });
    }
    
    setIsImporting(false);
  };

  const handleImportFacebook = async () => {
    if (!facebookText.trim()) return;
    
    setIsImporting(true);
    setImportResult(null);
    
    const lines = facebookText.trim().split('\n');
    const validLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    
    let successCount = 0;
    for (const company_name of validLines) {
      const result = await addLead({ company_name, source: 'facebook' });
      if (result) successCount++;
    }
    
    setImportResult({ success: successCount > 0, count: successCount });
    setFacebookText('');
    setIsImporting(false);
  };

  return (
    <AdminDashboardLayout activeTab="sales-ai">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/sales-ai')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Importer leads</h2>
            <p className="text-muted-foreground">Importer leads fra CSV-filer eller Facebook</p>
          </div>
        </div>
        
        {importResult && (
          <Card className={importResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {importResult.success ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <p className="text-green-800 font-medium">
                      {importResult.count} leads importeret succesfuldt!
                    </p>
                  </>
                ) : (
                  <p className="text-red-800 font-medium">Der opstod en fejl under import</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Vælg importkilde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="csv">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="csv" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV-data
                </TabsTrigger>
                <TabsTrigger value="facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                  <span className="ml-2"><span className="inline-block bg-muted text-xs rounded px-2 py-0.5">Beta</span></span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="csv" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">CSV-format</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Indsæt CSV-data med kommaseparerede værdier. Første linje skal være kolonnenavne.
                    Understøttede kolonner: virksomhed, cvr, kontakt, email, telefon, by, branche
                  </p>
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="text-sm font-mono">
                      virksomhed,cvr,kontakt,email,telefon,by<br />
                      Firma A/S,12345678,Peter Hansen,peter@firma.dk,12345678,København<br />
                      Auto Center,87654321,Jens Jensen,jens@auto.dk,87654321,Aarhus
                    </p>
                  </div>
                  <Textarea
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Indsæt CSV-data her..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/sales-ai')}>
                    Annuller
                  </Button>
                  <Button onClick={handleImportCSV} disabled={isImporting || !csvText.trim()}>
                    {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Importer CSV
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="facebook" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Facebook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Facebook-import er under udvikling</p>
                  <span className="inline-block bg-muted text-xs rounded px-2 py-0.5 mt-2">Kommer snart</span>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default SalesAIImportPage;