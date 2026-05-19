"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "green" | "red" | "yellow" | "white";
  label?: string;
}

const sizeMap = { sm: 18, md: 28, lg: 44 };
const strokeMap = { sm: 2, md: 2.5, lg: 3 };

const colorMap = {
  green: "#00e676",
  red: "#ff3d3d",
  yellow: "#ffd600",
  white: "#dde4ee",
};

export default function LoadingSpinner({
  size = "md",
  color = "green",
  label,
}: LoadingSpinnerProps) {
  const px = sizeMap[size];
  const sw = strokeMap[size];
  const c = colorMap[color];
  const r = (px - sw * 2) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <span
      role="status"
      aria-label={label || "Loading"}
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8 }}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        className="animate-spin-slow"
        style={{ display: "block" }}
      >
        {/* Background ring */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={`${c}22`}
          strokeWidth={sw}
        />
        {/* Spinning arc */}
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
          strokeLinecap="round"
          style={{ transformOrigin: "50% 50%" }}
        />
      </svg>
      {label && (
        <span style={{ fontSize: 11, color: "#5c6b7a", letterSpacing: "0.1em" }}>
          {label}
        </span>
      )}
    </span>
  );
}
