import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useFriAuthContext } from "@/providers/FriAuthProvider";
import { usePages } from "@/hooks/usePages";
import { useNavigate } from "react-router-dom";

export function PagesDashboard() {
  const { user } = useFriAuthContext();
  const lessorId = user?.id || user?.lessor_id;
  const navigate = useNavigate();
  const { pages, createPage, deletePage, getPages } = usePages(lessorId);
  const [displayPages, setDisplayPages] = useState(pages);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: "",
    slug: "",
  });

  useEffect(() => {
    if (lessorId) {
      loadPages();
    }
  }, [lessorId]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await getPages();
      setDisplayPages(data || []);
    } catch (error) {
      console.error("Failed to load pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageData.title || !newPageData.slug) {
      alert("Udfyld venligst alle felter");
      return;
    }

    if (!lessorId) {
      alert("Du skal være logget ind for at oprette sider");
      return;
    }

    try {
      const newPage = await createPage(
        lessorId,
        newPageData.title,
        newPageData.slug,
        ""
      );
      setDisplayPages([...displayPages, newPage]);
      setShowNewForm(false);
      setNewPageData({ title: "", slug: "" });

      // Navigate to editor
      navigate(`/dashboard/pages/${newPage.id}/edit`);
    } catch (error) {
      console.error("Failed to create page:", error);
      alert(error instanceof Error ? error.message : "Kunne ikke oprette side");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne side?")) return;

    try {
      await deletePage(pageId);
      setDisplayPages(displayPages.filter((p) => p.id !== pageId));
    } catch (error) {
      console.error("Failed to delete page:", error);
      alert("Kunne ikke slette side");
    }
  };

  if (loading || !lessorId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Indlæser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Websider</h1>
        <p className="text-gray-600">
          Opret og administrer dine egne websider
        </p>
      </div>

      <div className="mb-8">
        {showNewForm ? (
          <Card className="p-6 bg-white">
            <h2 className="text-xl font-bold mb-4">Opret ny side</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <Input
                  value={newPageData.title}
                  onChange={(e) =>
                    setNewPageData({ ...newPageData, title: e.target.value })
                  }
                  placeholder="f.eks. Forside, Om os, Kontakt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  URL Slug (ingen mellemrum)
                </label>
                <Input
                  value={newPageData.slug}
                  onChange={(e) =>
                    setNewPageData({ ...newPageData, slug: e.target.value })
                  }
                  placeholder="f.eks. forside, om-os, kontakt"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreatePage} className="bg-pink-500 hover:bg-pink-600">
                  Opret side
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                >
                  Annuller
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button
            onClick={() => setShowNewForm(true)}
            className="bg-pink-500 hover:bg-pink-600"
          >
            + Opret ny side
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {displayPages.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <h3 className="text-xl font-bold mb-2">Ingen sider endnu</h3>
            <p className="text-gray-600 mb-4">
              Opret din første side for at komme i gang med din hjemmeside
            </p>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Opret første side
            </Button>
          </Card>
        ) : (
          displayPages.map((page) => (
            <Card key={page.id} className="p-6 bg-white hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{page.title}</h3>
                    {page.is_published && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        Publiceret
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">/{page.slug}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Opdateret {new Date(page.updated_at).toLocaleDateString('da-DK')}
                  </p>
                </div>

                <div className="space-x-2 flex">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/dashboard/pages/${page.id}/preview`)
                    }
                  >
                    Vis
                  </Button>
                  <Button
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600"
                    onClick={() =>
                      navigate(`/dashboard/pages/${page.id}/edit`)
                    }
                  >
                    Rediger
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    Slet
                  </Button>
                </div>
              </div>

              {page.meta_description && (
                <p className="text-gray-700 text-sm">
                  {page.meta_description}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Domain Management Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Eget domæne</h2>
        <Card className="p-6 bg-white">
          <p className="text-gray-600 mb-4">
            Tilslut dit eget domæne til din udlejningshjemmeside
          </p>
          <Button variant="outline" className="mb-4">
            + Tilslut domæne
          </Button>

          <div className="bg-pink-50 border border-pink-200 rounded p-4 text-sm">
            <p className="font-semibold text-pink-900 mb-2">
              Opsætningsinstruktioner:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-pink-800">
              <li>Indtast dit domænenavn (f.eks. biludlejning.dk)</li>
              <li>Tilføj disse DNS-records til dit domæne:</li>
              <li className="ml-4">
                CNAME: www.ditdomæne.dk → lejio-fri.onrender.com
              </li>
              <li>Bekræft domæneejerskab</li>
              <li>SSL-certifikat genereres automatisk (24-48 timer)</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}
