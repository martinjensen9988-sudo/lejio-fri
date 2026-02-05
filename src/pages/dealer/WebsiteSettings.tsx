import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Simple input for social links
function SocialInput({ label, name, value, onChange }: { label: string, name: string, value: string, onChange: (e: unknown) => void }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} value={value} onChange={onChange} placeholder={`Link til ${label}`} />
    </div>
  );
}

/**
 * Side hvor forhandler kan redigere deres offentlige hjemmesideprofil.
 * Felter: navn, beskrivelse, adresse, telefon, email, åbningstider, billeder
 */
export default function DealerWebsiteSettings() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    opening_hours: '',
    images: [] as string[],
    logo_url: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    services: [] as string[],
    faq: [] as { q: string, a: string }[],
    featured_vehicle_ids: [] as string[],
    theme: 'default',
    contact_email: '',
    contact_phone: '',
  });
  const [galleryUpload, setGalleryUpload] = useState<File | null>(null);
  const [logoUpload, setLogoUpload] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<unknown[]>([]);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{ views: number }>({ views: 0 });

  useEffect(() => {
    async function fetchDealer() {
      if (!user) return;
      const { data } = await (supabase).from('public_lessor_profiles').select('*').eq('id', user.id).single();
      if (data) setForm(f => ({
        ...f,
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        opening_hours: data.opening_hours || '',
        images: data.images || [],
        logo_url: data.logo_url || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        services: data.services || [],
        faq: data.faq || [],
        featured_vehicle_ids: data.featured_vehicle_ids || [],
        theme: data.theme || 'default',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
      }));
      // Hent forhandlerens biler
      const { data: vehicleData } = await (supabase).from('vehicles_public').select('*').eq('dealer_id', user.id);
      setVehicles(vehicleData || []);
      // Dummy statistik
      setStats({ views: Math.floor(Math.random() * 1000) });
    }
    fetchDealer();
  }, [user]);

  async function handleSave() {
    setSaving(true);
    const { error } = await (supabase).from('dealer_profiles').update(form).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Opdateret', description: 'Din forhandlerside er opdateret.' });
    }
  }

  // Logo-upload
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Simpel upload: base64 til supabase function (kan udvides til storage)
    const reader = new FileReader();
    reader.onload = async () => {
      const { data, error } = await supabase.functions.invoke('upload-company-logo', {
        body: { imageBase64: reader.result, contentType: file.type, fileExt: file.name.split('.').pop() },
      });
      if (error) {
        toast({ title: 'Fejl ved upload', description: error.message, variant: 'destructive' });
      } else {
        setForm(f => ({ ...f, logo_url: data.publicUrl }));
        toast({ title: 'Logo uploadet' });
      }
    };
    reader.readAsDataURL(file);
  }

  // Galleri-upload (tilføj ét billede ad gangen)
  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const { data, error } = await supabase.functions.invoke('upload-company-logo', {
        body: { imageBase64: reader.result, contentType: file.type, fileExt: file.name.split('.').pop() },
      });
      if (error) {
        toast({ title: 'Fejl ved upload', description: error.message, variant: 'destructive' });
      } else {
        setForm(f => ({ ...f, images: [...f.images, data.publicUrl] }));
        toast({ title: 'Billede tilføjet til galleri' });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Services
  function handleAddService() {
    setForm(f => ({ ...f, services: [...f.services, ''] }));
  }
  function handleServiceChange(idx: number, value: string) {
    setForm(f => {
      const services = [...f.services];
      services[idx] = value;
      return { ...f, services };
    });
  }
  function handleRemoveService(idx: number) {
    setForm(f => {
      const services = [...f.services];
      services.splice(idx, 1);
      return { ...f, services };
    });
  }

  // FAQ
  function handleAddFaq() {
    setForm(f => ({ ...f, faq: [...f.faq, { q: '', a: '' }] }));
  }
  function handleFaqChange(idx: number, field: 'q' | 'a', value: string) {
    setForm(f => {
      const faq = [...f.faq];
      faq[idx][field] = value;
      return { ...f, faq };
    });
  }
  function handleRemoveFaq(idx: number) {
    setForm(f => {
      const faq = [...f.faq];
      faq.splice(idx, 1);
      return { ...f, faq };
    });
  }

  // Featured vehicles
  function handleToggleFeatured(vehicleId: string) {
    setForm(f => {
      const ids = new Set(f.featured_vehicle_ids);
      if (ids.has(vehicleId)) ids.delete(vehicleId); else ids.add(vehicleId);
      return { ...f, featured_vehicle_ids: Array.from(ids) };
    });
  }

  // Tema
  const themes = [
    { value: 'default', label: 'Standard' },
    { value: 'blue', label: 'Blå' },
    { value: 'dark', label: 'Mørk' },
    { value: 'light', label: 'Lys' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Rediger din forhandlerside</h1>
      <div className="space-y-4">
        <Label>Logo</Label>
        {form.logo_url && <img src={form.logo_url} alt="logo" className="h-16 mb-2" />}
        <Input type="file" accept="image/*" onChange={handleLogoUpload} />
      </div>
      <div className="space-y-4">
        <Label>Galleri</Label>
        <div className="flex gap-2 flex-wrap mb-2">
          {form.images.map((url, i) => <img key={i} src={url} alt="billede" className="h-16 rounded" />)}
        </div>
        <Input type="file" accept="image/*" onChange={handleGalleryUpload} />
      </div>
      <div className="space-y-4">
        <Label>Sociale medier</Label>
        <SocialInput label="Facebook" name="facebook" value={form.facebook} onChange={handleChange} />
        <SocialInput label="Instagram" name="instagram" value={form.instagram} onChange={handleChange} />
        <SocialInput label="LinkedIn" name="linkedin" value={form.linkedin} onChange={handleChange} />
      </div>
      <div className="space-y-4">
        <Label htmlFor="name">Navn</Label>
        <Input id="name" name="name" value={form.name} onChange={handleChange} />
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea id="description" name="description" value={form.description} onChange={handleChange} />
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" value={form.address} onChange={handleChange} />
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" value={form.email} onChange={handleChange} />
        <Label htmlFor="opening_hours">Åbningstider</Label>
        <Input id="opening_hours" name="opening_hours" value={form.opening_hours} onChange={handleChange} />
      </div>
      <div className="space-y-4">
        <Label>Services</Label>
        {form.services.map((s, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <Input value={s} onChange={e => handleServiceChange(i, e.target.value)} placeholder="Service" />
            <Button variant="destructive" size="sm" onClick={() => handleRemoveService(i)}>Fjern</Button>
          </div>
        ))}
        <Button size="sm" onClick={handleAddService}>Tilføj service</Button>
      </div>
      <div className="space-y-4">
        <Label>FAQ</Label>
        {form.faq.map((f, i) => (
          <div key={i} className="mb-2">
            <Input value={f.q} onChange={e => handleFaqChange(i, 'q', e.target.value)} placeholder="Spørgsmål" />
            <Textarea value={f.a} onChange={e => handleFaqChange(i, 'a', e.target.value)} placeholder="Svar" />
            <Button variant="destructive" size="sm" onClick={() => handleRemoveFaq(i)}>Fjern</Button>
          </div>
        ))}
        <Button size="sm" onClick={handleAddFaq}>Tilføj FAQ</Button>
      </div>
      <div className="space-y-4">
        <Label>Udvalgte biler</Label>
        <div className="flex flex-wrap gap-2">
          {vehicles.map(v => (
            <Button key={v.id} variant={form.featured_vehicle_ids.includes(v.id) ? 'default' : 'secondary'} size="sm" onClick={() => handleToggleFeatured(v.id)}>
              {v.make} {v.model}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Label>Tema</Label>
        <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} className="border rounded px-2 py-1">
          {themes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="space-y-4">
        <Label>Kontaktformular</Label>
        <Input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Email til kontaktformular" />
        <Input name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="Telefon til kontaktformular" />
      </div>
      <div className="space-y-4">
        <Label>Statistik</Label>
        <div>Profilvisninger: {stats.views}</div>
      </div>
      <div className="space-y-4">
        <Label>Biler til udlejning</Label>
        <div className="grid gap-2">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="p-2 border rounded flex flex-col gap-1">
              <div className="font-bold">{vehicle.make} {vehicle.model}</div>
              <div>Årgang: {vehicle.year}</div>
              <div>Nummerplade: {vehicle.license_plate}</div>
              {vehicle.image_url && <img src={vehicle.image_url} alt="bil" className="h-12 rounded mt-1" />}
            </div>
          ))}
        </div>
      </div>
      <Button className="mt-6" onClick={handleSave} disabled={saving}>{saving ? 'Gemmer...' : 'Gem ændringer'}</Button>
    </div>
  );
}
