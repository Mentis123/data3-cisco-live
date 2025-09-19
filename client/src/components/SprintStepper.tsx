import { CheckCircle, Circle, ChevronRight } from "lucide-react";
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
  { number: 2, label: "Quantify the Impact", shortLabel: "Impact", icon: "chart-line" },
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
    <div 
      className={cn(
        "w-full bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40",
        className
      )}
      data-testid="sprint-stepper"
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.number);
            const isCurrent = currentStep === step.number;
            const isClickable = onStepClick && (isCompleted || step.number < currentStep);
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && onStepClick(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 rounded-lg transition-all",
                    "touch-manipulation min-h-[44px]",
                    isClickable && "cursor-pointer hover:bg-muted/50",
                    !isClickable && "cursor-default",
                    isCurrent && "bg-primary/10"
                  )}
                  data-testid={`step-${step.number}`}
                >
                  {/* Step indicator */}
                  <div className="relative">
                    {isCompleted ? (
                      <CheckCircle 
                        className="w-6 h-6 sm:w-7 sm:h-7 text-primary" 
                        data-testid={`step-${step.number}-completed`}
                      />
                    ) : (
                      <div 
                        className={cn(
                          "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                          isCurrent 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-muted-foreground text-muted-foreground"
                        )}
                      >
                        {isCurrent ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Step label */}
                  <div className="text-center sm:text-left">
                    <span 
                      className={cn(
                        "text-xs sm:text-sm font-medium block sm:hidden",
                        isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.shortLabel}
                    </span>
                    <span 
                      className={cn(
                        "text-sm font-medium hidden sm:block",
                        isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </button>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "hidden sm:flex flex-1 h-[2px] mx-2",
                      completedSteps.has((step.number + 1) as SprintStep) 
                        ? "bg-primary" 
                        : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Mobile progress bar */}
        <div className="sm:hidden mt-2">
          <div className="h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}