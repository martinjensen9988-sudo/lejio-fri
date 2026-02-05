import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFriAuthContext } from "@/providers/FriAuthProvider";
import { usePages } from "@/hooks/usePages";
import { BlockSettings } from "@/components/PageBuilderSettings";
import { renderBlock } from "@/utils/blockRenderer";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Layout, Type, DollarSign, Car, Calendar, Mail, Image, MousePointer,
  Star, Menu, MapPin, HelpCircle, ImageIcon, BarChart3, Video, Minus,
  Share2, ArrowLeft, Save, Eye, EyeOff, Smartphone, Monitor, Tablet,
  ChevronRight, Sparkles, Layers, Palette, Settings, Trash2, GripVertical,
  Copy, Check, ExternalLink, Undo, Redo, Crown, Zap
} from "lucide-react";
import { toast } from "sonner";

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
  icon: any;
  description: string;
  default_config: Record<string, any>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  blocks: { block_type: string; config: Record<string, any> }[];
}

// Pre-built templates
const TEMPLATES: Template[] = [
  {
    id: "landing",
    name: "Landingpage",
    description: "Komplet hjemmeside med hero, features og kontakt",
    thumbnail: "🏠",
    blocks: [
      { block_type: "hero", config: { headline: "Velkommen til [Firmanavn]", subheadline: "Din pålidelige biludlejningspartner", cta_text: "Book nu", cta_link: "#booking", bg_color: "#0a0d14" } },
      { block_type: "vehicles", config: { title: "Vores Flåde", columns: 3 } },
      { block_type: "stats", config: { title: "Hvorfor vælge os?" } },
      { block_type: "testimonial", config: {} },
      { block_type: "booking", config: { title: "Book dit køretøj" } },
      { block_type: "contact", config: { title: "Kontakt os" } },
      { block_type: "footer", config: {} },
    ],
  },
  {
    id: "showroom",
    name: "Bilforhandler",
    description: "Perfekt til at vise din flåde frem",
    thumbnail: "🚗",
    blocks: [
      { block_type: "hero", config: { headline: "Find din drømmebil", subheadline: "Kvalitetskøretøjer til konkurrencedygtige priser", cta_text: "Se udvalg", cta_link: "#vehicles" } },
      { block_type: "vehicles", config: { title: "Aktuelle tilbud", columns: 4 } },
      { block_type: "gallery", config: { title: "Galleri" } },
      { block_type: "faq", config: { title: "Ofte stillede spørgsmål" } },
      { block_type: "contact", config: { title: "Kontakt os i dag" } },
      { block_type: "footer", config: {} },
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simpel one-pager",
    thumbnail: "✨",
    blocks: [
      { block_type: "hero", config: { headline: "Simple. Elegant. Effektiv.", subheadline: "Alt hvad du behøver", cta_text: "Kom igang" } },
      { block_type: "text", config: { content: "Velkommen til din nye hjemmeside. Tilpas denne tekst efter behov.", alignment: "center" } },
      { block_type: "cta", config: { heading: "Klar til at starte?", button_text: "Kontakt os" } },
      { block_type: "footer", config: {} },
    ],
  },
];

export function PageBuilder() {
  const { id: pageId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useFriAuthContext();
  const lessorId = user?.id || user?.lessor_id;
  const { getPageById, addBlock, updateBlock, deleteBlock, publishPage } = usePages(lessorId);
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPalette, setShowPalette] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [history, setHistory] = useState<PageBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const previewLessor = useMemo(() => ({
    name: user?.company_name || user?.email || "Your Company",
    email: user?.email,
    phone: undefined,
  }), [user]);

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

  // Load page data
  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId, lessorId]);

  // Load block types
  useEffect(() => {
    loadBlockTypes();
  }, []);

  // Save to history when blocks change
  useEffect(() => {
    if (blocks.length > 0 && JSON.stringify(blocks) !== JSON.stringify(history[historyIndex])) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...blocks]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [blocks]);

  const loadPage = async () => {
    if (!pageId) return;
    try {
      setLoadError(null);
      const data = await getPageById(pageId);
      if (!data) {
        setPage(null);
        setBlocks([]);
        setLoadError("Siden kunne ikke findes eller du har ikke adgang.");
        return;
      }
      setPage(data);
      setBlocks(data?.blocks || []);
    } catch (error) {
      setLoadError("Kunne ikke indlaese siden. Proev igen.");
      console.error("Failed to load page:", error);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const applyTemplate = async (template: Template) => {
    if (!page) return;
    
    // Clear existing blocks
    for (const block of blocks) {
      await deleteBlock(page.id, block.id);
    }
    
    // Add template blocks
    const newBlocks: PageBlock[] = [];
    for (let i = 0; i < template.blocks.length; i++) {
      const tb = template.blocks[i];
      const newBlock = await addBlock(page.id, tb.block_type, i, tb.config);
      newBlocks.push(newBlock);
    }
    
    setBlocks(newBlocks);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" anvendt!`);
  };

  const duplicateBlock = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !page) return;
    
    const newBlock = await addBlock(page.id, block.block_type, blocks.length, { ...block.config });
    setBlocks([...blocks, newBlock]);
    toast.success("Block duplikeret");
  };

  const loadBlockTypes = async () => {
    try {
      const allBlockTypes: BlockType[] = [
        // Layout
        { id: "hero", name: "Hero", category: "layout", icon: Layout, description: "Stor hero sektion med overskrift og CTA", default_config: {} },
        { id: "cta", name: "CTA", category: "layout", icon: MousePointer, description: "Call-to-action banner", default_config: {} },
        { id: "footer", name: "Footer", category: "layout", icon: Menu, description: "Sidefod med links og info", default_config: {} },
        { id: "divider", name: "Divider", category: "layout", icon: Minus, description: "Spacer eller separator", default_config: { height: 40, style: "line" } },
        
        // Content
        { id: "text", name: "Tekst", category: "content", icon: Type, description: "Tekst afsnit", default_config: {} },
        { id: "image", name: "Billede", category: "content", icon: Image, description: "Enkelt billede", default_config: {} },
        { id: "gallery", name: "Galleri", category: "content", icon: ImageIcon, description: "Billede galleri/karousel", default_config: { columns: 3 } },
        { id: "video", name: "Video", category: "content", icon: Video, description: "YouTube/Vimeo embed", default_config: {} },
        
        // Business
        { id: "pricing", name: "Priser", category: "business", icon: DollarSign, description: "Pristabel", default_config: {} },
        { id: "vehicles", name: "Køretøjer", category: "business", icon: Car, description: "Vis køretøjer fra flåden", default_config: {} },
        { id: "booking", name: "Booking", category: "business", icon: Calendar, description: "Booking formular", default_config: {} },
        { id: "stats", name: "Statistik", category: "business", icon: BarChart3, description: "Tal og statistikker", default_config: {} },
        
        // Social
        { id: "testimonial", name: "Anmeldelser", category: "social", icon: Star, description: "Kundeanmeldelser", default_config: {} },
        { id: "social", name: "Social Links", category: "social", icon: Share2, description: "Social media links", default_config: {} },
        
        // Forms
        { id: "contact", name: "Kontakt", category: "forms", icon: Mail, description: "Kontaktformular", default_config: {} },
        { id: "faq", name: "FAQ", category: "forms", icon: HelpCircle, description: "Ofte stillede spørgsmål", default_config: {} },
        { id: "map", name: "Kort", category: "forms", icon: MapPin, description: "Google Maps lokation", default_config: {} },
      ];
      setBlockTypes(allBlockTypes);
    } catch (error) {
      console.error("Failed to load block types:", error);
    }
  };

  const addBlockHandler = async (blockTypeId: string) => {
    if (!page) return;

    try {
      const blockType = blockTypes.find(t => t.id === blockTypeId);
      const newBlock = await addBlock(page.id, blockTypeId, blocks.length, blockType?.default_config || {});
      setBlocks([...blocks, newBlock]);
      toast.success(`${blockType?.name || blockTypeId} tilføjet`);
    } catch (error) {
      console.error("Failed to add block:", error);
      toast.error("Kunne ikke tilføje block");
    }
  };

  const updateBlockHandler = async (blockId: string, config: Record<string, any>) => {
    if (!page) return;

    try {
      await updateBlock(page.id, blockId, { config });
      setBlocks(
        blocks.map((b) => (b.id === blockId ? { ...b, config } : b))
      );
      toast.success("Ændringer gemt");
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
      toast.success("Block slettet");
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
      toast.success("Side publiceret!");
    } catch (error) {
      console.error("Failed to publish page:", error);
      toast.error("Kunne ikke publicere");
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

    const updatedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }));
    setBlocks(updatedBlocks);

    // Save new positions to API
    if (!page) return;
    try {
      await Promise.allSettled(
        updatedBlocks.map((block) =>
          updateBlock(page.id, block.id, { position: block.position })
        )
      );
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      default: return "100%";
    }
  };

  const categories = [...new Set(blockTypes.map(t => t.category))];

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0d14]">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-white font-semibold">{loadError}</p>
          <Button onClick={() => navigate("/dashboard/pages")}>Tilbage</Button>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0d14]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
            <Crown className="absolute inset-0 m-auto w-6 h-6 text-amber-400" />
          </div>
          <p className="text-white/60 font-medium">Indlaeser Page Builder...</p>
        </div>
      </div>
    );
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="flex h-screen bg-[#0a0d14] text-white overflow-hidden">
      {/* Component Palette */}
      {showPalette && (
        <div className="w-72 bg-[#0d1117] border-r border-white/10 flex flex-col">
          {/* Palette Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-lg">Komponenter</h2>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {blockTypes.length}
              </Badge>
            </div>
            
            {/* Templates Button */}
            <Button
              variant="outline"
              className="w-full border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
              onClick={() => setShowTemplates(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Brug Template
            </Button>
          </div>

          {/* Block Types List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                  {category === "layout" ? "Layout" : 
                   category === "content" ? "Indhold" : 
                   category === "business" ? "Forretning" : 
                   category === "social" ? "Social" : 
                   category === "forms" ? "Formularer" : category}
                </h3>
                <div className="space-y-1">
                  {blockTypes.filter(t => t.category === category).map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => addBlockHandler(type.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 group-hover:bg-amber-500/30 transition-colors">
                          <Icon className="w-4 h-4 text-amber-300" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-sm">{type.name}</p>
                          <p className="text-xs text-white/40">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-[#0d1117] border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back & Page Info */}
            <div className="flex items-center gap-4">
              <Link to="/fri/dashboard/pages">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tilbage
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg">{page.title}</h1>
                  {page.is_published ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Check className="w-3 h-3 mr-1" />
                      Publiceret
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Kladde
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/40">/{page.slug}</p>
              </div>
            </div>

            {/* Center: Preview Controls */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-2 rounded-md transition-colors ${previewMode === "desktop" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode("tablet")}
                className={`p-2 rounded-md transition-colors ${previewMode === "tablet" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-2 rounded-md transition-colors ${previewMode === "mobile" ? "bg-amber-500/20 text-amber-400" : "text-white/40 hover:text-white"}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-white/60 hover:text-white disabled:opacity-30"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-white/60 hover:text-white disabled:opacity-30"
              >
                <Redo className="w-4 h-4" />
              </Button>
              <div className="h-6 w-px bg-white/10" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPalette(!showPalette)}
                className="text-white/60 hover:text-white"
              >
                <Palette className="w-4 h-4 mr-2" />
                {showPalette ? "Skjul" : "Vis"} Palette
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-white/60 hover:text-white"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? "Rediger" : "Preview"}
              </Button>
              <div className="h-6 w-px bg-white/10" />
              <Button
                onClick={publishPageHandler}
                disabled={isSaving || page.is_published}
                className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black hover:brightness-110"
              >
                <Zap className="w-4 h-4 mr-2" />
                {page.is_published ? "Publiceret" : "Publicer"}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-[#080a0f]">
          <div 
            className="mx-auto transition-all duration-300 bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{ maxWidth: getPreviewWidth() }}
          >
            {showPreview ? (
              // Preview Mode - Render actual blocks
              <div className="min-h-[600px]">
                {blocks.length === 0 ? (
                  <div className="flex items-center justify-center h-96 text-gray-400">
                    <div className="text-center">
                      <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Ingen blokke endnu</p>
                      <p className="text-sm">Tilføj komponenter fra paletten</p>
                    </div>
                  </div>
                ) : (
                  blocks.sort((a, b) => a.position - b.position).map((block) => (
                    <div key={block.id}>
                      {block.block_type === "vehicles"
                        ? renderBlock(block, previewLessor, previewVehicles)
                        : renderBlock(block, previewLessor)}
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Edit Mode - Drag and drop
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="canvas">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[600px] p-4 ${
                        snapshot.isDraggingOver ? "bg-amber-50" : "bg-gray-50"
                      }`}
                    >
                      {blocks.length === 0 ? (
                        <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-200 rounded-lg">
                          <div className="text-center text-gray-400">
                            <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">Ingen blokke endnu</p>
                            <p className="text-sm">Træk komponenter hertil eller klik i paletten</p>
                          </div>
                        </div>
                      ) : (
                        blocks.sort((a, b) => a.position - b.position).map((block, index) => {
                          const blockType = blockTypes.find(t => t.id === block.block_type);
                          const Icon = blockType?.icon || Layout;
                          
                          return (
                            <Draggable key={block.id} draggableId={block.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`mb-3 rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedBlockId === block.id
                                      ? "border-amber-500 shadow-lg shadow-amber-500/20"
                                      : "border-transparent hover:border-gray-200"
                                  } ${snapshot.isDragging ? "shadow-2xl" : ""}`}
                                >
                                  {/* Block Header */}
                                  <div 
                                    className={`flex items-center justify-between px-3 py-2 bg-gray-100 border-b ${
                                      selectedBlockId === block.id ? "bg-amber-50" : ""
                                    }`}
                                    onClick={() => setSelectedBlockId(block.id)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                      <Icon className="w-4 h-4 text-gray-600" />
                                      <span className="font-medium text-sm text-gray-700">
                                        {blockType?.name || block.block_type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteBlockHandler(block.id); }}
                                        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Block Preview */}
                                  <div 
                                    className="bg-white cursor-pointer"
                                    onClick={() => setSelectedBlockId(block.id)}
                                  >
                                    <div className="pointer-events-none transform scale-[0.9] origin-top">
                                      {renderBlock(block)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {selectedBlock && !showPreview && (
        <div className="w-80 bg-[#0d1117] border-l border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  Indstillinger
                </h2>
                <p className="text-sm text-white/40">
                  {blockTypes.find(t => t.id === selectedBlock.block_type)?.name || selectedBlock.block_type}
                </p>
              </div>
              <button
                onClick={() => setSelectedBlockId(null)}
                className="p-1 rounded hover:bg-white/10 text-white/40"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <BlockSettings
              block={selectedBlock}
              onUpdate={(config) => updateBlockHandler(selectedBlock.id, config)}
            />
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <div className="bg-[#0d1117] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-white/10">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                  Vælg Template
                </h2>
                <p className="text-white/50 mt-1">Start med en færdig skabelon og tilpas den</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4">
                {TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all text-left group"
                  >
                    <div className="text-4xl mb-4">{template.thumbnail}</div>
                    <h3 className="font-bold text-lg group-hover:text-amber-100">{template.name}</h3>
                    <p className="text-sm text-white/50 mt-1">{template.description}</p>
                    <p className="text-xs text-white/30 mt-3">{template.blocks.length} blokke</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageBuilder;
