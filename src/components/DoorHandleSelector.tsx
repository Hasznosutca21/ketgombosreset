import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface DoorHandleSelectorProps {
  value: string[];
  onChange: (handles: string[]) => void;
}

// Handle positions as percentages on the silhouette
const HANDLE_POSITIONS = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left", x: 18, y: 38 },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left", x: 18, y: 58 },
  { id: "front-right", label: "Jobb első", labelEn: "Front Right", x: 82, y: 38 },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right", x: 82, y: 58 },
];

const PRICE_PER_HANDLE = 25000;

// Tesla Model 3 top-down silhouette SVG - accurate Model 3 shape
const CarSilhouette = () => (
  <svg
    viewBox="0 0 120 280"
    className="w-full h-auto max-w-[200px] mx-auto"
    fill="currentColor"
  >
    {/* Model 3 body - distinctive teardrop/aerodynamic shape */}
    <path
      d="M60 8
         C45 8 35 12 28 22
         L22 45
         L18 70
         L15 100
         L14 130
         L14 170
         L15 200
         L18 225
         L24 248
         C30 262 42 270 60 272
         C78 270 90 262 96 248
         L102 225
         L105 200
         L106 170
         L106 130
         L105 100
         L102 70
         L98 45
         L92 22
         C85 12 75 8 60 8
         Z"
      className="fill-muted-foreground/15 stroke-muted-foreground/40"
      strokeWidth="1.5"
    />
    
    {/* Glass roof area - Model 3's signature glass roof */}
    <path
      d="M60 35
         C48 35 40 40 36 50
         L32 75
         L30 110
         L30 160
         L32 195
         L36 220
         C40 230 48 235 60 235
         C72 235 80 230 84 220
         L88 195
         L90 160
         L90 110
         L88 75
         L84 50
         C80 40 72 35 60 35
         Z"
      className="fill-muted-foreground/8"
    />
    
    {/* Front windshield - Model 3 shape */}
    <path
      d="M60 42
         C50 42 43 45 39 52
         L35 72
         L85 72
         L81 52
         C77 45 70 42 60 42
         Z"
      className="fill-foreground/15"
    />
    
    {/* Rear glass */}
    <path
      d="M36 205
         L39 222
         C43 228 50 230 60 230
         C70 230 77 228 81 222
         L84 205
         Z"
      className="fill-foreground/15"
    />
    
    {/* Side mirrors - Model 3 style */}
    <ellipse cx="10" cy="78" rx="6" ry="4" className="fill-muted-foreground/25" />
    <ellipse cx="110" cy="78" rx="6" ry="4" className="fill-muted-foreground/25" />
    
    {/* Chrome door handles - the ones that peel */}
    <rect x="13" y="105" width="5" height="1.5" rx="0.75" className="fill-muted-foreground/50" />
    <rect x="13" y="155" width="5" height="1.5" rx="0.75" className="fill-muted-foreground/50" />
    <rect x="102" y="105" width="5" height="1.5" rx="0.75" className="fill-muted-foreground/50" />
    <rect x="102" y="155" width="5" height="1.5" rx="0.75" className="fill-muted-foreground/50" />
    
    {/* Front Tesla emblem hint */}
    <circle cx="60" cy="18" r="2" className="fill-muted-foreground/30" />
    
    {/* Charge port (left side) */}
    <rect x="12" y="85" width="3" height="6" rx="1" className="fill-muted-foreground/20" />
  </svg>
);

const DoorHandleSelector = ({ value, onChange }: DoorHandleSelectorProps) => {
  const { language } = useLanguage();
  const isHu = language === "hu";

  const toggleHandle = (handleId: string) => {
    if (value.includes(handleId)) {
      onChange(value.filter((h) => h !== handleId));
    } else {
      onChange([...value, handleId]);
    }
  };

  const totalPrice = value.length * PRICE_PER_HANDLE;
  const formattedPrice = new Intl.NumberFormat("hu-HU").format(totalPrice);

  return (
    <div className="space-y-6">
      {/* Visual Car Silhouette */}
      <div className="relative py-6 px-4 rounded-xl bg-muted/30">
        <CarSilhouette />
        
        {/* Door handle markers */}
        {HANDLE_POSITIONS.map((handle) => {
          const isSelected = value.includes(handle.id);
          return (
            <button
              key={handle.id}
              type="button"
              onClick={() => toggleHandle(handle.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${handle.x}%`, top: `${handle.y}%` }}
            >
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-destructive border-destructive scale-110"
                    : "bg-background border-muted-foreground/50 hover:border-foreground hover:scale-110"
                )}
              >
                {isSelected && (
                  <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-white" />
                )}
              </div>
              {/* Pulse animation for selected */}
              {isSelected && (
                <div className="absolute inset-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-destructive animate-ping opacity-50" />
              )}
            </button>
          );
        })}

        {/* Side labels */}
        <div className="absolute top-1/2 left-1 -translate-y-1/2 text-xs text-muted-foreground font-medium">
          {isHu ? "Bal" : "L"}
        </div>
        <div className="absolute top-1/2 right-1 -translate-y-1/2 text-xs text-muted-foreground font-medium">
          {isHu ? "Jobb" : "R"}
        </div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
          ↑ {isHu ? "Elöl" : "Front"}
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
          {isHu ? "Hátul" : "Rear"} ↓
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50 bg-background" />
          <span className="text-muted-foreground">{isHu ? "Ép" : "OK"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="text-muted-foreground">{isHu ? "Sérült" : "Damaged"}</span>
        </div>
      </div>

      {/* Handle selection buttons */}
      <div className="grid grid-cols-2 gap-3">
        {HANDLE_POSITIONS.map((handle) => {
          const isSelected = value.includes(handle.id);
          return (
            <button
              key={handle.id}
              type="button"
              onClick={() => toggleHandle(handle.id)}
              className={cn(
                "relative p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-destructive bg-destructive/10"
                  : "border-border bg-card hover:border-foreground/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">
                    {isHu ? handle.label : handle.labelEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    25 000 Ft
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Price summary */}
      {value.length > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground">
                {isHu ? "Kiválasztva:" : "Selected:"}
              </span>
              <span className="ml-2 font-medium">
                {value.length} {isHu ? "db kilincs" : "handle(s)"}
              </span>
            </div>
            <div className="text-lg font-semibold">
              {formattedPrice} Ft
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoorHandleSelector;
