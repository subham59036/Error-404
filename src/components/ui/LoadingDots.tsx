"use client";

interface LoadingDotsProps {
  color?: "green" | "red" | "yellow" | "white";
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  green: "#00e676",
  red: "#ff3d3d",
  yellow: "#ffd600",
  white: "#dde4ee",
};

const sizeMap = {
  sm: "5px",
  md: "7px",
  lg: "10px",
};

export default function LoadingDots({ color = "green", size = "md" }: LoadingDotsProps) {
  const dotColor = colorMap[color];
  const dotSize = sizeMap[size];

  return (
    <span
      aria-label="Loading"
      role="status"
      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-dot-bounce"
          style={{
            display: "inline-block",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: dotColor,
            animationDelay: `${i * 0.18}s`,
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}
