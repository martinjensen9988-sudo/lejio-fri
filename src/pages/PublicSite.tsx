import React, { useEffect, useState } from "react";
import { renderBlock } from "@/utils/blockRenderer";

interface Page {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  is_published: boolean;
  layout_json: string;
  blocks: PageBlock[];
  lessor_id: string;
}

interface PageBlock {
  id: string;
  block_type: string;
  config: Record<string, any>;
}

interface Lessor {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  primary_color: string;
}

export function PublicSiteRenderer({
  lessorId,
  pageSlug = "home",
}: {
  lessorId: string;
  pageSlug?: string;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const [lessor, setLessor] = useState<Lessor | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [lessorId, pageSlug]);

  const loadPage = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch page
      const pageRes = await fetch(
        `/api/pages?lessor_id=${lessorId}&slug=${pageSlug}`
      );
      if (!pageRes.ok) throw new Error("Page not found");
      const pages = await pageRes.json();
      const currentPage = pages.find(
        (p: Page) => p.slug === pageSlug && p.is_published
      );

      if (!currentPage) throw new Error("Page not published");

      setPage(currentPage);

      // Fetch lessor info
      const lessorRes = await fetch(`/api/lessors/${lessorId}`);
      if (lessorRes.ok) {
        const lessorData = await lessorRes.json();
        setLessor(lessorData);
      }

      // Fetch vehicles
      const vehiclesRes = await fetch(
        `/api/vehicles?lessor_id=${lessorId}&available=true`
      );
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  // Parse blocks from layout_json or use blocks array
  const blocks = page.blocks || [];
  const primaryColor = lessor?.primary_color || "#3b82f6";

  return (
    <div
      className="min-h-screen"
      style={{ "--primary-color": primaryColor } as React.CSSProperties}
    >
      {/* Meta tags for SEO */}
      <head>
        <title>{page.title}</title>
        <meta name="description" content={page.meta_description} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.meta_description} />
      </head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {lessor?.name || "Car Rental"}
              </h1>
            </div>
            <div className="space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Home
              </a>
              <a href="#vehicles" className="text-gray-600 hover:text-gray-900">
                Vehicles
              </a>
              <a href="#booking" className="text-gray-600 hover:text-gray-900">
                Book
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>
        {blocks.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome</h2>
            <p className="text-gray-600">This page is empty. Add blocks to get started!</p>
          </div>
        ) : (
          blocks
            .sort((a, b) => a.position - b.position)
            .map((block) =>
              block.block_type === "vehicles"
                ? renderBlock(block, lessor, vehicles)
                : renderBlock(block, lessor)
            )
        )}
      </main>
    </div>
  );
}

// Component for dynamic routing based on domain + slug
export function DynamicPublicSite() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const pageSlug = pathname === "/" ? "home" : pathname.slice(1);

  // Map custom domain to lessor_id (would come from backend mapping)
  const lessorIdMap: Record<string, string> = {
    // Example mappings - would be fetched from backend
    "example-lessor.com": "lessor-id-123",
    "another-lessor.com": "lessor-id-456",
  };

  const lessorId = lessorIdMap[hostname];

  if (!lessorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Domain Not Found</h1>
          <p className="text-gray-600">
            This domain is not connected to any rental service.
          </p>
        </div>
      </div>
    );
  }

  return <PublicSiteRenderer lessorId={lessorId} pageSlug={pageSlug} />;
}
