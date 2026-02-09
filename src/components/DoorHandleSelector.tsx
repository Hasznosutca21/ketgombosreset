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

// Tesla Model 3 top-down silhouette SVG
const CarSilhouette = () => (
  <svg
    viewBox="0 0 200 320"
    className="w-full h-auto max-w-[280px] mx-auto"
    fill="currentColor"
  >
    {/* Car body silhouette - top-down view */}
    <path
      d="M100 10
         C70 10 55 20 50 35
         L45 60
         C40 65 35 70 32 85
         L30 120
         L28 160
         L28 200
         L30 240
         L35 270
         C40 285 50 295 55 300
         C70 310 130 310 145 300
         C150 295 160 285 165 270
         L170 240
         L172 200
         L172 160
         L170 120
         L168 85
         C165 70 160 65 155 60
         L150 35
         C145 20 130 10 100 10
         Z"
      className="fill-muted-foreground/20"
    />
    {/* Roof/glass area */}
    <path
      d="M100 45
         C80 45 70 50 65 60
         L60 90
         L58 130
         L58 180
         L60 220
         L65 250
         C70 260 80 265 100 265
         C120 265 130 260 135 250
         L140 220
         L142 180
         L142 130
         L140 90
         L135 60
         C130 50 120 45 100 45
         Z"
      className="fill-muted-foreground/10"
    />
    {/* Front windshield */}
    <path
      d="M100 55
         C85 55 75 58 70 65
         L65 95
         L135 95
         L130 65
         C125 58 115 55 100 55
         Z"
      className="fill-foreground/20"
    />
    {/* Rear windshield */}
    <path
      d="M65 235
         L70 255
         C75 260 85 262 100 262
         C115 262 125 260 130 255
         L135 235
         Z"
      className="fill-foreground/20"
    />
    {/* Side mirrors */}
    <ellipse cx="25" cy="95" rx="8" ry="5" className="fill-muted-foreground/30" />
    <ellipse cx="175" cy="95" rx="8" ry="5" className="fill-muted-foreground/30" />
    {/* Door handle indicators - small lines */}
    <rect x="28" y="118" width="6" height="2" rx="1" className="fill-muted-foreground/40" />
    <rect x="28" y="178" width="6" height="2" rx="1" className="fill-muted-foreground/40" />
    <rect x="166" y="118" width="6" height="2" rx="1" className="fill-muted-foreground/40" />
    <rect x="166" y="178" width="6" height="2" rx="1" className="fill-muted-foreground/40" />
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
