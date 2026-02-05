import { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
  showIndicators?: boolean;
  showArrows?: boolean;
  fallbackIcon?: React.ReactNode;
}

const ImageCarousel = ({
  images,
  alt = 'Image',
  className,
  aspectRatio = 'video',
  showIndicators = true,
  showArrows = true,
  fallbackIcon,
}: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const validImages = useMemo(() => images.filter(Boolean), [images]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (validImages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }
  }, [validImages.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (validImages.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    }
  }, [validImages.length]);

  const goToImage = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex(index);
  }, []);

  const aspectClass = useMemo(() => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return '';
    }
  }, [aspectRatio]);

  if (validImages.length === 0) {
    return (
      <div className={cn(
        'bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center',
        aspectClass,
        className
      )}>
        {fallbackIcon || <Car className="w-12 h-12 text-muted-foreground/50" />}
      </div>
    );
  }

  return (
    <div 
      className={cn('relative overflow-hidden', aspectClass, className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Current Image */}
      <img
        src={validImages[currentIndex]}
        alt={`${alt} ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
      />

      {/* Navigation Arrows */}
      {showArrows && validImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground shadow-md transition-all duration-200',
              isHovering ? 'opacity-100' : 'opacity-0',
              'hover:bg-background hover:scale-110'
            )}
            aria-label="Forrige billede"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImage}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground shadow-md transition-all duration-200',
              isHovering ? 'opacity-100' : 'opacity-0',
              'hover:bg-background hover:scale-110'
            )}
            aria-label="Næste billede"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {showIndicators && validImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToImage(index, e)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentIndex
                  ? 'bg-primary w-4'
                  : 'bg-background/60 hover:bg-background/80'
              )}
              aria-label={`Gå til billede ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {validImages.length > 1 && (
        <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm rounded-md text-foreground">
          {currentIndex + 1}/{validImages.length}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
