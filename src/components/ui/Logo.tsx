"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const dimensions = {
    sm: { svg: 28, text: "text-lg" },
    md: { svg: 36, text: "text-2xl" },
    lg: { svg: 48, text: "text-3xl" },
  };

  const d = dimensions[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* SVG Logo Placeholder - replace src/public/logo.svg later */}
      <svg
        width={d.svg}
        height={d.svg}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Bug body */}
        <ellipse cx="24" cy="26" rx="11" ry="13" fill="#00e676" opacity="0.15" stroke="#00e676" strokeWidth="1.5" />
        {/* Bug head */}
        <circle cx="24" cy="13" r="6" fill="#00e676" opacity="0.2" stroke="#00e676" strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="21.5" cy="12" r="1.5" fill="#00e676" />
        <circle cx="26.5" cy="12" r="1.5" fill="#00e676" />
        {/* Antenna left */}
        <line x1="20" y1="8" x2="16" y2="3" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="3" r="1.5" fill="#00e676" />
        {/* Antenna right */}
        <line x1="28" y1="8" x2="32" y2="3" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32" cy="3" r="1.5" fill="#00e676" />
        {/* Legs left */}
        <line x1="13" y1="22" x2="7" y2="19" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="27" x2="6" y2="27" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="32" x2="7" y2="35" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        {/* Legs right */}
        <line x1="35" y1="22" x2="41" y2="19" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="27" x2="42" y2="27" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="32" x2="41" y2="35" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
        {/* Code symbol on body */}
        <text x="24" y="29" textAnchor="middle" fontSize="9" fill="#00e676" fontFamily="monospace" fontWeight="bold">
          {"</>"}
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-display font-bold tracking-widest uppercase ${d.text} text-[#00e676]`}
            style={{ fontFamily: "'Orbitron', monospace", letterSpacing: "0.15em" }}
          >
            Pass The Bug
          </span>
          <span
            className="text-[10px] tracking-[0.3em] uppercase text-[#5c6b7a] mt-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Coding Competition
          </span>
        </div>
      )}
    </div>
  );
}
