import { cn } from "@/lib/utils";

interface SilhouetteProps {
  className?: string;
}

// Model S - sedan silhouette
export const ModelSSilhouette = ({ className }: SilhouetteProps) => (
  <svg viewBox="0 0 120 40" className={cn("w-full h-auto", className)} fill="currentColor">
    <path d="M10 28 Q5 28 4 26 L4 24 Q4 22 6 22 L12 22 Q14 22 15 20 L18 16 Q22 12 30 10 L50 8 Q70 7 85 8 L100 10 Q108 12 110 16 L112 20 Q113 22 115 22 L116 24 Q116 26 114 28 L110 28 Q108 28 106 26 Q104 22 98 22 Q92 22 90 26 Q88 28 86 28 L34 28 Q32 28 30 26 Q28 22 22 22 Q16 22 14 26 Q12 28 10 28 Z" />
    <circle cx="22" cy="26" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="98" cy="26" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Model 3 - compact sedan silhouette
export const Model3Silhouette = ({ className }: SilhouetteProps) => (
  <svg viewBox="0 0 120 40" className={cn("w-full h-auto", className)} fill="currentColor">
    <path d="M10 28 Q5 28 4 26 L4 24 Q4 22 6 22 L12 22 Q14 22 15 20 L20 14 Q26 10 35 9 L55 8 Q75 8 90 9 L100 11 Q106 13 108 16 L110 20 Q111 22 114 22 L115 24 Q115 26 113 28 L108 28 Q106 28 104 26 Q102 22 96 22 Q90 22 88 26 Q86 28 84 28 L36 28 Q34 28 32 26 Q30 22 24 22 Q18 22 16 26 Q14 28 12 28 Z" />
    <circle cx="24" cy="26" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="96" cy="26" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Model X - SUV with falcon wing doors silhouette
export const ModelXSilhouette = ({ className }: SilhouetteProps) => (
  <svg viewBox="0 0 120 45" className={cn("w-full h-auto", className)} fill="currentColor">
    <path d="M10 32 Q5 32 4 30 L4 28 Q4 26 6 26 L12 26 Q14 26 15 24 L18 18 Q22 12 32 10 L50 8 Q70 7 88 9 L102 12 Q108 14 110 18 L112 24 Q113 26 115 26 L116 28 Q116 30 114 32 L110 32 Q108 32 106 30 Q104 26 98 26 Q92 26 90 30 Q88 32 86 32 L34 32 Q32 32 30 30 Q28 26 22 26 Q16 26 14 30 Q12 32 10 32 Z" />
    <path d="M35 10 L35 6 Q40 4 50 4 L55 6 L55 8" fill="currentColor" opacity="0.7" />
    <circle cx="22" cy="30" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="98" cy="30" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Model Y - compact SUV silhouette
export const ModelYSilhouette = ({ className }: SilhouetteProps) => (
  <svg viewBox="0 0 120 42" className={cn("w-full h-auto", className)} fill="currentColor">
    <path d="M10 30 Q5 30 4 28 L4 26 Q4 24 6 24 L12 24 Q14 24 15 22 L19 16 Q24 11 34 9 L52 8 Q72 7 90 9 L102 11 Q108 14 110 18 L112 22 Q113 24 115 24 L116 26 Q116 28 114 30 L110 30 Q108 30 106 28 Q104 24 98 24 Q92 24 90 28 Q88 30 86 30 L34 30 Q32 30 30 28 Q28 24 22 24 Q16 24 14 28 Q12 30 10 30 Z" />
    <circle cx="22" cy="28" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="98" cy="28" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Map vehicle ID to silhouette component
export const vehicleSilhouettes: Record<string, React.FC<SilhouetteProps>> = {
  "model-s": ModelSSilhouette,
  "model-3": Model3Silhouette,
  "model-x": ModelXSilhouette,
  "model-y": ModelYSilhouette,
};
