import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Check, ChevronRight, RotateCcw, Link2 } from 'lucide-react';

interface MCCheckInGuideProps {
  onPhotoCapture: (photoType: string, photoUrl: string) => void;
  onComplete: () => void;
  checkType: 'check_in' | 'check_out';
  capturedPhotos: Record<string, string>;
  requireChainCheck?: boolean;
}

const PHOTO_STEPS = [
  {
    id: 'left_side',
    title: 'Venstre side',
    description: 'Tag billede af venstre side inkl. kåbe og udstødning',
    icon: '←',
    tips: ['Vis hele kåben', 'Inkluder udstødning', 'Pas på spejlet er synligt'],
  },
  {
    id: 'right_side',
    title: 'Højre side',
    description: 'Tag billede af højre side inkl. kåbe og motor',
    icon: '→',
    tips: ['Vis hele kåben', 'Inkluder motorområdet', 'Pas på spejlet er synligt'],
  },
  {
    id: 'front_wheel',
    title: 'Forhjul & fælg',
    description: 'Tag nærbillede af forhjulet og fælgen',
    icon: '◯',
    tips: ['Vis mønsterdybde', 'Inkluder hele fælgen', 'Tjek for skader på fælg'],
  },
  {
    id: 'rear_wheel',
    title: 'Baghjul & fælg',
    description: 'Tag nærbillede af baghjulet og fælgen',
    icon: '◯',
    tips: ['Vis mønsterdybde', 'Inkluder hele fælgen', 'Vis kæden i baggrunden'],
  },
];

const CHAIN_STEP = {
  id: 'chain',
  title: 'Kæde-tjek',
  description: 'Tag billede af kæden og bekræft den er smurt',
  icon: '⛓',
  tips: ['Vis kædens tilstand', 'Tjek for rust', 'Bekræft smøring'],
};

export const MCCheckInGuide = ({
  onPhotoCapture,
  onComplete,
  checkType,
  capturedPhotos,
  requireChainCheck = false,
}: MCCheckInGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const allSteps = requireChainCheck ? [...PHOTO_STEPS, CHAIN_STEP] : PHOTO_STEPS;
  const completedCount = Object.keys(capturedPhotos).length;
  const progress = (completedCount / allSteps.length) * 100;
  const currentStepData = allSteps[currentStep];
  const isCurrentCaptured = currentStepData && capturedPhotos[currentStepData.id];
  const allCaptured = completedCount === allSteps.length;

  const handleCapture = () => {
    // In real implementation, this would open camera
    // For now, we'll simulate with a placeholder
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && currentStepData) {
        // In production, upload to storage and get URL
        const url = URL.createObjectURL(file);
        onPhotoCapture(currentStepData.id, url);
      }
    };
    input.click();
  };

  const handleNext = () => {
    if (currentStep < allSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" />
          {checkType === 'check_in' ? 'MC Check-in' : 'MC Check-out'}
        </CardTitle>
        <CardDescription>
          Tag billeder fra alle vinkler for dokumentation
        </CardDescription>
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount} af {allSteps.length} billeder taget
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 flex-wrap">
          {allSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                capturedPhotos[step.id]
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {capturedPhotos[step.id] ? <Check className="w-4 h-4" /> : step.icon}
            </button>
          ))}
        </div>

        {/* Current step */}
        {currentStepData && (
          <div className="p-4 border rounded-lg space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>

            {/* Preview or capture button */}
            {isCurrentCaptured ? (
              <div className="relative">
                <img
                  src={capturedPhotos[currentStepData.id]}
                  alt={currentStepData.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Badge className="absolute top-2 right-2 bg-green-500">
                  <Check className="w-3 h-3 mr-1" />
                  Taget
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={handleCapture}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Tag igen
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Tryk for at tage billede</p>
                  </div>
                </div>
                <Button onClick={handleCapture} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Tag billede
                </Button>
              </div>
            )}

            {/* Tips */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium mb-2">Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {currentStepData.tips.map((tip, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Tilbage
          </Button>
          {currentStep < allSteps.length - 1 ? (
            <Button onClick={handleNext} disabled={!isCurrentCaptured}>
              Næste
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={onComplete} disabled={!allCaptured}>
              <Check className="w-4 h-4 mr-1" />
              Fuldfør
            </Button>
          )}
        </div>

        {/* Chain check reminder for long rentals */}
        {requireChainCheck && currentStepData?.id === 'chain' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
            <div className="flex items-start gap-2">
              <Link2 className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Kædetjek påkrævet
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Ved længere lejeperioder bedes du verificere at kæden er smurt og korrekt spændt.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCCheckInGuide;
