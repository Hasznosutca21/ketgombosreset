import { useEffect, useState } from "react";
import { getWorkflows, Workflow } from "@/lib/api";
import { Package, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface WorkflowProgressProps {
  currentWorkflowId?: number;
  isWaitingForParts?: boolean;
  missingPart?: string | null;
  className?: string;
  compact?: boolean;
}

const WorkflowProgress = ({
  currentWorkflowId,
  isWaitingForParts = false,
  missingPart,
  className,
  compact = false,
}: WorkflowProgressProps) => {
  const { language } = useLanguage();
  const [steps, setSteps] = useState<Workflow[]>([]);

  useEffect(() => {
    getWorkflows()
      .then((workflows) => {
        // Build ordered chain from workflows using previous_workflow_id
        const active = workflows.filter((w) => w.is_active);
        if (active.length === 0) return;

        // Find the first step (no previous)
        const first = active.find((w) => !w.previous_workflow_id);
        if (!first) {
          // Fallback: just sort by id
          setSteps(active.sort((a, b) => a.id - b.id));
          return;
        }

        const ordered: Workflow[] = [first];
        const byPrev = new Map<number, Workflow>();
        active.forEach((w) => {
          if (w.previous_workflow_id) byPrev.set(w.previous_workflow_id, w);
        });

        let current = first;
        while (byPrev.has(current.id)) {
          current = byPrev.get(current.id)!;
          ordered.push(current);
        }

        setSteps(ordered);
      })
      .catch(() => {});
  }, []);

  if (steps.length === 0) return null;

  const currentIndex = steps.findIndex((s) => s.id === currentWorkflowId);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="relative flex items-center w-full">
        {steps.map((step, i) => {
          const isCompleted = i < effectiveIndex;
          const isCurrent = i === effectiveIndex;
          const isEnd = step.is_end_state === 1;
          const isPast = isCompleted;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-300",
                    compact ? "w-6 h-6" : "w-8 h-8",
                    isPast
                      ? "bg-primary text-primary-foreground"
                      : isCurrent && isWaitingForParts
                      ? "bg-orange-500 text-white ring-2 ring-orange-300 ring-offset-1 ring-offset-background"
                      : isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isPast ? (
                    <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
                  ) : isCurrent && isWaitingForParts ? (
                    <Package className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
                  ) : (
                    <Circle className={cn(compact ? "h-2 w-2" : "h-3 w-3", "fill-current")} />
                  )}
                </div>
                {/* Label */}
                {!compact && (
                  <span
                    className={cn(
                      "absolute top-full mt-1.5 text-[10px] leading-tight text-center whitespace-nowrap max-w-[80px] truncate",
                      isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {isCurrent && isWaitingForParts
                      ? language === "hu"
                        ? "Alkatrészre vár"
                        : "Waiting for parts"
                      : step.name}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 mx-1">
                  <div
                    className={cn(
                      "h-[2px] w-full rounded-full transition-all duration-500",
                      i < effectiveIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Waiting for parts callout */}
      {isWaitingForParts && missingPart && !compact && (
        <div className="mt-8 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
          <Package className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {language === "hu" ? "Hiányzó alkatrész" : "Missing part"}: {missingPart}
          </span>
        </div>
      )}
    </div>
  );
};

export default WorkflowProgress;
