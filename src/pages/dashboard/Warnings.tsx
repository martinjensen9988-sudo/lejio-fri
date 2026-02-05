import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useRenterWarnings,
  RenterWarning,
  WARNING_REASON_LABELS,
  WARNING_STATUS_LABELS,
} from '@/hooks/useRenterWarnings';
import { RenterWarningAlert } from '@/components/warnings/RenterWarningAlert';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  AlertTriangle,
  Plus,
  Search,
  Loader2,
  Shield,
  UserX,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const WarningsPage = () => {
  const navigate = useNavigate();
  const { myReportedWarnings, checkRenter, isLoading } = useRenterWarnings();

  // Lejer-søgning
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchLicense, setSearchLicense] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RenterWarning[] | null>(null);

  const handleSearch = async () => {
    if (!searchEmail && !searchPhone && !searchLicense) return;
    setIsSearching(true);
    const results = await checkRenter(
      searchEmail || undefined,
      searchPhone || undefined,
      searchLicense || undefined
    );
    setSearchResults(results);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchEmail('');
    setSearchPhone('');
    setSearchLicense('');
    setSearchResults(null);
  };

  const getSeverityBadge = (severity: number) => {
    if (severity <= 2) return <Badge variant="outline" className="text-secondary border-secondary/50">Lav</Badge>;
    if (severity <= 3) return <Badge variant="outline" className="text-accent border-accent/50">Middel</Badge>;
    if (severity <= 4) return <Badge variant="destructive">Høj</Badge>;
    return <Badge variant="destructive">Kritisk</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Aktiv</Badge>;
      case 'dismissed':
        return <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Afvist</Badge>;
      case 'under_review':
        return <Badge variant="outline">Under behandling</Badge>;
      default:
        return <Badge variant="outline">{WARNING_STATUS_LABELS[status as keyof typeof WARNING_STATUS_LABELS] || status}</Badge>;
    }
  };

  return (
    <DashboardLayout activeTab="warnings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-accent" />
              Advarselsregister
            </h1>
            <p className="text-muted-foreground">
              Administrer advarsler og tjek lejere inden du accepterer bookinger
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/warnings/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Opret advarsel
          </Button>
        </div>

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              Søg lejer
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-2">
              <UserX className="w-4 h-4" />
              Mine advarsler ({myReportedWarnings.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Søg lejer */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Tjek en lejer
                </CardTitle>
                <CardDescription>
                  Indtast email, telefon eller kørekortnummer for at se om lejeren har advarsler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      placeholder="lejer@email.dk"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input
                      placeholder="+45 12345678"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kørekortnummer</label>
                    <Input
                      placeholder="DK12345678"
                      value={searchLicense}
                      onChange={(e) => setSearchLicense(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} disabled={isSearching || (!searchEmail && !searchPhone && !searchLicense)}>
                    {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                    Søg
                  </Button>
                  {searchResults !== null && (
                    <Button variant="outline" onClick={clearSearch}>
                      Ryd
                    </Button>
                  )}
                </div>

                {/* Søgeresultater */}
                {searchResults !== null && (
                  <div className="pt-4 border-t space-y-4">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-mint mx-auto mb-3" />
                        <h3 className="font-semibold text-lg">Ingen advarsler fundet</h3>
                        <p className="text-muted-foreground text-sm">
                          Denne lejer har ingen registrerede advarsler.
                        </p>
                      </div>
                    ) : (
                      <RenterWarningAlert warnings={searchResults} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mine advarsler */}
          <TabsContent value="mine" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                  Advarsler jeg har oprettet
                </CardTitle>
                <CardDescription>
                  Oversigt over alle advarsler du har registreret
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : myReportedWarnings.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">Ingen advarsler endnu</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Du har ikke oprettet nogen advarsler.
                    </p>
                    <Button variant="outline" onClick={() => navigate('/dashboard/warnings/create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Opret din første advarsel
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lejer</TableHead>
                          <TableHead>Årsag</TableHead>
                          <TableHead>Alvorlighed</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Oprettet</TableHead>
                          <TableHead>Udløber</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myReportedWarnings.map((warning) => (
                          <TableRow key={warning.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{warning.renter_name || 'Ukendt'}</p>
                                <p className="text-xs text-muted-foreground">{warning.renter_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {WARNING_REASON_LABELS[warning.reason]}
                              </Badge>
                            </TableCell>
                            <TableCell>{getSeverityBadge(warning.severity)}</TableCell>
                            <TableCell>{getStatusBadge(warning.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(warning.created_at), 'd. MMM yyyy', { locale: da })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(warning.expires_at), 'd. MMM yyyy', { locale: da })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WarningsPage;
