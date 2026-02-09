import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

// Import Model 3 top-down outline image
import model3Outline from "@/assets/vehicles/model-3-topdown-outline.png";

interface DoorHandleSelectorProps {
  value: string[];
  onChange: (handles: string[]) => void;
}

// Handle positions as percentages on the image - adjust to match door handle locations
const HANDLE_POSITIONS = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left", x: 12, y: 38 },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left", x: 12, y: 55 },
  { id: "front-right", label: "Jobb első", labelEn: "Front Right", x: 88, y: 38 },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right", x: 88, y: 55 },
];

const PRICE_PER_HANDLE = 25000;
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
      {/* Visual Car Image */}
      <div className="relative py-4 rounded-xl bg-muted/30">
        <img 
          src={model3Outline} 
          alt="Tesla Model 3 Top View" 
          className="w-full h-auto max-w-[320px] mx-auto"
        />
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
