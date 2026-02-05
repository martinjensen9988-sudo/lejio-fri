import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LessorStatusBadge } from './LessorStatusBadge';
import { RatingStars } from './RatingStars';
import { useLessorRatings, getNextStatusRequirements } from '@/hooks/useLessorRatings';
import { Star, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LessorRatingsCardProps {
  lessorId: string;
}

export const LessorRatingsCard = ({ lessorId }: LessorRatingsCardProps) => {
  const { ratings, stats, isLoading } = useLessorRatings(lessorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const nextStatusHint = getNextStatusRequirements(
    stats.lessor_status,
    stats.average_rating,
    stats.total_rating_count
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Din udlejer-status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <LessorStatusBadge status={stats.lessor_status} size="lg" />
          <div className="text-right">
            <RatingStars rating={stats.average_rating} showValue />
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total_rating_count} anmeldelser
            </p>
          </div>
        </div>

        {nextStatusHint && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-accent mt-0.5" />
              <p className="text-sm text-foreground">{nextStatusHint}</p>
            </div>
          </div>
        )}

        {ratings.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-sm font-medium">Seneste anmeldelser</h4>
            {ratings.slice(0, 3).map((rating) => (
              <div key={rating.id} className="space-y-1">
                <RatingStars rating={rating.rating} size="sm" />
                {rating.review_text && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    "{rating.review_text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
