

import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/azure/client';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

interface GlobalPageData {
  id: number;
  title: string;
  slug: string;
  content_markdown: string;
  image_urls?: string[];
  video_urls?: string[];
}

export default function GlobalPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<GlobalPageData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPage() {
      const { data } = await supabase.from('global_pages').select('*').eq('slug', slug).single() as { data: GlobalPageData | null };
      if (!data) {
        setNotFound(true);
        setPage(null);
      } else {
        setPage(data);
        setNotFound(false);
      }
    }
    fetchPage();
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="mb-4">Ups! Siden blev ikke fundet</p>
        <Link to="/" className="text-primary underline">Tilbage til forsiden</Link>
      </div>
    );
  }
  if (!page) return <div className="min-h-screen flex items-center justify-center">Indlæser...</div>;

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
        <ReactMarkdown>{page.content_markdown || ''}</ReactMarkdown>
        <div className="flex gap-2 mt-4 flex-wrap">
          {page.image_urls?.map((url: string) => <img key={url} src={url} alt="billede" className="h-32 rounded" />)}
          {page.video_urls?.map((url: string) => <video key={url} src={url} className="h-32 rounded" controls />)}
        </div>
      </Card>
    </div>
  );
}
