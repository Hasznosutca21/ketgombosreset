import { useLanguage } from "@/hooks/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TeslaColor {
  id: string;
  name: { en: string; hu: string };
  hex: string;
}

export const TESLA_COLORS: TeslaColor[] = [
  { id: "pearl-white", name: { en: "Pearl White Multi-Coat", hu: "Gyöngyház fehér" }, hex: "#F2F2F2" },
  { id: "solid-black", name: { en: "Solid Black", hu: "Fekete" }, hex: "#1C1C1C" },
  { id: "midnight-silver", name: { en: "Midnight Silver Metallic", hu: "Éjezüst" }, hex: "#4D5156" },
  { id: "quicksilver", name: { en: "Quicksilver", hu: "Ezüst" }, hex: "#8C8F93" },
  { id: "ultra-red", name: { en: "Ultra Red", hu: "Ultra piros" }, hex: "#A61F2B" },
  { id: "deep-blue", name: { en: "Deep Blue Metallic", hu: "Mélykék" }, hex: "#1E3A5F" },
  { id: "midnight-cherry", name: { en: "Midnight Cherry Red", hu: "Éjcseresznye" }, hex: "#3D0F14" },
];

interface VehicleColorSelectorProps {
  value: string | null;
  onChange: (colorId: string) => void;
}

const VehicleColorSelector = ({ value, onChange }: VehicleColorSelectorProps) => {
  const { language } = useLanguage();

  const selectedColor = TESLA_COLORS.find(c => c.id === value);

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={language === "hu" ? "Válassz színt" : "Select color"}>
          {selectedColor && (
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span>{selectedColor.name[language]}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TESLA_COLORS.map((color) => (
          <SelectItem key={color.id} value={color.id}>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color.hex }}
              />
              <span>{color.name[language]}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default VehicleColorSelector;
