import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StepCardProps {
  /**
   * Main title for the step
   */
  title: string;

  /**
   * Subtitle or description for the step
   */
  subtitle?: string;

  /**
   * Optional step number (e.g., 1, 2, 3)
   * If provided, displays a numbered badge
   */
  stepNumber?: number;

  /**
   * Optional icon class (e.g., "fas fa-trophy")
   */
  icon?: string;

  /**
   * Optional variant for styling
   * - "default" = standard card
   * - "highlight" = emphasized card with gradient
   */
  variant?: "default" | "highlight";

  /**
   * Optional custom className for additional styling
   */
  className?: string;
}

/**
 * StepCard Component
 *
 * Semantic card component for displaying step-by-step instructions.
 * Designed for "Enter the Ring" flow and similar step-based UX patterns.
 *
 * @example
 * ```tsx
 * <StepCard
 *   stepNumber={1}
 *   title="Answer five questions"
 *   subtitle="Each correct answer earns points"
 * />
 * ```
 */
export function StepCard({
  title,
  subtitle,
  stepNumber,
  icon,
  variant = "default",
  className,
}: StepCardProps) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/10",
        variant === "highlight" && "border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-white/5 to-white/5 ring-2 ring-cyan-400/20",
        className
      )}
    >
      <CardHeader>
        {stepNumber !== undefined && (
          <Badge
            variant="outline"
            className="w-fit border-cyan-300/40 text-xs uppercase tracking-[0.3em] text-cyan-200 mb-2"
          >
            Step {stepNumber}
          </Badge>
        )}
        <CardTitle className={cn(
          "text-2xl flex items-center gap-3",
          variant === "highlight" && "text-white"
        )}>
          {/* Claude: Display step number badge or icon if provided */}
          {stepNumber !== undefined && (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold flex-shrink-0">
              {stepNumber}
            </span>
          )}
          {icon && <i className={cn(icon, "text-cyan-400")} />}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      {subtitle && (
        <CardContent>
          <p className="text-data3-white/85">{subtitle}</p>
        </CardContent>
      )}
    </Card>
  );
}
