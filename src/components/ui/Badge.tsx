"use client";

interface BadgeProps {
  variant: "correct" | "incorrect" | "disqualified" | "pending" | "active" | "inactive" | "info";
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeProps["variant"], { bg: string; text: string; border: string }> = {
  correct: { bg: "rgba(0,230,118,0.10)", text: "#00e676", border: "rgba(0,230,118,0.35)" },
  incorrect: { bg: "rgba(255,61,61,0.10)", text: "#ff3d3d", border: "rgba(255,61,61,0.35)" },
  disqualified: { bg: "rgba(255,214,0,0.10)", text: "#ffd600", border: "rgba(255,214,0,0.35)" },
  pending: { bg: "rgba(92,107,122,0.15)", text: "#8a9ab0", border: "rgba(92,107,122,0.35)" },
  active: { bg: "rgba(0,230,118,0.10)", text: "#00e676", border: "rgba(0,230,118,0.35)" },
  inactive: { bg: "rgba(92,107,122,0.12)", text: "#5c6b7a", border: "rgba(92,107,122,0.3)" },
  info: { bg: "rgba(64,196,255,0.10)", text: "#40c4ff", border: "rgba(64,196,255,0.35)" },
};

export default function Badge({ variant, children, pulse = false, className = "" }: BadgeProps) {
  const s = variantStyles[variant];
  const pulseClass =
    variant === "active" ? "animate-pulse-green"
    : variant === "incorrect" ? "animate-pulse-red"
    : variant === "disqualified" ? "animate-pulse-yellow"
    : "";

  return (
    <span
      className={`${pulse ? pulseClass : ""} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        fontSize: 11,
        fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: s.text,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 2,
        whiteSpace: "nowrap",
      }}
    >
      {pulse && variant === "active" && (
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#00e676",
            animation: "blink 1s step-end infinite",
          }}
        />
      )}
      {children}
    </span>
  );
}
