import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthCriteria {
  label: string;
  met: boolean;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { t } = useLanguage();

  const analysis = useMemo(() => {
    const criteria: StrengthCriteria[] = [
      { label: t.passwordMinLength, met: password.length >= 6 },
      { label: t.passwordHasUppercase, met: /[A-Z]/.test(password) },
      { label: t.passwordHasNumber, met: /[0-9]/.test(password) },
      { label: t.passwordHasSpecial, met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const score = criteria.filter((c) => c.met).length;
    
    let strength: "weak" | "fair" | "good" | "strong";
    let color: string;
    let label: string;
    
    if (score <= 1) {
      strength = "weak";
      color = "bg-destructive";
      label = t.passwordWeak;
    } else if (score === 2) {
      strength = "fair";
      color = "bg-orange-500";
      label = t.passwordFair;
    } else if (score === 3) {
      strength = "good";
      color = "bg-yellow-500";
      label = t.passwordGood;
    } else {
      strength = "strong";
      color = "bg-green-500";
      label = t.passwordStrong;
    }

    return { criteria, score, strength, color, label };
  }, [password, t]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{t.passwordStrength}</span>
          <span className={`text-xs font-medium ${
            analysis.strength === "weak" ? "text-destructive" :
            analysis.strength === "fair" ? "text-orange-500" :
            analysis.strength === "good" ? "text-yellow-500" :
            "text-green-500"
          }`}>
            {analysis.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${analysis.color}`}
            style={{ width: `${(analysis.score / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-1">
        {analysis.criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-1.5 text-xs">
            {criterion.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={criterion.met ? "text-foreground" : "text-muted-foreground"}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
