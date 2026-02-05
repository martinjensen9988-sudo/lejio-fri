import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { usePages } from "@/hooks/usePages";
import { BlockSettings } from "@/components/PageBuilderSettings";
import { useParams } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

interface Page {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  is_published: boolean;
  layout_json: string;
  blocks: PageBlock[];
}

interface PageBlock {
  id: string;
  page_id: string;
  block_type: string;
  position: number;
  config: Record<string, any>;
}

interface BlockType {
  id: string;
  name: string;
  category: string;
  icon: string;
  default_config: Record<string, any>;
}

export function PageBuilder() {
  const { id: pageId } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { getPageById, addBlock, updateBlock, deleteBlock, publishPage } = usePages();
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(true);

  // Load page data
  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  // Load block types
  useEffect(() => {
    loadBlockTypes();
  }, []);

  const loadPage = async () => {
    if (!pageId) return;
    try {
      const data = await getPageById(pageId);
      setPage(data);
      setBlocks(data?.blocks || []);
    } catch (error) {
      console.error("Failed to load page:", error);
    }
  };

  const loadBlockTypes = async () => {
    try {
      // Mock block types for now
      const mockBlockTypes: BlockType[] = [
        {
          id: "hero",
          name: "Hero",
          category: "layout",
          icon: "▢",
          default_config: {},
        },
        {
          id: "text",
          name: "Text",
          category: "content",
          icon: "T",
          default_config: {},
        },
        {
          id: "pricing",
          name: "Pricing",
          category: "business",
          icon: "$",
          default_config: {},
        },
        {
          id: "vehicles",
          name: "Vehicles",
          category: "business",
          icon: "🚗",
          default_config: {},
        },
        {
          id: "booking",
          name: "Booking",
          category: "business",
          icon: "📅",
          default_config: {},
        },
        {
          id: "contact",
          name: "Contact",
          category: "forms",
          icon: "✉",
          default_config: {},
        },
        {
          id: "image",
          name: "Image",
          category: "media",
          icon: "🖼",
          default_config: {},
        },
        {
          id: "cta",
          name: "CTA",
          category: "layout",
          icon: "→",
          default_config: {},
        },
        {
          id: "testimonial",
          name: "Testimonial",
          category: "social",
          icon: "⭐",
          default_config: {},
        },
        {
          id: "footer",
          name: "Footer",
          category: "layout",
          icon: "═",
          default_config: {},
        },
      ];
      setBlockTypes(mockBlockTypes);
    } catch (error) {
      console.error("Failed to load block types:", error);
    }
  };

  const addBlockHandler = async (blockTypeId: string) => {
    if (!page) return;

    try {
      const newBlock = await addBlock(page.id, blockTypeId, blocks.length, {});
      setBlocks([...blocks, newBlock]);
    } catch (error) {
      console.error("Failed to add block:", error);
    }
  };

  const updateBlockHandler = async (blockId: string, config: Record<string, any>) => {
    if (!page) return;

    try {
      await updateBlock(page.id, blockId, { config });
      setBlocks(
        blocks.map((b) => (b.id === blockId ? { ...b, config } : b))
      );
    } catch (error) {
      console.error("Failed to update block:", error);
    }
  };

  const deleteBlockHandler = async (blockId: string) => {
    if (!page) return;

    try {
      await deleteBlock(page.id, blockId);
      setBlocks(blocks.filter((b) => b.id !== blockId));
      setSelectedBlockId(null);
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const publishPageHandler = async () => {
    if (!page) return;

    setIsSaving(true);
    try {
      await publishPage(page.id);
      setPage({ ...page, is_published: true });
    } catch (error) {
      console.error("Failed to publish page:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return;
    }

    const newBlocks = Array.from(blocks);
    const [movedBlock] = newBlocks.splice(source.index, 1);
    newBlocks.splice(destination.index, 0, movedBlock);

    // Update position for all blocks
    const updatedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }));
    setBlocks(updatedBlocks);

    // Save to API
    try {
      await fetch(`/api/pages/${page?.id}/blocks/${draggableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profile?.id}`,
        },
        body: JSON.stringify({ position: destination.index }),
      });
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
    }
  };

  if (!page) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Component Palette */}
      {showPalette && (
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Components</h2>
          </div>

          <div className="p-4 space-y-2">
            {blockTypes.map((type) => (
              <Button
                key={type.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => addBlockHandler(type.id)}
              >
                <span className="mr-2">{type.icon}</span>
                {type.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
            <p className="text-gray-500 text-sm">{page.slug}</p>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowPalette(!showPalette)}
            >
              {showPalette ? "Hide" : "Show"} Palette
            </Button>
            <Button
              onClick={publishPageHandler}
              disabled={isSaving || page.is_published}
              className="bg-green-600 hover:bg-green-700"
            >
              {page.is_published ? "Published" : "Publish"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="canvas">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`max-w-4xl mx-auto space-y-4 ${
                    snapshot.isDraggingOver ? "bg-blue-50 rounded-lg" : ""
                  }`}
                >
                  {blocks.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                      <p>No blocks yet. Add components from the palette →</p>
                    </Card>
                  ) : (
                    blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`p-4 bg-white border-2 rounded-lg cursor-move transition ${
                              selectedBlockId === block.id
                                ? "border-blue-500"
                                : "border-gray-200"
                            } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{block.block_type}</p>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteBlockHandler(block.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Settings Panel */}
      {selectedBlock && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Block Settings</h2>
            <p className="text-gray-500 text-sm">{selectedBlock.block_type}</p>
          </div>

          <BlockSettings
            block={selectedBlock}
            onUpdate={(config) => updateBlockHandler(selectedBlock.id, config)}
          />
        </div>
      )}
    </div>
  );
}
