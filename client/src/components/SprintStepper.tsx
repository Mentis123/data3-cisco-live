import { CheckCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SprintStep = 1 | 2 | 3 | 4;

interface StepData {
  number: SprintStep;
  label: string;
  shortLabel: string;
  icon?: string;
}

const steps: StepData[] = [
  { number: 1, label: "Name the Problem", shortLabel: "Problem", icon: "lightbulb" },
  { number: 2, label: "Quantify Impact", shortLabel: "Impact", icon: "chart-line" },
  { number: 3, label: "Review & Confirm", shortLabel: "Review", icon: "checklist" },
  { number: 4, label: "Compete & Win", shortLabel: "Submit", icon: "trophy" }
];

interface SprintStepperProps {
  currentStep: SprintStep;
  completedSteps: Set<SprintStep>;
  onStepClick?: (step: SprintStep) => void;
  className?: string;
}

export function SprintStepper({
  currentStep,
  completedSteps,
  onStepClick,
  className
}: SprintStepperProps) {
  return (
    <div className={cn("w-full", className)} data-testid="sprint-stepper">
      <div className="relative">
        <div className="absolute top-6 left-4 right-4 h-px bg-white/15 sm:top-7 sm:left-8 sm:right-8" />

        <div className="flex items-start justify-between gap-2 sm:gap-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.number);
            const isCurrent = currentStep === step.number;
            const isClickable = onStepClick && (isCompleted || step.number < currentStep);

            return (
              <div key={step.number} className="flex-1 flex flex-col items-center text-center">
                <button
                  onClick={() => isClickable && onStepClick(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "group relative z-10 flex flex-col items-center gap-2 rounded-xl px-2 py-2 transition",
                    "touch-manipulation min-h-[64px]",
                    isClickable && "cursor-pointer hover:bg-white/20",
                    !isClickable && "cursor-default",
                    isCurrent && "bg-white/10 shadow-lg shadow-primary/20"
                  )}
                  data-testid={`step-${step.number}`}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-semibold",
                      "backdrop-blur-sm transition-all",
                      isCompleted
                        ? "border-white bg-white text-primary"
                        : isCurrent
                        ? "border-white/80 bg-white/20 text-white"
                        : "border-white/40 bg-white/10 text-white/70"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" data-testid={`step-${step.number}-completed`} />
                    ) : isCurrent ? (
                      <ChevronRight className="h-6 w-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "text-sm sm:text-base font-medium text-white/80 leading-tight",
                        isCurrent && "text-white",
                        isCompleted && "text-white"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </button>

                {index < steps.length - 1 && (
                  <div className="mt-2 hidden w-full sm:block">
                    <div
                      className={cn(
                        "mx-auto h-1 w-[calc(100%-1rem)] rounded-full",
                        completedSteps.has((step.number + 1) as SprintStep)
                          ? "bg-white"
                          : "bg-white/20"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 block sm:hidden">
        <div className="h-1 rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}