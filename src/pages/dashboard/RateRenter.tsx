import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingStars } from '@/components/ratings/RatingStars';
import { useRenterRatings } from '@/hooks/useRenterRatings';
import { ArrowLeft, Loader2, UserCheck } from 'lucide-react';

const RateRenterPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const renterEmail = searchParams.get('renterEmail') || '';
  const renterName = searchParams.get('renterName') || '';
  const renterId = searchParams.get('renterId') || undefined;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitRating } = useRenterRatings();

  const handleSubmit = async () => {
    if (rating === 0 || !bookingId) return;

    setIsSubmitting(true);
    const success = await submitRating(
      bookingId,
      renterEmail,
      renterName,
      renterId,
      rating,
      reviewText
    );
    setIsSubmitting(false);

    if (success) {
      navigate('/dashboard/bookings');
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Meget dårlig';
      case 2: return 'Dårlig';
      case 3: return 'Okay';
      case 4: return 'God';
      case 5: return 'Fremragende';
      default: return 'Klik på stjernerne for at vurdere';
    }
  };

  return (
    <DashboardLayout activeTab="bookings">
      <div className="max-w-lg mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbage
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Vurder lejeren</CardTitle>
            <CardDescription>
              Hvordan var din oplevelse med {renterName || renterEmail}?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating Stars */}
            <div className="flex flex-col items-center gap-3">
              <Label className="text-base">Din vurdering</Label>
              <RatingStars
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
              />
              <span className="text-sm text-muted-foreground">
                {getRatingLabel(rating)}
              </span>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <Label htmlFor="review">Din anmeldelse (valgfri)</Label>
              <Textarea
                id="review"
                placeholder="Beskriv din oplevelse med lejeren..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                Annuller
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSubmit} 
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send vurdering
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RateRenterPage;
