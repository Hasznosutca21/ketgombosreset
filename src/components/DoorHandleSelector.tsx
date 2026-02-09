import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

// Import Model 3 side images
import model3LeftSide from "@/assets/vehicles/model-3-left-side.jpg";
import model3RightSide from "@/assets/vehicles/model-3-right-side.jpg";

interface DoorHandleSelectorProps {
  value: string[];
  onChange: (handles: string[]) => void;
}

// Handle positions as percentages on the images
const LEFT_SIDE_HANDLES = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left", x: 75, y: 42 },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left", x: 42, y: 42 },
];

const RIGHT_SIDE_HANDLES = [
  { id: "front-right", label: "Jobb első", labelEn: "Front Right", x: 25, y: 42 },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right", x: 58, y: 42 },
];

const ALL_HANDLES = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left" },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left" },
  { id: "front-right", label: "Jobb első", labelEn: "Front Right" },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right" },
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

  const renderMarker = (handle: { id: string; x: number; y: number }, isSelected: boolean) => (
    <button
      key={handle.id}
      type="button"
      onClick={() => toggleHandle(handle.id)}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${handle.x}%`, top: `${handle.y}%` }}
    >
      <div
        className={cn(
          "w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isSelected
            ? "bg-destructive border-destructive scale-110"
            : "bg-background/80 border-muted-foreground/50 hover:border-foreground hover:scale-110"
        )}
      >
        {isSelected && (
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white" />
        )}
      </div>
      {/* Pulse animation for selected */}
      {isSelected && (
        <div className="absolute inset-0 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-destructive animate-ping opacity-50" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Visual Car Images */}
      <div className="space-y-4">
        {/* Left side view */}
        <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a]">
          <p className="absolute top-2 left-3 text-xs text-white/70 font-medium z-10">
            {isHu ? "Bal oldal" : "Left side"}
          </p>
          <img
            src={model3LeftSide}
            alt="Tesla Model 3 Left Side"
            className="w-full h-auto"
          />
          {LEFT_SIDE_HANDLES.map((handle) =>
            renderMarker(handle, value.includes(handle.id))
          )}
        </div>

        {/* Right side view */}
        <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a]">
          <p className="absolute top-2 left-3 text-xs text-white/70 font-medium z-10">
            {isHu ? "Jobb oldal" : "Right side"}
          </p>
          <img
            src={model3RightSide}
            alt="Tesla Model 3 Right Side"
            className="w-full h-auto"
          />
          {RIGHT_SIDE_HANDLES.map((handle) =>
            renderMarker(handle, value.includes(handle.id))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50 bg-background/80" />
          <span className="text-muted-foreground">{isHu ? "Ép" : "OK"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <span className="text-muted-foreground">{isHu ? "Sérült" : "Damaged"}</span>
        </div>
      </div>

      {/* Handle selection buttons */}
      <div className="grid grid-cols-2 gap-3">
        {ALL_HANDLES.map((handle) => {
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
