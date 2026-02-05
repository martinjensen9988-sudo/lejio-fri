import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadComponentProps {
  onSave: (signature: string) => void;
  disabled?: boolean;
}

const SignaturePadComponent = ({ onSave, disabled }: SignaturePadComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get the actual display size
    const rect = container.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = 160; // Fixed height

    // Get device pixel ratio for retina displays
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Set canvas size in CSS pixels
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Set canvas buffer size for retina
    canvas.width = displayWidth * ratio;
    canvas.height = displayHeight * ratio;

    // Scale context for retina
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    // Clear and reinitialize if signature pad exists
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize signature pad with Safari-friendly options
    signaturePadRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16, // Improve touch responsiveness on Safari
      velocityFilterWeight: 0.7,
    });

    signaturePadRef.current.addEventListener('endStroke', () => {
      setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
    });

    // Initial resize
    resizeCanvas();

    // Handle window resize
    const handleResize = () => {
      // Debounce resize for better performance
      setTimeout(resizeCanvas, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      signaturePadRef.current?.off();
    };
  }, [resizeCanvas]);

  const handleClear = () => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef}
        className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white"
        style={{ 
          touchAction: 'none', // Prevent scrolling while drawing on Safari
          WebkitTouchCallout: 'none', // Disable callout on iOS
          WebkitUserSelect: 'none', // Disable selection on iOS
          userSelect: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          className="touch-none block"
          style={{ 
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className="flex-1"
        >
          <Eraser className="w-4 h-4 mr-1" />
          Ryd
        </Button>
        <Button
          type="button"
          variant="warm"
          size="sm"
          onClick={handleSave}
          disabled={disabled || isEmpty}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-1" />
          Bekræft signatur
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Tegn din underskrift med musen eller fingeren
      </p>
    </div>
  );
};

export default SignaturePadComponent;
