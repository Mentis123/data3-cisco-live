import { cn } from "@/lib/utils";

interface HeroSectionProps {
  /**
   * Main title text displayed prominently
   */
  title: string;

  /**
   * Optional subtitle text displayed below title
   */
  subtitle?: string;

  /**
   * Image source path (from @assets or public directory)
   */
  image: string;

  /**
   * Layout orientation:
   * - "leftImage" = image on left, text on right
   * - "rightImage" = image on right, text on left (default)
   * - "centered" = centered layout with image above text
   */
  layout?: "leftImage" | "rightImage" | "centered";

  /**
   * Text contrast mode for readability:
   * - "darkOnLight" = dark text on light background
   * - "lightOnDark" = light text on dark background (default)
   */
  textContrast?: "darkOnLight" | "lightOnDark";

  /**
   * Optional custom className for additional styling
   */
  className?: string;

  /**
   * Optional alt text for the image (defaults to title)
   */
  imageAlt?: string;
}

/**
 * HeroSection Component
 *
 * Reusable hero section with flexible layouts and text contrast modes.
 * Designed for consistency across Beat the Bot pages.
 *
 * @example
 * ```tsx
 * <HeroSection
 *   title="Data3 – Beat the Bot"
 *   subtitle="Practice makes perfect"
 *   image={heroImage}
 *   layout="leftImage"
 *   textContrast="darkOnLight"
 * />
 * ```
 */
export function HeroSection({
  title,
  subtitle,
  image,
  layout = "rightImage",
  textContrast = "lightOnDark",
  className,
  imageAlt,
}: HeroSectionProps) {
  // Claude: Text color classes based on contrast mode
  const textColorClass = textContrast === "darkOnLight"
    ? "text-data3-blue-black"
    : "text-data3-white";

  const subtitleColorClass = textContrast === "darkOnLight"
    ? "text-data3-blue-black/80"
    : "text-data3-white/80";

  // Claude: Render centered layout variant
  if (layout === "centered") {
    return (
      <section className={cn("space-y-6 text-center", className)}>
        <div className="flex justify-center mb-6">
          <img
            src={image}
            alt={imageAlt || title}
            className="max-h-64 w-auto rounded-2xl object-contain shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40"
          />
        </div>
        <div className="space-y-4">
          <h1 className={cn(
            "text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl",
            textColorClass
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              "mx-auto max-w-3xl text-pretty text-lg sm:text-xl",
              subtitleColorClass
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Claude: Render side-by-side layout (leftImage or rightImage)
  return (
    <section className={cn(
      "flex flex-col items-center gap-6 sm:flex-row sm:items-start",
      layout === "leftImage" && "sm:flex-row",
      layout === "rightImage" && "sm:flex-row-reverse",
      className
    )}>
      {/* Hero Image */}
      <div className="flex-shrink-0">
        <img
          src={image}
          alt={imageAlt || title}
          className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 rounded-2xl object-cover shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/40"
        />
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-4 text-center sm:text-left">
        <h1 className={cn(
          "text-4xl font-semibold sm:text-5xl",
          textColorClass
        )}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn(
            "max-w-3xl text-pretty text-base sm:text-lg",
            subtitleColorClass
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
