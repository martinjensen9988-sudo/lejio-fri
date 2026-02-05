import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useVehicleImages, VehicleImage } from '@/hooks/useVehicleImages';
import { Upload, X, Loader2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface VehicleImageGalleryProps {
  vehicleId: string;
  legacyImageUrl?: string;
  onLegacyImageClear?: () => void;
}

const VehicleImageGallery = ({ vehicleId, legacyImageUrl, onLegacyImageClear }: VehicleImageGalleryProps) => {
  const { images, isLoading, uploadImage, deleteImage } = useVehicleImages(vehicleId);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // Upload all selected files
    for (let i = 0; i < files.length; i++) {
      await uploadImage(files[i]);
    }
    
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    await deleteImage(imageId);
  };

  // Combine legacy image with new images for display
  const allImages: { id: string; url: string; isLegacy: boolean }[] = [
    ...(legacyImageUrl ? [{ id: 'legacy', url: legacyImageUrl, isLegacy: true }] : []),
    ...images.map(img => ({ id: img.id, url: img.image_url, isLegacy: false })),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {allImages.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-video rounded-xl overflow-hidden bg-muted border-2 border-border hover:border-primary/30 transition-colors"
            >
              <img
                src={image.url}
                alt={`Billede ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* First image indicator */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                  Hovedbillede
                </div>
              )}
              
              {/* Delete button */}
              <button
                onClick={() => image.isLegacy ? onLegacyImageClear?.() : handleDelete(image.id)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                title="Slet billede"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              
              {/* Drag handle (for future drag-and-drop) */}
              <div className="absolute bottom-2 left-2 p-1 bg-background/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {allImages.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Ingen billeder endnu. Upload billeder af dit køretøj.
          </p>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Uploader...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload billeder
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Upload op til 10 billeder. Det første billede vises som hovedbillede. Max 5MB pr. billede.
      </p>
    </div>
  );
};

export default VehicleImageGallery;
