/**
 * Data#3 Brand Name Component
 * Ensures the # is always properly superscripted per brand guidelines
 */

interface Data3LogoProps {
  className?: string;
}

export function Data3Logo({ className = "" }: Data3LogoProps) {
  return (
    <span className={className}>
      Data<sup className="text-[0.65em] font-bold">#</sup>3
    </span>
  );
}

export default Data3Logo;
