import Link from "next/link";

function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "w-8 h-8 rounded-lg" : "w-6 h-6 rounded-md";
  const icon = size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <span className={`inline-flex items-center justify-center bg-amber-500 shrink-0 ${box}`}>
      <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 5l10 8 10-8" />
      </svg>
    </span>
  );
}

interface NMMPKLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  textClassName?: string;
}

export default function NMMPKLogo({ href = "/", className = "", size = "md", textClassName }: NMMPKLogoProps) {
  const textSize = textClassName ?? (size === "lg" ? "text-xl" : "text-lg");

  const inner = (
    <span className={`inline-flex items-center gap-2 font-extrabold text-amber-700 ${textSize} ${className}`}>
      <LogoMark size={size} />
      NooitMeerPostKwijt
    </span>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
