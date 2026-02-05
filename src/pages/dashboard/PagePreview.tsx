import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { usePages, Page } from "@/hooks/usePages";
import { renderBlock } from "@/utils/blockRenderer";

export function PagePreview() {
  const { id: pageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { getPageById } = usePages(profile?.lessor_id);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previewLessor = useMemo(() => ({
    name: profile?.company_name || profile?.full_name || "Your Company",
    description: profile?.company_name || "",
    email: profile?.email,
    phone: profile?.phone,
  }), [profile]);

  const previewVehicles = useMemo(() => ([
    {
      id: "preview-vehicle-1",
      name: "Sample Vehicle",
      description: "Example description for preview",
      daily_rate: 499,
      image: "",
    },
    {
      id: "preview-vehicle-2",
      name: "City Compact",
      description: "Another example vehicle",
      daily_rate: 349,
      image: "",
    },
  ]), []);

  useEffect(() => {
    const loadPage = async () => {
      if (!pageId || !profile?.lessor_id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getPageById(pageId);
        if (!data) {
          setError("Page not found");
          setPage(null);
        } else {
          setPage(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageId, profile?.lessor_id, getPageById]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Preview Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate("/dashboard/pages")}>Back to pages</Button>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  const blocks = page.blocks || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Preview: {page.title}</h1>
            <p className="text-sm text-gray-500">/{page.slug}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/pages")}>Back</Button>
            <Button onClick={() => navigate(`/dashboard/pages/${page.id}/edit`)}>Edit Page</Button>
          </div>
        </div>
      </div>

      <main className="py-6">
        {blocks.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold mb-2">No blocks yet</h2>
            <p className="text-gray-600">Add blocks in the editor to preview the page.</p>
          </div>
        ) : (
          blocks
            .sort((a, b) => a.position - b.position)
            .map((block) =>
              block.block_type === "vehicles"
                ? renderBlock(block, previewLessor, previewVehicles)
                : renderBlock(block, previewLessor)
            )
        )}
      </main>
    </div>
  );
}
