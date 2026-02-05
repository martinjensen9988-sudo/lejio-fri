import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PageBlock {
  id: string;
  block_type: string;
  config: Record<string, string | number | boolean | undefined>;
}

interface BlockSettingsProps {
  block: PageBlock;
  onUpdate: (config: Record<string, string | number | boolean | undefined>) => void;
}

export function BlockSettings({ block, onUpdate }: BlockSettingsProps) {
  const [config, setConfig] = useState<Record<string, string | number | boolean | undefined>>(block.config || {});

  const handleChange = (key: string, value: string | number | boolean | undefined) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
  };

  const handleSave = () => {
    onUpdate(config);
  };

  const renderConfigInputs = () => {
    switch (block.block_type) {
      case "hero":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <Input
                value={config.headline || ""}
                onChange={(e) => handleChange("headline", e.target.value)}
                placeholder="Enter headline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subheadline</label>
              <Textarea
                value={config.subheadline || ""}
                onChange={(e) => handleChange("subheadline", e.target.value)}
                placeholder="Enter subheadline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTA Button Text</label>
              <Input
                value={config.cta_text || ""}
                onChange={(e) => handleChange("cta_text", e.target.value)}
                placeholder="e.g., Book Now"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Button Link</label>
              <Input
                value={config.cta_link || ""}
                onChange={(e) => handleChange("cta_link", e.target.value)}
                placeholder="e.g., #booking"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.bg_color || "#ffffff"}
                  onChange={(e) => handleChange("bg_color", e.target.value)}
                  className="w-12 h-10 border rounded"
                />
                <Input
                  value={config.bg_color || "#ffffff"}
                  onChange={(e) => handleChange("bg_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <Textarea
                value={config.content || ""}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Enter text content"
                rows={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alignment</label>
              <select
                value={config.alignment || "left"}
                onChange={(e) => handleChange("alignment", e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={config.title || "Pricing"}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Show Description
              </label>
              <input
                type="checkbox"
                checked={config.show_description || true}
                onChange={(e) => handleChange("show_description", e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        );

      case "vehicles":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={config.title || "Our Fleet"}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Items per Row
              </label>
              <Input
                type="number"
                min="1"
                max="4"
                value={config.columns || 3}
                onChange={(e) => handleChange("columns", parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Show Filters
              </label>
              <input
                type="checkbox"
                checked={config.show_filters || true}
                onChange={(e) => handleChange("show_filters", e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        );

      case "booking":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={config.title || "Book Now"}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Show Availability
              </label>
              <input
                type="checkbox"
                checked={config.show_availability || true}
                onChange={(e) => handleChange("show_availability", e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Form Title</label>
              <Input
                value={config.title || "Contact Us"}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Submit Button Text
              </label>
              <Input
                value={config.submit_text || "Send"}
                onChange={(e) => handleChange("submit_text", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Recipient Email
              </label>
              <Input
                type="email"
                value={config.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                value={config.image_url || ""}
                onChange={(e) => handleChange("image_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alt Text</label>
              <Input
                value={config.alt_text || ""}
                onChange={(e) => handleChange("alt_text", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Image Height (px)
              </label>
              <Input
                type="number"
                value={config.height || 300}
                onChange={(e) => handleChange("height", parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case "cta":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Heading</label>
              <Input
                value={config.heading || ""}
                onChange={(e) => handleChange("heading", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={config.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Button Text</label>
              <Input
                value={config.button_text || "Click Here"}
                onChange={(e) => handleChange("button_text", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Button Link</label>
              <Input
                value={config.button_link || ""}
                onChange={(e) => handleChange("button_link", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.bg_color || "#ffffff"}
                  onChange={(e) => handleChange("bg_color", e.target.value)}
                  className="w-12 h-10 border rounded"
                />
              </div>
            </div>
          </div>
        );

      case "testimonial":
      case "footer":
      default:
        return (
          <div className="p-4 text-gray-500 text-sm">
            <p>Settings for this block type coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 space-y-4">
      {renderConfigInputs()}
      <Button
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Save Settings
      </Button>
    </div>
  );
}
