import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePages } from "@/hooks/usePages";
import { useNavigate } from "react-router-dom";

export function PagesDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { pages, createPage, deletePage, getPages } = usePages();
  const [displayPages, setDisplayPages] = useState(pages);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPageData, setNewPageData] = useState({
    title: "",
    slug: "",
  });

  useEffect(() => {
    loadPages();
  }, []);

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
      alert("Please fill in all fields");
      return;
    }

    try {
      const newPage = await createPage(
        profile?.lessor_id || "",
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
      alert("Failed to create page");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await deletePage(pageId);
      setDisplayPages(displayPages.filter((p) => p.id !== pageId));
    } catch (error) {
      console.error("Failed to delete page:", error);
      alert("Failed to delete page");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Website Pages</h1>
        <p className="text-gray-600">
          Create and manage your custom website pages
        </p>
      </div>

      <div className="mb-8">
        {showNewForm ? (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Create New Page</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={newPageData.title}
                  onChange={(e) =>
                    setNewPageData({ ...newPageData, title: e.target.value })
                  }
                  placeholder="e.g., Home, About Us, Contact"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  URL Slug (no spaces)
                </label>
                <Input
                  value={newPageData.slug}
                  onChange={(e) =>
                    setNewPageData({ ...newPageData, slug: e.target.value })
                  }
                  placeholder="e.g., home, about-us, contact"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreatePage} className="bg-blue-600">
                  Create Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button
            onClick={() => setShowNewForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create New Page
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {displayPages.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-bold mb-2">No pages yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first page to get started with your website
            </p>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-blue-600"
            >
              Create First Page
            </Button>
          </Card>
        ) : (
          displayPages.map((page) => (
            <Card key={page.id} className="p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">{page.title}</h3>
                    {page.is_published && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        Published
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">/{page.slug}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Updated {new Date(page.updated_at).toLocaleDateString()}
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
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      navigate(`/dashboard/pages/${page.id}/edit`)
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    Delete
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
        <h2 className="text-2xl font-bold mb-4">Custom Domain</h2>
        <Card className="p-6">
          <p className="text-gray-600 mb-4">
            Connect your own domain to your rental website
          </p>
          <Button variant="outline" className="mb-4">
            + Connect Domain
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-2">
              Domain Setup Instructions:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Enter your domain name (e.g., rentals.example.com)</li>
              <li>Add these DNS records to your domain:</li>
              <li className="ml-4">
                CNAME: rentals.example.com → lejio.azurewebsites.net
              </li>
              <li>Verify domain ownership</li>
              <li>SSL certificate is auto-generated (24-48 hours)</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
}
