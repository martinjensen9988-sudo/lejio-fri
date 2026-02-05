import { useState, useCallback } from "react";

export interface Page {
  id: string;
  lessor_id: string;
  slug: string;
  title: string;
  meta_description: string;
  is_published: boolean;
  blocks: PageBlock[];
  created_at: string;
  updated_at: string;
}

export interface PageBlock {
  id: string;
  page_id: string;
  block_type: string;
  position: number;
  config: Record<string, any>;
}

const API_BASE = "/api";

export function usePages(lessorId?: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  const getPages = useCallback(async () => {
    if (!lessorId) {
      console.warn("lessorId required for getPages");
      return [];
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/GetPages?lessor_id=${lessorId}`);
      if (!response.ok) throw new Error("Failed to fetch pages");
      const data = await response.json();
      setPages(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching pages:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  const getPageById = useCallback(
    async (pageId: string) => {
      if (!lessorId) return null;

      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/GetPages?lessor_id=${lessorId}&page_id=${pageId}`
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data[0] || null;
      } catch (error) {
        console.error("Error fetching page:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [lessorId]
  );

  const createPage = useCallback(
    async (
      lessor_id: string,
      title: string,
      slug: string,
      meta_description: string = ""
    ): Promise<Page> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/CreatePage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessor_id, title, slug, meta_description }),
        });
        if (!response.ok) throw new Error("Failed to create page");
        const newPage = await response.json();
        setPages([...pages, newPage]);
        return newPage;
      } catch (error) {
        console.error("Error creating page:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [pages]
  );

  const updatePage = useCallback(
    async (pageId: string, updates: Partial<Page>) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/UpdatePage`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_id: pageId, ...updates }),
        });
        if (!response.ok) throw new Error("Failed to update page");
        const updatedPage = await response.json();
        setPages(pages.map((p) => (p.id === pageId ? updatedPage : p)));
        return updatedPage;
      } catch (error) {
        console.error("Error updating page:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [pages]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/DeletePage?page_id=${pageId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete page");
        setPages(pages.filter((p) => p.id !== pageId));
      } catch (error) {
        console.error("Error deleting page:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [pages]
  );

  const publishPage = useCallback(
    async (pageId: string) => {
      return updatePage(pageId, { is_published: true });
    },
    [updatePage]
  );

  const addBlock = useCallback(
    async (
      pageId: string,
      block_type: string,
      position: number,
      config: Record<string, any>
    ): Promise<PageBlock> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/AddPageBlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_id: pageId, block_type, position, config }),
        });
        if (!response.ok) throw new Error("Failed to add block");
        const newBlock = await response.json();
        setPages(
          pages.map((p) =>
            p.id === pageId ? { ...p, blocks: [...(p.blocks || []), newBlock] } : p
          )
        );
        return newBlock;
      } catch (error) {
        console.error("Error adding block:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [pages]
  );

  const updateBlock = useCallback(
    async (pageId: string, blockId: string, updates: Partial<PageBlock>) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/UpdatePageBlock`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_id: pageId, block_id: blockId, ...updates }),
        });
        if (!response.ok) throw new Error("Failed to update block");
        const updatedBlock = await response.json();
        setPages(
          pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  blocks: p.blocks.map((b) => (b.id === blockId ? updatedBlock : b)),
                }
              : p
          )
        );
        return updatedBlock;
      } catch (error) {
        console.error("Error updating block:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [pages]
  );

  const deleteBlock = useCallback(
    async (pageId: string, blockId: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/DeletePageBlock?page_id=${pageId}&block_id=${blockId}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("Failed to delete block");
        setPages(
          pages.map((p) =>
            p.id === pageId
              ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }
              : p
          )
        );
      } catch (error) {
        console.error("Error deleting block:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [pages]
  );

  return {
    pages,
    loading,
    getPages,
    getPageById,
    createPage,
    updatePage,
    deletePage,
    publishPage,
    addBlock,
    updateBlock,
    deleteBlock,
  };
}
