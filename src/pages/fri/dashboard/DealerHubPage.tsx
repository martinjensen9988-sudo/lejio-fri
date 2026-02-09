import { useMemo, useState } from 'react';
import FriDashboardLayout from '@/components/fri/FriDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDealerListings, type DealerListing } from '@/hooks/useDealerListings';
import { Car, BadgePercent, Sparkles, FileText, TrendingUp, X, Trash2, Save, Search, Upload } from 'lucide-react';

type ListingStatus = 'available' | 'reserved' | 'sold';

const statusDisplay: Record<ListingStatus, string> = {
  available: 'Klar',
  reserved: 'I dialog',
  sold: 'Solgt',
};

const statusStyles: Record<ListingStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reserved: 'bg-amber-50 text-amber-700 border-amber-200',
  sold: 'bg-slate-50 text-slate-600 border-slate-200',
};

const dealerFeatures = [
  {
    title: 'CPR opslag (alle systemer)',
    description: 'Valider kunder direkte i flowet pa udlejning, vaerksted og salg.',
  },
  {
    title: 'Digital guleseddel',
    description: 'Udfyld online og vis pa skaerm i butikken.',
  },
  {
    title: 'Provekoerselseddel',
    description: 'Digital tjek-in/ud med signatur og tidspunkter.',
  },
  {
    title: 'Salgstjekliste',
    description: 'Mer-salg og ekstraudstyr bliver foreslaet automatisk.',
  },
];

const salesChecklist = [
  { id: 'extra_warranty', label: 'Tilbyd udvidet garanti' },
  { id: 'insurance_bundle', label: 'Tilfoej forsikringspakke' },
  { id: 'service_plan', label: 'Tilfoej serviceaftale' },
  { id: 'winter_tires', label: 'Tilbud vinterdaek og fælger' },
  { id: 'finance_offer', label: 'Tilbyd finansiering' },
];

export default function FriDealerHubPage() {
  const { toast } = useToast();
  const { listings, isLoading, create, update, delete: deleteListing, isCreating, isUpdating, isDeleting } = useDealerListings();
  
  const [selectedListing, setSelectedListing] = useState<DealerListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState<ListingStatus>('available');
  const [form, setForm] = useState({
    title: '',
    reg: '',
    price: '',
    status: 'available' as ListingStatus,
  });
  const [guleSeddel, setGuleSeddel] = useState({
    kunde: '',
    reg: '',
    dato: '',
  });
  const [proevekoersel, setProevekoersel] = useState({
    kunde: '',
    reg: '',
    fra: '',
    til: '',
  });
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showContracts, setShowContracts] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ListingStatus>('all');
  
  // Loyalty Card form
  const [loyaltyForm, setLoyaltyForm] = useState({ name: '', discount: '', validFrom: '', validTo: '' });
  
  // Contract form
  const [contractForm, setContractForm] = useState({ type: 'sales', name: '', email: '' });
  
  // Campaign form
  const [campaignForm, setCampaignForm] = useState({ title: '', text: '', target: 'all' });

  const stats = useMemo(() => {
    const active = listings.filter((listing) => listing.status !== 'sold').length;
    const sold = listings.filter((listing) => listing.status === 'sold').length;
    const pipelineValue = listings
      .filter((listing) => listing.status !== 'sold')
      .reduce((sum, listing) => sum + listing.price, 0);
    return { active, sold, pipelineValue };
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        searchQuery === '' ||
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.reg.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [listings, searchQuery, filterStatus]);

  const handleCreateListing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.reg || !form.price) {
      toast({ title: 'Udfyld alle felter', variant: 'destructive' });
      return;
    }

    try {
      await create({
        title: form.title,
        reg_number: form.reg.toUpperCase(),
        price: Number(form.price),
        status: form.status,
      });
      setForm({ title: '', reg: '', price: '', status: 'available' });
      toast({ title: 'Annoncen er oprettet', description: 'Bilforhandler flowet er opdateret.' });
    } catch (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke oprette annonce.', variant: 'destructive' });
    }
  };

  const handleSelectListing = (listing: DealerListing) => {
    setSelectedListing(listing);
    setEditTitle(listing.title);
    setEditPrice(String(listing.price));
    setEditStatus(listing.status);
  };

  const handleCloseListing = () => {
    setSelectedListing(null);
  };

  const handleSaveListing = async () => {
    if (!selectedListing) return;
    if (!editTitle || !editPrice) {
      toast({ title: 'Udfyld alle felter', variant: 'destructive' });
      return;
    }

    try {
      await update({
        id: selectedListing.id,
        title: editTitle,
        price: Number(editPrice),
        status: editStatus,
      });
      
      setSelectedListing(null);
      toast({ title: 'Bilannonce opdateret', description: 'Ændringerne er gemt.' });
    } catch (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke opdatere annonce.', variant: 'destructive' });
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await deleteListing(id);
      setSelectedListing(null);
      toast({ title: 'Bilannonce slettet', description: 'Annoncen er fjernet.' });
    } catch (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke slette annonce.', variant: 'destructive' });
    }
  };

  const handleMarkAsSold = async () => {
    if (!selectedListing) return;
    try {
      await update({
        id: selectedListing.id,
        status: 'sold',
      });
      setSelectedListing(null);
      toast({ title: 'Markeret som solgt', description: 'Annoncen status er ændret til Solgt.' });
    } catch (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke opdatere status.', variant: 'destructive' });
    }
  };

  return (
    <FriDashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Bilforhandler</h1>
          <p className="text-gray-500 mt-2">
            Saml salgsflow, leads og kampagner i et samlet overblik. Her kan du oprette salgsannoncer, tracke dialoger og afslutte handler.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Aktiv pipeline
              </div>
              <CardTitle className="text-2xl">kr. {stats.pipelineValue.toLocaleString('da-DK')}</CardTitle>
              <CardDescription>Værdi af aktive salgsannoncer</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Car className="w-4 h-4 text-pink-500" />
                Aktive annoncer
              </div>
              <CardTitle className="text-2xl">{stats.active}</CardTitle>
              <CardDescription>Biler klar eller i dialog</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BadgePercent className="w-4 h-4 text-amber-500" />
                Solgt i denne måned
              </div>
              <CardTitle className="text-2xl">{stats.sold}</CardTitle>
              <CardDescription>Afsluttede handler</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle>Aktive salgsannoncer</CardTitle>
              <CardDescription>Hold styr pa status, pris og næste handling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Søg efter titel eller reg.nr..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-brown-500"
                  />
                </div>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <SelectTrigger className="sm:w-40 bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle status</SelectItem>
                    <SelectItem value="available">Klar</SelectItem>
                    <SelectItem value="reserved">I dialog</SelectItem>
                    <SelectItem value="sold">Solgt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Listings */}
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-gray-500 text-center py-8">Indlæser annoncer...</p>
                ) : listings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Ingen annoncer endnu. Opret en ny nedenfor.</p>
                ) : filteredListings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Ingen annoncer matcher dine søgekriteria.</p>
                ) : (
                  filteredListings.map((listing) => (
                    <button
                      key={listing.id}
                      type="button"
                      onClick={() => handleSelectListing(listing)}
                      className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 hover:border-brown-200 transition-all cursor-pointer text-left overflow-hidden"
                    >
                      {listing.imageUrl && (
                        <img src={listing.imageUrl} alt={listing.title} className="w-16 h-12 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-brown-900">{listing.title}</p>
                        <p className="text-sm text-gray-500">Reg.nr: {listing.reg} · Oprettet {new Date(listing.createdAt).toLocaleDateString('da-DK')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyles[listing.status]}`}>
                          {statusDisplay[listing.status]}
                        </span>
                        <span className="text-sm font-semibold text-brown-900 whitespace-nowrap">kr. {listing.price.toLocaleString('da-DK')}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle>Ny salgsannonce</CardTitle>
              <CardDescription>Opret et nyt bilsalg pa under 1 minut</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateListing} className="space-y-4" noValidate>
                <div>
                  <label className="text-sm font-medium text-gray-700">Titel</label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="F.eks. Audi A4 S line"
                    className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reg.nr</label>
                  <Input
                    value={form.reg}
                    onChange={(event) => setForm({ ...form, reg: event.target.value })}
                    placeholder="AB12345"
                    className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pris (kr.)</label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    placeholder="189900"
                    className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as ListingStatus })}>
                    <SelectTrigger className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Klar</SelectItem>
                      <SelectItem value="reserved">I dialog</SelectItem>
                      <SelectItem value="sold">Solgt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isCreating} className="w-full bg-brown-500 hover:bg-brown-600 text-white font-semibold disabled:opacity-50">
                  {isCreating ? 'Opretter...' : 'Opret annonce'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowLoyalty(true)}
            className="text-left border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-brown-200 rounded-lg border"
          >
            <Card className="border-0">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Loyalitetskort
                </div>
                <CardTitle className="text-lg">Kundekort & rabatkoder</CardTitle>
                <CardDescription>Aktiver kampagner og opsalg direkte i salgsflowet.</CardDescription>
              </CardHeader>
            </Card>
          </button>
          <button
            onClick={() => setShowContracts(true)}
            className="text-left border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-brown-200 rounded-lg border"
          >
            <Card className="border-0">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Kontrakter
                </div>
                <CardTitle className="text-lg">Digitale aftaler</CardTitle>
                <CardDescription>Send og underskriv kontrakter direkte fra pipeline.</CardDescription>
              </CardHeader>
            </Card>
          </button>
          <button
            onClick={() => setShowCampaigns(true)}
            className="text-left border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-brown-200 rounded-lg border"
          >
            <Card className="border-0">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BadgePercent className="w-4 h-4 text-violet-500" />
                  Kampagner
                </div>
                <CardTitle className="text-lg">Udsend tilbud</CardTitle>
                <CardDescription>Push kampagner til leads og eksisterende kunder.</CardDescription>
              </CardHeader>
            </Card>
          </button>
        </div>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Bilforhandler funktioner</CardTitle>
            <CardDescription>Funktioner uden Lejio-vaerkstedsmoduler</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealerFeatures.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-gray-100 p-4">
                <p className="font-semibold text-brown-900">{feature.title}</p>
                <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-gray-100 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>Digital guleseddel</CardTitle>
              <CardDescription>Lav guleseddel online og vis den pa skaerm.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  toast({ title: 'Guleseddel klar', description: 'Guleseddel er genereret og klar til visning.' });
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <Input
                  placeholder="Kundenavn"
                  value={guleSeddel.kunde}
                  onChange={(event) => setGuleSeddel({ ...guleSeddel, kunde: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <Input
                  placeholder="Reg.nr"
                  value={guleSeddel.reg}
                  onChange={(event) => setGuleSeddel({ ...guleSeddel, reg: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <Input
                  type="date"
                  value={guleSeddel.dato}
                  onChange={(event) => setGuleSeddel({ ...guleSeddel, dato: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <div className="md:col-span-3">
                  <Button type="submit" className="bg-brown-500 hover:bg-brown-600 text-white font-semibold">
                    Generer guleseddel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle>Provekoerselseddel</CardTitle>
              <CardDescription>Udfyld online og gem direkte i sagen.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  toast({ title: 'Provekoersel gemt', description: 'Seddel er gemt og klar til signatur.' });
                }}
                className="space-y-3"
              >
                <Input
                  placeholder="Kundenavn"
                  value={proevekoersel.kunde}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, kunde: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <Input
                  placeholder="Reg.nr"
                  value={proevekoersel.reg}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, reg: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <Input
                  type="datetime-local"
                  value={proevekoersel.fra}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, fra: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <Input
                  type="datetime-local"
                  value={proevekoersel.til}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, til: event.target.value })}
                  className="bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                />
                <Button type="submit" className="w-full bg-brown-500 hover:bg-brown-600 text-white font-semibold">
                  Gem provekoersel
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Salgstjekliste</CardTitle>
            <CardDescription>Vises nar en bil markeres som solgt.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {salesChecklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(checklistDone[item.id])}
                  onChange={(event) =>
                    setChecklistDone({ ...checklistDone, [item.id]: event.target.checked })
                  }
                  className="accent-pink-500"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Listing Details Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-2xl text-brown-900">Bilannonce detaljer</CardTitle>
                  <CardDescription className="mt-1">Rediger eller opdater denne salgsannonce</CardDescription>
                </div>
                <button
                  onClick={handleCloseListing}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Display Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 p-4 bg-brown-50 rounded-lg border border-brown-100">
                    <p className="text-sm text-gray-600">Registreringsnummer</p>
                    <p className="text-xl font-semibold text-brown-900">{selectedListing.reg}</p>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bilmodel</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                      placeholder="F.eks. BMW 320d Touring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Pris (kr.)</label>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <Select value={editStatus} onValueChange={(value) => setEditStatus(value as ListingStatus)}>
                        <SelectTrigger className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Klar</SelectItem>
                          <SelectItem value="reserved">I dialog</SelectItem>
                          <SelectItem value="sold">Solgt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Oprettet</p>
                    <p className="font-semibold text-gray-900">{selectedListing.createdAt}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleCloseListing}
                    variant="outline"
                    className="flex-1 border-gray-300"
                    disabled={isDeleting || isUpdating}
                  >
                    Luk
                  </Button>
                  <Button
                    onClick={() => handleDeleteListing(selectedListing.id)}
                    variant="destructive"
                    className="flex-1"
                    disabled={isDeleting || isUpdating}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? 'Sletter...' : 'Slet'}
                  </Button>
                  {editStatus !== 'sold' && (
                    <Button
                      onClick={handleMarkAsSold}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                      disabled={isDeleting || isUpdating}
                    >
                      Markér som solgt
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveListing}
                    className="flex-1 bg-brown-500 hover:bg-brown-600 text-white font-semibold disabled:opacity-50"
                    disabled={isDeleting || isUpdating}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? 'Gemmer...' : 'Gem ændringer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loyalitetskort Modal */}
        {showLoyalty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-2xl text-brown-900">Loyalitetskort & rabatkoder</CardTitle>
                  <CardDescription className="mt-1">Opret og styr kundekort, rabatkoder og loyalitetsprogrammer</CardDescription>
                </div>
                <button
                  onClick={() => setShowLoyalty(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kort navn</label>
                    <Input
                      placeholder="F.eks. Premium medlem"
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rabatprocent</label>
                    <Input
                      type="number"
                      placeholder="F.eks. 10"
                      min="0"
                      max="100"
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Gyldig periode</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                      />
                      <Input
                        type="date"
                        className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowLoyalty(false)}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    Luk
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLoyalty(false);
                      toast({ title: 'Loyalitetskort oprettet', description: 'Kort er nu aktivt.' });
                    }}
                    className="flex-1 bg-brown-500 hover:bg-brown-600 text-white font-semibold"
                  >
                    Gem kort
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Kontrakter Modal */}
        {showContracts && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-2xl text-brown-900">Digitale kontrakter</CardTitle>
                  <CardDescription className="mt-1">Send og administrer salgkontrakter direkte i systemet</CardDescription>
                </div>
                <button
                  onClick={() => setShowContracts(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Vælg kontrakttype</label>
                    <Select defaultValue="sales">
                      <SelectTrigger className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Salgskontrakt</SelectItem>
                        <SelectItem value="lease">Lejekontrakt</SelectItem>
                        <SelectItem value="service">Serviceaftale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kundens e-mail</label>
                    <Input
                      type="email"
                      placeholder="kunde@eksempel.dk"
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Besked til kunde</label>
                    <Input
                      placeholder="Hej, venligst underskriv kontrakten..."
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowContracts(false)}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    Luk
                  </Button>
                  <Button
                    onClick={() => {
                      setShowContracts(false);
                      toast({ title: 'Kontrakt sendt', description: 'Kunde modtager underskrivningslink.' });
                    }}
                    className="flex-1 bg-brown-500 hover:bg-brown-600 text-white font-semibold"
                  >
                    Send kontrakt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Kampagner Modal */}
        {showCampaigns && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl border-0 shadow-xl">
              <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-2xl text-brown-900">Kampagner</CardTitle>
                  <CardDescription className="mt-1">Push salgstilbud til leads og eksisterende kunder</CardDescription>
                </div>
                <button
                  onClick={() => setShowCampaigns(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kampagnetitel</label>
                    <Input
                      placeholder="F.eks. Vinteris tilbud 2026"
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tilbudstekst</label>
                    <Input
                      placeholder="Beskriv dit tilbud kort og præcist"
                      className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Send til</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="mt-1 bg-white border-gray-300 focus:border-brown-500 focus:ring-brown-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle leads</SelectItem>
                        <SelectItem value="active">Aktive leads</SelectItem>
                        <SelectItem value="previous">Tidligere kunder</SelectItem>
                        <SelectItem value="custom">Tilpasset liste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowCampaigns(false)}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    Annuller
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCampaigns(false);
                      toast({ title: 'Kampagne sendt', description: 'Alle modtagere er notificeret.' });
                    }}
                    className="flex-1 bg-brown-500 hover:bg-brown-600 text-white font-semibold"
                  >
                    Send kampagne
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </FriDashboardLayout>
  );
}
