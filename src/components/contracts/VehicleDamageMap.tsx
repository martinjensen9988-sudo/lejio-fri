interface DamageMarker {
  id: string;
  position: string;
  damage_type: string;
  severity: string;
  description?: string | null;
}

interface VehicleDamageMapProps {
  title: string;
  damages: DamageMarker[];
  className?: string;
}

// Map positions to SVG coordinates (percentages)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  'front-left': { x: 22, y: 15 },
  'front-center': { x: 50, y: 10 },
  'front-right': { x: 78, y: 15 },
  'left-side': { x: 12, y: 50 },
  'right-side': { x: 88, y: 50 },
  'rear-left': { x: 22, y: 85 },
  'rear-center': { x: 50, y: 90 },
  'rear-right': { x: 78, y: 85 },
  'roof': { x: 50, y: 50 },
  'interior-front': { x: 50, y: 38 },
  'interior-rear': { x: 50, y: 62 },
  'trunk': { x: 50, y: 78 },
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: '#facc15',
  moderate: '#f97316',
  severe: '#ef4444',
};

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  scratch: 'R',
  dent: 'B',
  crack: 'C',
  stain: 'P',
  tear: 'F',
  missing: 'M',
  broken: 'Ø',
  other: 'X',
};

const POSITION_LABELS: Record<string, string> = {
  'front-left': 'Forfra V',
  'front-center': 'Forfra',
  'front-right': 'Forfra H',
  'left-side': 'Venstre',
  'right-side': 'Højre',
  'rear-left': 'Bagfra V',
  'rear-center': 'Bagfra',
  'rear-right': 'Bagfra H',
  'roof': 'Tag',
  'interior-front': 'Kabine F',
  'interior-rear': 'Kabine B',
  'trunk': 'Bagagerum',
};

const DAMAGE_TYPE_FULL_LABELS: Record<string, string> = {
  scratch: 'Ridse',
  dent: 'Bule',
  crack: 'Revne',
  stain: 'Plet',
  tear: 'Flænge',
  missing: 'Mangler',
  broken: 'Ødelagt',
  other: 'Andet',
};

export const VehicleDamageMap = ({ title, damages, className = '' }: VehicleDamageMapProps) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">{title}</h4>
      
      <div className="flex-1 flex flex-col items-center">
        {/* Car SVG - Top-down view */}
        <div className="relative w-[180px] h-[240px]">
          <svg viewBox="0 0 100 130" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <rect x="0" y="0" width="100" height="130" fill="#fafafa" rx="4" />
            
            {/* Car body outline */}
            <g fill="none" stroke="#9ca3af" strokeWidth="1.2">
              {/* Main body */}
              <path d="M 25,20 
                       C 25,12 38,8 50,8 
                       C 62,8 75,12 75,20 
                       L 78,32 
                       L 78,95 
                       C 78,102 74,108 70,112 
                       C 62,116 38,116 30,112 
                       C 26,108 22,102 22,95 
                       L 22,32 
                       Z" 
                    fill="#f8fafc" />
              
              {/* Windshield */}
              <path d="M 30,22 L 50,17 L 70,22 L 67,34 L 33,34 Z" fill="#e2e8f0" stroke="#94a3b8" />
              
              {/* Rear window */}
              <path d="M 33,92 L 67,92 L 70,103 L 50,108 L 30,103 Z" fill="#e2e8f0" stroke="#94a3b8" />
              
              {/* Left front wheel */}
              <ellipse cx="22" cy="30" rx="5" ry="10" fill="#374151" stroke="#1f2937" />
              
              {/* Right front wheel */}
              <ellipse cx="78" cy="30" rx="5" ry="10" fill="#374151" stroke="#1f2937" />
              
              {/* Left rear wheel */}
              <ellipse cx="22" cy="90" rx="5" ry="10" fill="#374151" stroke="#1f2937" />
              
              {/* Right rear wheel */}
              <ellipse cx="78" cy="90" rx="5" ry="10" fill="#374151" stroke="#1f2937" />
              
              {/* Side mirrors */}
              <ellipse cx="18" cy="38" rx="4" ry="2.5" fill="#6b7280" stroke="#4b5563" />
              <ellipse cx="82" cy="38" rx="4" ry="2.5" fill="#6b7280" stroke="#4b5563" />
              
              {/* Hood line */}
              <line x1="35" y1="34" x2="65" y2="34" stroke="#cbd5e1" />
              
              {/* Trunk line */}
              <line x1="35" y1="92" x2="65" y2="92" stroke="#cbd5e1" />
              
              {/* Center console line */}
              <line x1="50" y1="40" x2="50" y2="86" strokeDasharray="2,2" strokeWidth="0.5" stroke="#d1d5db" />
              
              {/* Front seats */}
              <rect x="35" y="42" width="12" height="16" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.6" />
              <rect x="53" y="42" width="12" height="16" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.6" />
              
              {/* Rear seats */}
              <rect x="33" y="66" width="34" height="14" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.6" />
            </g>
            
            {/* Damage markers */}
            {damages.map((damage, index) => {
              const coords = POSITION_COORDS[damage.position];
              if (!coords) return null;
              
              const color = SEVERITY_COLORS[damage.severity] || SEVERITY_COLORS.moderate;
              const label = DAMAGE_TYPE_LABELS[damage.damage_type] || 'X';
              
              return (
                <g key={damage.id || index}>
                  <circle
                    cx={coords.x}
                    cy={coords.y * 1.3}
                    r="7"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="drop-shadow-md"
                  />
                  <text
                    x={coords.x}
                    y={coords.y * 1.3 + 3.5}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Damage count badge */}
          {damages.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
              {damages.length}
            </div>
          )}
        </div>
        
        {/* Damage list */}
        <div className="mt-4 w-full">
          {damages.length > 0 ? (
            <div className="space-y-1.5">
              {damages.slice(0, 4).map((damage, index) => (
                <div key={damage.id || index} className="flex items-center gap-2 text-xs bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                  <span 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0"
                    style={{ backgroundColor: SEVERITY_COLORS[damage.severity] || SEVERITY_COLORS.moderate }}
                  >
                    {DAMAGE_TYPE_LABELS[damage.damage_type] || 'X'}
                  </span>
                  <span className="text-gray-600 truncate">
                    {POSITION_LABELS[damage.position] || damage.position}: {DAMAGE_TYPE_FULL_LABELS[damage.damage_type] || damage.damage_type}
                  </span>
                </div>
              ))}
              {damages.length > 4 && (
                <p className="text-xs text-gray-400 text-center">+{damages.length - 4} flere skader</p>
              )}
            </div>
          ) : (
            <div className="text-center py-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-medium">✓ Ingen skader registreret</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDamageMap;
