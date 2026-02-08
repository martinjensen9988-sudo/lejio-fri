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
import { Car, BadgePercent, Sparkles, FileText, TrendingUp } from 'lucide-react';

type ListingStatus = 'Klar' | 'I dialog' | 'Solgt';

type Listing = {
  id: string;
  title: string;
  reg: string;
  price: number;
  status: ListingStatus;
  createdAt: string;
};

const initialListings: Listing[] = [
  { id: '1', title: 'VW Golf 1.5 TSI', reg: 'AB12345', price: 189900, status: 'I dialog', createdAt: '2026-02-03' },
  { id: '2', title: 'BMW 320d Touring', reg: 'CD67890', price: 249900, status: 'Klar', createdAt: '2026-02-01' },
  { id: '3', title: 'Tesla Model 3 Long Range', reg: 'EF54321', price: 329900, status: 'Solgt', createdAt: '2026-01-27' },
];

const statusStyles: Record<ListingStatus, string> = {
  Klar: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'I dialog': 'bg-amber-50 text-amber-700 border-amber-200',
  Solgt: 'bg-slate-50 text-slate-600 border-slate-200',
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
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [form, setForm] = useState({
    title: '',
    reg: '',
    price: '',
    status: 'Klar' as ListingStatus,
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

  const stats = useMemo(() => {
    const active = listings.filter((listing) => listing.status !== 'Solgt').length;
    const sold = listings.filter((listing) => listing.status === 'Solgt').length;
    const pipelineValue = listings
      .filter((listing) => listing.status !== 'Solgt')
      .reduce((sum, listing) => sum + listing.price, 0);
    return { active, sold, pipelineValue };
  }, [listings]);

  const handleCreateListing = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.reg || !form.price) {
      toast({ title: 'Udfyld alle felter', variant: 'destructive' });
      return;
    }

    const next: Listing = {
      id: crypto.randomUUID(),
      title: form.title,
      reg: form.reg.toUpperCase(),
      price: Number(form.price),
      status: form.status,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setListings((current) => [next, ...current]);
    setForm({ title: '', reg: '', price: '', status: 'Klar' });
    toast({ title: 'Annoncen er oprettet', description: 'Bilforhandler flowet er opdateret.' });
  };

  return (
    <FriDashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bilforhandler</h1>
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
            <CardContent className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-gray-100 p-4">
                  <div>
                    <p className="font-semibold text-gray-900">{listing.title}</p>
                    <p className="text-sm text-gray-500">Reg.nr: {listing.reg} · Oprettet {listing.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyles[listing.status]}`}>
                      {listing.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">kr. {listing.price.toLocaleString('da-DK')}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle>Ny salgsannonce</CardTitle>
              <CardDescription>Opret et nyt bilsalg pa under 1 minut</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateListing} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Titel</label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="F.eks. Audi A4 S line"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reg.nr</label>
                  <Input
                    value={form.reg}
                    onChange={(event) => setForm({ ...form, reg: event.target.value })}
                    placeholder="AB12345"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pris (kr.)</label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    placeholder="189900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as ListingStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Klar">Klar</SelectItem>
                      <SelectItem value="I dialog">I dialog</SelectItem>
                      <SelectItem value="Solgt">Solgt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  Opret annonce
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Loyalitetskort
              </div>
              <CardTitle className="text-lg">Kundekort & rabatkoder</CardTitle>
              <CardDescription>Aktiver kampagner og opsalg direkte i salgsflowet.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4 text-emerald-500" />
                Kontrakter
              </div>
              <CardTitle className="text-lg">Digitale aftaler</CardTitle>
              <CardDescription>Send og underskriv kontrakter direkte fra pipeline.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BadgePercent className="w-4 h-4 text-violet-500" />
                Kampagner
              </div>
              <CardTitle className="text-lg">Udsend tilbud</CardTitle>
              <CardDescription>Push kampagner til leads og eksisterende kunder.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle>Bilforhandler funktioner</CardTitle>
            <CardDescription>Funktioner uden Lejio-vaerkstedsmoduler</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealerFeatures.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-gray-100 p-4">
                <p className="font-semibold text-gray-900">{feature.title}</p>
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
                />
                <Input
                  placeholder="Reg.nr"
                  value={guleSeddel.reg}
                  onChange={(event) => setGuleSeddel({ ...guleSeddel, reg: event.target.value })}
                />
                <Input
                  type="date"
                  value={guleSeddel.dato}
                  onChange={(event) => setGuleSeddel({ ...guleSeddel, dato: event.target.value })}
                />
                <div className="md:col-span-3">
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
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
                />
                <Input
                  placeholder="Reg.nr"
                  value={proevekoersel.reg}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, reg: event.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={proevekoersel.fra}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, fra: event.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={proevekoersel.til}
                  onChange={(event) => setProevekoersel({ ...proevekoersel, til: event.target.value })}
                />
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white">
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
      </div>
    </FriDashboardLayout>
  );
}
