import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

// Import Model 3 top-down image
import model3TopDown from "@/assets/vehicles/model-3-topdown.jpg";

interface DoorHandleSelectorProps {
  value: string[];
  onChange: (handles: string[]) => void;
}

// Handle positions as percentages on the top-down image
// Adjust these values to precisely match door handle locations
const HANDLE_POSITIONS = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left", x: 22, y: 32 },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left", x: 22, y: 52 },
  { id: "front-right", label: "Jobb első", labelEn: "Front Right", x: 78, y: 32 },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right", x: 78, y: 52 },
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
      {/* Visual Car Image - Top Down View */}
      <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a]">
        <img
          src={model3TopDown}
          alt="Tesla Model 3 Top Down View"
          className="w-full h-auto"
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
                  "w-7 h-7 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                  isSelected
                    ? "bg-destructive border-destructive scale-110"
                    : "bg-background/90 border-foreground/30 hover:border-foreground hover:scale-110"
                )}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white" />
                )}
              </div>
              {/* Pulse animation for selected */}
              {isSelected && (
                <div className="absolute inset-0 w-7 h-7 md:w-9 md:h-9 rounded-full border-2 border-destructive animate-ping opacity-50" />
              )}
            </button>
          );
        })}

        {/* Side labels */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-white/70 font-medium writing-mode-vertical">
          {isHu ? "Bal" : "Left"}
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-white/70 font-medium">
          {isHu ? "Jobb" : "Right"}
        </div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-white/70 font-medium">
          {isHu ? "Elöl" : "Front"}
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/70 font-medium">
          {isHu ? "Hátul" : "Rear"}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-foreground/30 bg-background/90" />
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
