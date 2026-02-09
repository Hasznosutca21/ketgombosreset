import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export interface TeslaColor {
  id: string;
  name: { en: string; hu: string };
  hex: string;
  metallic?: boolean;
}

export const TESLA_COLORS: TeslaColor[] = [
  { id: "pearl-white", name: { en: "Pearl White Multi-Coat", hu: "Gyöngyház fehér" }, hex: "#F2F2F2", metallic: true },
  { id: "solid-black", name: { en: "Solid Black", hu: "Fekete" }, hex: "#1C1C1C" },
  { id: "midnight-silver", name: { en: "Midnight Silver Metallic", hu: "Éjezüst" }, hex: "#4D5156", metallic: true },
  { id: "quicksilver", name: { en: "Quicksilver", hu: "Ezüst" }, hex: "#8C8F93", metallic: true },
  { id: "ultra-red", name: { en: "Ultra Red", hu: "Ultra piros" }, hex: "#A61F2B", metallic: true },
  { id: "deep-blue", name: { en: "Deep Blue Metallic", hu: "Mélykék" }, hex: "#1E3A5F", metallic: true },
  { id: "midnight-cherry", name: { en: "Midnight Cherry Red", hu: "Éjcseresznye" }, hex: "#3D0F14", metallic: true },
];

interface VehicleColorSelectorProps {
  value: string | null;
  onChange: (colorId: string) => void;
  compact?: boolean;
}

const VehicleColorSelector = ({ value, onChange, compact = false }: VehicleColorSelectorProps) => {
  const { language } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {TESLA_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => onChange(color.id)}
            className={cn(
              "relative w-7 h-7 rounded-full border-2 transition-all",
              value === color.id 
                ? "border-primary ring-2 ring-primary/30" 
                : "border-border hover:border-muted-foreground"
            )}
            style={{ backgroundColor: color.hex }}
            title={color.name[language]}
          >
            {value === color.id && (
              <Check 
                className={cn(
                  "absolute inset-0 m-auto h-4 w-4",
                  color.hex === "#F2F2F2" || color.hex === "#8C8F93" 
                    ? "text-foreground" 
                    : "text-white"
                )}
              />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
      {TESLA_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          onClick={() => onChange(color.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
            value === color.id 
              ? "bg-primary/10 ring-2 ring-primary" 
              : "hover:bg-muted"
          )}
        >
          <div
            className={cn(
              "relative w-10 h-10 rounded-full border-2",
              value === color.id ? "border-primary" : "border-border",
              color.metallic && "shadow-lg"
            )}
            style={{ 
              backgroundColor: color.hex,
              background: color.metallic 
                ? `linear-gradient(135deg, ${color.hex} 0%, ${adjustBrightness(color.hex, 30)} 50%, ${color.hex} 100%)`
                : color.hex
            }}
          >
            {value === color.id && (
              <Check 
                className={cn(
                  "absolute inset-0 m-auto h-5 w-5",
                  color.hex === "#F2F2F2" || color.hex === "#8C8F93" 
                    ? "text-foreground" 
                    : "text-white"
                )}
              />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground text-center leading-tight">
            {color.name[language]}
          </span>
        </button>
      ))}
    </div>
  );
};

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export default VehicleColorSelector;
