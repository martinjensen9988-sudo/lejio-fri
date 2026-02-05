import { Star, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './RatingStars';
import { 
  useRenterRatings, 
  getRenterRatingLabel, 
  getRenterRatingColor 
} from '@/hooks/useRenterRatings';

interface RenterRatingBadgeProps {
  renterEmail: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RenterRatingBadge = ({ 
  renterEmail, 
  showDetails = false,
  size = 'md' 
}: RenterRatingBadgeProps) => {
  const { stats, isLoading } = useRenterRatings(renterEmail);

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Star className="w-3 h-3 mr-1" />
        Henter...
      </Badge>
    );
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <User className="w-3 h-3 mr-1" />
        Ny lejer
      </Badge>
    );
  }

  const colorClass = getRenterRatingColor(stats.average_rating);
  const label = getRenterRatingLabel(stats.average_rating);

  if (showDetails) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <RatingStars rating={stats.average_rating} size={size} />
          <span className="text-sm font-medium">
            {stats.average_rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={colorClass}>
            {label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({stats.total_ratings} {stats.total_ratings === 1 ? 'vurdering' : 'vurderinger'})
          </span>
        </div>
      </div>
    );
  }

  return (
    <Badge className={colorClass}>
      <Star className="w-3 h-3 mr-1 fill-current" />
      {stats.average_rating.toFixed(1)} ({stats.total_ratings})
    </Badge>
  );
};
