import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

// Import Model 3 chrome image for visualization
import model3ChromeImage from "@/assets/vehicles/model-3-chrome.png";

interface DoorHandleSelectorProps {
  value: string[];
  onChange: (handles: string[]) => void;
}

const HANDLE_POSITIONS = [
  { id: "front-left", label: "Bal első", labelEn: "Front Left", x: 18, y: 42 },
  { id: "rear-left", label: "Bal hátsó", labelEn: "Rear Left", x: 35, y: 42 },
  { id: "front-right", label: "Jobb első", labelEn: "Front Right", x: 18, y: 58 },
  { id: "rear-right", label: "Jobb hátsó", labelEn: "Rear Right", x: 35, y: 58 },
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
      {/* Visual Car Diagram */}
      <div className="relative bg-muted/30 rounded-xl p-6 overflow-hidden">
        {/* Top-down car silhouette */}
        <div className="relative mx-auto" style={{ maxWidth: "320px" }}>
          {/* Car outline - top-down view */}
          <svg
            viewBox="0 0 100 60"
            className="w-full h-auto"
            style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
          >
            {/* Car body */}
            <path
              d="M15 20 Q10 20 10 25 L10 35 Q10 40 15 40 L85 40 Q90 40 90 35 L90 25 Q90 20 85 20 L65 20 L60 12 Q58 10 50 10 Q42 10 40 12 L35 20 Z"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            {/* Windshield */}
            <path
              d="M38 20 L42 14 Q44 12 50 12 Q56 12 58 14 L62 20"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="0.5"
              opacity="0.5"
            />
            {/* Rear window */}
            <path
              d="M72 22 L78 22 Q80 22 80 24 L80 36 Q80 38 78 38 L72 38"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="0.5"
              opacity="0.5"
            />
            {/* Left side windows */}
            <rect x="25" y="16" width="8" height="4" rx="1" fill="hsl(var(--foreground))" opacity="0.2" />
            <rect x="36" y="16" width="8" height="4" rx="1" fill="hsl(var(--foreground))" opacity="0.2" />
            {/* Right side windows */}
            <rect x="25" y="40" width="8" height="4" rx="1" fill="hsl(var(--foreground))" opacity="0.2" />
            <rect x="36" y="40" width="8" height="4" rx="1" fill="hsl(var(--foreground))" opacity="0.2" />
            
            {/* Door handles - interactive */}
            {HANDLE_POSITIONS.map((handle) => {
              const isSelected = value.includes(handle.id);
              return (
                <g
                  key={handle.id}
                  onClick={() => toggleHandle(handle.id)}
                  style={{ cursor: "pointer" }}
                  className="transition-transform hover:scale-110"
                >
                  {/* Handle marker */}
                  <circle
                    cx={handle.x}
                    cy={handle.y}
                    r="4"
                    fill={isSelected ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                    stroke={isSelected ? "hsl(var(--destructive))" : "hsl(var(--border))"}
                    strokeWidth="1"
                    className="transition-colors"
                  />
                  {isSelected && (
                    <circle
                      cx={handle.x}
                      cy={handle.y}
                      r="6"
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Labels */}
          <div className="absolute top-0 left-0 text-xs text-muted-foreground font-medium">
            {isHu ? "Bal oldal" : "Left side"}
          </div>
          <div className="absolute bottom-0 left-0 text-xs text-muted-foreground font-medium">
            {isHu ? "Jobb oldal" : "Right side"}
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 left-0 text-xs text-muted-foreground">
            ←{isHu ? " Elöl" : " Front"}
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-0 text-xs text-muted-foreground">
            {isHu ? "Hátul " : "Rear "}→
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">{isHu ? "Ép" : "OK"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{isHu ? "Sérült" : "Damaged"}</span>
          </div>
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
