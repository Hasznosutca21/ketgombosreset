import { cn } from "@/lib/utils";

interface LicensePlateOverlayProps {
  plateNumber: string;
  className?: string;
}

const LicensePlateOverlay = ({ plateNumber, className }: LicensePlateOverlayProps) => {
  if (!plateNumber) return null;

  // Format plate number (e.g., "ABC123" -> "ABC-123" or keep as is if already formatted)
  const formattedPlate = plateNumber.includes("-") 
    ? plateNumber.toUpperCase() 
    : plateNumber.length >= 6 
      ? `${plateNumber.slice(0, 3)}-${plateNumber.slice(3)}`.toUpperCase()
      : plateNumber.toUpperCase();

  return (
    <div className={cn("inline-flex items-center", className)}>
      <div className="relative flex items-center bg-gradient-to-b from-[#90EE90] to-[#7CCD7C] rounded-md shadow-lg border-2 border-black overflow-hidden">
        {/* EU Blue Strip */}
        <div className="flex flex-col items-center justify-center bg-[#003399] px-1.5 py-1 h-full">
          <div className="flex flex-wrap justify-center gap-0.5 mb-0.5">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="text-[6px] text-yellow-400">★</span>
            ))}
          </div>
          <span className="text-white font-bold text-xs">H</span>
        </div>
        
        {/* Main Plate Area */}
        <div className="flex items-center justify-center px-3 py-1.5">
          <span 
            className="font-bold text-black tracking-wider"
            style={{ 
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(1rem, 4vw, 1.5rem)",
              textShadow: "0 1px 0 rgba(255,255,255,0.3)"
            }}
          >
            {formattedPlate}
          </span>
        </div>

        {/* Hungarian Coat of Arms */}
        <div className="flex items-center justify-center px-1.5 py-1 h-full">
          <div className="w-5 h-6 bg-gradient-to-b from-red-600 via-white to-green-600 rounded-sm border border-black/30 flex items-center justify-center">
            <span className="text-[8px]">🇭🇺</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicensePlateOverlay;
