import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  vehicleId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
}

const FavoriteButton = ({ 
  vehicleId, 
  className,
  size = 'icon',
  variant = 'ghost'
}: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();
  const favorited = isFavorite(vehicleId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleFavorite(vehicleId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        favorited && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart 
        className={cn(
          "w-5 h-5 transition-all",
          favorited && "fill-current"
        )} 
      />
    </Button>
  );
};

export default FavoriteButton;
