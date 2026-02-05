import { useState, useEffect, useRef } from 'react';
// Kald Google edge function for AI-beskrivelse
async function generateAIDescription({ title, slug }: { title: string; slug: string }) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-global-page-description-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, slug }),
  });
  if (!res.ok) throw new Error('AI-beskrivelse kunne ikke genereres');
  const data = await res.json();
  return data.description;
}
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from './AdminDashboardLayout';

// Simple markdown editor (can be replaced with react-markdown or similar)
function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Textarea value={value} onChange={e => onChange(e.target.value)} rows={10} placeholder="Skriv tekst i markdown..." />;
}

export default function AdminGlobalPages() {
  interface GlobalPage {
    id: number;
    title: string;
    slug: string;
    content_markdown: string;
    image_urls?: string[];
    video_urls?: string[];
    created_at?: string;
  }

  const editRef = useRef<HTMLDivElement>(null);
  const { user, isSuperAdmin } = useAdminAuth();
  const [pages, setPages] = useState<GlobalPage[]>([]);
  const [editing, setEditing] = useState<GlobalPage | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content_markdown: '', image_urls: [] as string[], video_urls: [] as string[] });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  async function fetchPages() {
    const { data } = await supabase.from('global_pages').select('*').order('created_at', { ascending: false });
    setPages((data || []) as GlobalPage[]);
  }

  function startEdit(page: GlobalPage) {
    setEditing(page);
    setForm({ 
      title: page.title,
      slug: page.slug,
      content_markdown: page.content_markdown,
      image_urls: page.image_urls || [],
      video_urls: page.video_urls || []
    });
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  function startNew() {
    setEditing(null);
    setForm({ title: '', slug: '', content_markdown: '', image_urls: [], video_urls: [] });
  }

  async function handleAIGenerate() {
    if (!form.title || !form.slug) {
      toast.error('Titel og slug skal udfyldes først!');
      return;
    }
    setUploading(true);
    try {
      const aiText = await generateAIDescription({ title: form.title, slug: form.slug });
      setForm(f => ({ ...f, content_markdown: aiText }));
      toast.success('AI-tekst genereret! Husk at trykke Gem for at gemme.');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ukendt fejl';
      toast.error('Kunne ikke generere AI-tekst: ' + errorMessage);
    }
    setUploading(false);
  }

  async function savePage() {
    setUploading(true);
    let error = null;
    if (editing) {
      const res = await supabase.from('global_pages').update(form).eq('id', editing.id);
      error = res.error;
    } else {
      const res = await supabase.from('global_pages').insert([form]);
      error = res.error;
    }
    setUploading(false);
    if (error) {
      toast.error('Kunne ikke gemme siden: ' + error.message);
      return;
    }
    setEditing(null);
    fetchPages();
    toast.success('Side gemt!');
  }

  async function deletePage(id: number) {
    const res = await supabase.from('global_pages').delete().eq('id', id);
    if (res.error) {
      toast.error('Kunne ikke slette siden: ' + res.error.message);
      return;
    }
    fetchPages();
    toast.success('Side slettet!');
  }

  // Simple file upload to Supabase Storage
  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `${type}s/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('public').upload(filePath, file);
    if (error) {
      toast.error('Kunne ikke uploade fil: ' + error.message);
      setUploading(false);
      return;
    }
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('public').getPublicUrl(filePath);
      setForm(f => ({
        ...f,
        [type === 'image' ? 'image_urls' : 'video_urls']: [...(f[type === 'image' ? 'image_urls' : 'video_urls'] || []), publicUrl],
      }));
      toast.success('Fil uploadet!');
    }
    setUploading(false);
  }

  return (
    <AdminDashboardLayout activeTab="global-pages">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Globale sider</h1>
        <p className="text-muted-foreground mb-4">Opret og rediger indholdssider med tekst, billeder og video.</p>
        <Button onClick={startNew} variant="default" className="mb-4">Opret ny side</Button>
        <div className="grid gap-4 mb-8">
          {pages.map(page => (
            <Card key={page.id} className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">{page.title}</span>
                  <Badge variant="secondary" className="ml-2">/{page.slug}</Badge>
                </div>
                <div>
                  <Button size="sm" onClick={() => startEdit(page)}>Rediger</Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePage(page.id)} className="ml-2">Slet</Button>
                </div>
              </div>
              <div className="text-muted-foreground text-sm">{page.content_markdown?.slice(0, 120)}...</div>
              <div className="flex gap-2 mt-2">
                {page.image_urls?.map((url: string) => <img key={url} src={url} alt="billede" className="h-12 rounded" />)}
                {page.video_urls?.map((url: string) => <video key={url} src={url} className="h-12 rounded" controls />)}
              </div>
            </Card>
          ))}
        </div>
        <Card className="p-4 mb-8" ref={editRef}>
          <h2 className="font-bold mb-2">{editing ? 'Rediger side' : 'Opret ny side'}</h2>
          <label className="block mb-1 font-medium">Titel</label>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Titel på siden"
            className="mb-2"
          />
          <label className="block mb-1 font-medium">Slug</label>
          <Input
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))}
            placeholder="URL slug (fx: min-side)"
            className="mb-2"
          />
          <MarkdownEditor value={form.content_markdown} onChange={v => setForm(f => ({ ...f, content_markdown: v }))} />
          <div className="flex gap-2 mt-2">
            <input type="file" accept="image/*" onChange={e => uploadFile(e, 'image')} disabled={uploading} />
            <input type="file" accept="video/*" onChange={e => uploadFile(e, 'video')} disabled={uploading} />
          </div>
          <div className="flex gap-2 mt-2">
            {form.image_urls?.map((url: string) => <img key={url} src={url} alt="billede" className="h-12 rounded" />)}
            {form.video_urls?.map((url: string) => <video key={url} src={url} className="h-12 rounded" controls />)}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={savePage} disabled={uploading}>Gem</Button>
            <Button onClick={handleAIGenerate} disabled={uploading} variant="secondary">Generér AI-tekst</Button>
          </div>
        </Card>

        <div className="mt-8">
          <h3 className="font-bold text-lg mb-2">Dine sider</h3>
          <div className="grid gap-4">
            {pages.length === 0 && <div className="text-muted-foreground">Ingen sider oprettet endnu.</div>}
            {pages.map(page => (
              <Card key={page.id} className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg">{page.title}</span>
                    <Badge variant="secondary" className="ml-2">/{page.slug}</Badge>
                  </div>
                  <div>
                    <Button size="sm" onClick={() => startEdit(page)}>Rediger</Button>
                    <Button size="sm" variant="destructive" onClick={() => deletePage(page.id)} className="ml-2">Slet</Button>
                  </div>
                </div>
                <div className="text-muted-foreground text-sm">{page.content_markdown?.slice(0, 120)}...</div>
                <div className="flex gap-2 mt-2">
                  {page.image_urls?.map((url: string) => <img key={url} src={url} alt="billede" className="h-12 rounded" />)}
                  {page.video_urls?.map((url: string) => <video key={url} src={url} className="h-12 rounded" controls />)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
