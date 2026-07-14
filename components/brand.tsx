import type { SVGProps } from "react";

export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="8">
        <path d="M32 7v13" />
        <path d="M32 44v13" />
        <path d="M7 32h13" />
        <path d="M44 32h13" />
        <path d="m14.3 14.3 9.2 9.2" />
        <path d="m40.5 40.5 9.2 9.2" />
        <path d="m49.7 14.3-9.2 9.2" />
        <path d="m23.5 40.5-9.2 9.2" />
      </g>
      <circle cx="32" cy="32" r="4.5" fill="currentColor" />
    </svg>
  );
}

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className={`brand ${light ? "brand--light" : ""}`} aria-label="SKILLDER">
      <BrandMark className="brand__mark" />
      {compact ? null : <span>SKILLDER</span>}
    </div>
  );
}
