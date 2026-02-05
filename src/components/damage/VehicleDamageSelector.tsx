import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DamageMarker {
  id: string;
  position: string;
  severity: string;
  damage_type: string;
}

interface VehicleDamageSelectorProps {
  selectedPosition: string;
  onSelectPosition: (position: string) => void;
  existingDamages?: DamageMarker[];
  className?: string;
}

const POSITION_LABELS: Record<string, string> = {
  'front-left': 'Forfra venstre',
  'front-center': 'Forfra midt',
  'front-right': 'Forfra højre',
  'left-side': 'Venstre side',
  'right-side': 'Højre side',
  'rear-left': 'Bagfra venstre',
  'rear-center': 'Bagfra midt',
  'rear-right': 'Bagfra højre',
  'roof': 'Tag',
  'interior-front': 'Kabine foran',
  'interior-rear': 'Kabine bag',
  'trunk': 'Bagagerum',
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: '#EAB308',
  moderate: '#F97316',
  severe: '#EF4444',
};

export const VehicleDamageSelector = ({
  selectedPosition,
  onSelectPosition,
  existingDamages = [],
  className,
}: VehicleDamageSelectorProps) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const getDamagesForPosition = (position: string) => {
    return existingDamages.filter(d => d.position === position);
  };

  const getZoneColor = (position: string) => {
    const damages = getDamagesForPosition(position);
    if (damages.length === 0) {
      if (selectedPosition === position) return 'fill-primary/40 stroke-primary';
      if (hoveredZone === position) return 'fill-primary/20 stroke-primary/60';
      return 'fill-muted/30 stroke-border hover:fill-primary/10';
    }
    
    // Get worst severity
    const hasSevere = damages.some(d => d.severity === 'severe');
    const hasModerate = damages.some(d => d.severity === 'moderate');
    
    if (hasSevere) return 'fill-red-200 stroke-red-500';
    if (hasModerate) return 'fill-orange-200 stroke-orange-500';
    return 'fill-yellow-200 stroke-yellow-500';
  };

  const ZoneButton = ({ 
    position, 
    d, 
    transform 
  }: { 
    position: string; 
    d: string; 
    transform?: string;
  }) => {
    const damages = getDamagesForPosition(position);
    
    return (
      <g 
        className="cursor-pointer transition-all duration-200"
        onClick={() => onSelectPosition(position)}
        onMouseEnter={() => setHoveredZone(position)}
        onMouseLeave={() => setHoveredZone(null)}
      >
        <path
          d={d}
          transform={transform}
          className={cn(
            'transition-all duration-200 stroke-2',
            getZoneColor(position)
          )}
        />
        {damages.length > 0 && (
          <g transform={transform}>
            <circle
              cx="50%"
              cy="50%"
              r="8"
              className="fill-destructive"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-white text-xs font-bold"
              fontSize="10"
            >
              {damages.length}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-sm text-muted-foreground text-center">
        Klik på et område af bilen for at registrere skade
      </div>
      
      <div className="relative bg-gradient-to-b from-muted/30 to-muted/10 rounded-xl p-4 border border-border">
        {/* Car SVG - Top-down view */}
        <svg
          viewBox="0 0 200 400"
          className="w-full max-w-[250px] mx-auto h-auto"
          style={{ maxHeight: '350px' }}
        >
          {/* Car body outline */}
          <defs>
            <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.5" />
              <stop offset="50%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Main car body shadow */}
          <path
            d="M40 60 Q30 70 30 90 L30 310 Q30 330 40 340 L160 340 Q170 330 170 310 L170 90 Q170 70 160 60 Z"
            className="fill-muted/20 stroke-none"
            transform="translate(2, 2)"
          />

          {/* Front Left - Forfra venstre */}
          <path
            d="M40 60 Q30 70 30 90 L30 120 L100 120 L100 60 Q80 50 60 55 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('front-left')
            )}
            onClick={() => onSelectPosition('front-left')}
            onMouseEnter={() => setHoveredZone('front-left')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Front Right - Forfra højre */}
          <path
            d="M160 60 Q170 70 170 90 L170 120 L100 120 L100 60 Q120 50 140 55 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('front-right')
            )}
            onClick={() => onSelectPosition('front-right')}
            onMouseEnter={() => setHoveredZone('front-right')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Front Center (hood/bonnet) - Forfra midt */}
          <path
            d="M50 55 Q80 45 100 45 Q120 45 150 55 L150 60 Q120 50 100 50 Q80 50 50 60 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('front-center')
            )}
            onClick={() => onSelectPosition('front-center')}
            onMouseEnter={() => setHoveredZone('front-center')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Left Side - Venstre side */}
          <path
            d="M30 120 L30 280 L45 280 L45 120 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('left-side')
            )}
            onClick={() => onSelectPosition('left-side')}
            onMouseEnter={() => setHoveredZone('left-side')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Right Side - Højre side */}
          <path
            d="M170 120 L170 280 L155 280 L155 120 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('right-side')
            )}
            onClick={() => onSelectPosition('right-side')}
            onMouseEnter={() => setHoveredZone('right-side')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Interior Front - Kabine foran */}
          <path
            d="M45 120 L155 120 L155 180 L45 180 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('interior-front')
            )}
            onClick={() => onSelectPosition('interior-front')}
            onMouseEnter={() => setHoveredZone('interior-front')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Roof - Tag */}
          <path
            d="M45 180 L155 180 L155 240 L45 240 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('roof')
            )}
            onClick={() => onSelectPosition('roof')}
            onMouseEnter={() => setHoveredZone('roof')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Interior Rear - Kabine bag */}
          <path
            d="M45 240 L155 240 L155 280 L45 280 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('interior-rear')
            )}
            onClick={() => onSelectPosition('interior-rear')}
            onMouseEnter={() => setHoveredZone('interior-rear')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Rear Left - Bagfra venstre */}
          <path
            d="M30 280 L100 280 L100 340 Q80 350 60 345 L40 340 Q30 330 30 310 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('rear-left')
            )}
            onClick={() => onSelectPosition('rear-left')}
            onMouseEnter={() => setHoveredZone('rear-left')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Rear Right - Bagfra højre */}
          <path
            d="M170 280 L100 280 L100 340 Q120 350 140 345 L160 340 Q170 330 170 310 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('rear-right')
            )}
            onClick={() => onSelectPosition('rear-right')}
            onMouseEnter={() => setHoveredZone('rear-right')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Rear Center (trunk) - Bagagerum */}
          <path
            d="M60 345 Q80 355 100 355 Q120 355 140 345 L140 340 Q120 350 100 350 Q80 350 60 340 Z"
            className={cn(
              'transition-all duration-200 stroke-2 cursor-pointer',
              getZoneColor('trunk')
            )}
            onClick={() => onSelectPosition('trunk')}
            onMouseEnter={() => setHoveredZone('trunk')}
            onMouseLeave={() => setHoveredZone(null)}
          />

          {/* Wheels */}
          <ellipse cx="35" cy="100" rx="12" ry="20" className="fill-foreground/20 stroke-foreground/40 stroke-1" />
          <ellipse cx="165" cy="100" rx="12" ry="20" className="fill-foreground/20 stroke-foreground/40 stroke-1" />
          <ellipse cx="35" cy="300" rx="12" ry="20" className="fill-foreground/20 stroke-foreground/40 stroke-1" />
          <ellipse cx="165" cy="300" rx="12" ry="20" className="fill-foreground/20 stroke-foreground/40 stroke-1" />

          {/* Damage count indicators */}
          {Object.keys(POSITION_LABELS).map(position => {
            const damages = getDamagesForPosition(position);
            if (damages.length === 0) return null;
            
            // Position the indicator based on zone
            const indicatorPositions: Record<string, { x: number; y: number }> = {
              'front-left': { x: 65, y: 90 },
              'front-right': { x: 135, y: 90 },
              'front-center': { x: 100, y: 52 },
              'left-side': { x: 37, y: 200 },
              'right-side': { x: 163, y: 200 },
              'interior-front': { x: 100, y: 150 },
              'roof': { x: 100, y: 210 },
              'interior-rear': { x: 100, y: 260 },
              'rear-left': { x: 65, y: 310 },
              'rear-right': { x: 135, y: 310 },
              'trunk': { x: 100, y: 348 },
            };
            
            const pos = indicatorPositions[position];
            if (!pos) return null;
            
            const worstSeverity = damages.some(d => d.severity === 'severe') 
              ? 'severe' 
              : damages.some(d => d.severity === 'moderate') 
                ? 'moderate' 
                : 'minor';
            
            return (
              <g key={position}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  fill={SEVERITY_COLORS[worstSeverity]}
                  className="drop-shadow-md"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-white font-bold pointer-events-none"
                  fontSize="11"
                >
                  {damages.length}
                </text>
              </g>
            );
          })}

          {/* Labels */}
          <text x="100" y="25" textAnchor="middle" className="fill-muted-foreground text-xs">FRONT</text>
          <text x="100" y="385" textAnchor="middle" className="fill-muted-foreground text-xs">BAG</text>
        </svg>

        {/* Selected/Hovered zone indicator */}
        {(selectedPosition || hoveredZone) && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border shadow-sm">
            <span className="text-sm font-medium">
              {POSITION_LABELS[selectedPosition || hoveredZone || ''] || 'Vælg position'}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      {existingDamages.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
            Mindre
          </Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-500 mr-1.5" />
            Moderat
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
            Alvorlig
          </Badge>
        </div>
      )}
    </div>
  );
};

export default VehicleDamageSelector;
