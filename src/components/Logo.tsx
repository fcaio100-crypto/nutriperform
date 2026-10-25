/** Logomarca NutriPerform — haltere em ascensão (opção D). */
export function LogoMark({ size = 44, accent = "#A3E635", bg = "#0B0F0C" }: { size?: number; accent?: string; bg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="NutriPerform">
      <rect width="64" height="64" rx="15" fill={bg} />
      <g transform="rotate(-35 34 32)" fill={accent}>
        <rect x="20" y="29.5" width="28" height="5" rx="2.5" />
        <rect x="15" y="20" width="7" height="24" rx="2.5" />
        <rect x="10" y="24.5" width="5" height="15" rx="2" />
        <rect x="46" y="20" width="7" height="24" rx="2.5" />
        <rect x="53" y="24.5" width="5" height="15" rx="2" />
      </g>
      {size >= 40 && (
        <g stroke={accent} strokeWidth="2.6" strokeLinecap="round" opacity="0.55">
          <line x1="7" y1="50" x2="15" y2="50" />
          <line x1="9" y1="56" x2="20" y2="56" />
        </g>
      )}
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold italic uppercase tracking-tight ${className}`}>
      Nutri<span className="text-[#2E6B0C] dark:text-[#A3E635]">Perform</span>
    </span>
  );
}
