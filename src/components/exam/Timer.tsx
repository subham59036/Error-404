"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface TimerProps {
  initialSeconds: number;
  onTimeout: () => void;
  onTick?: (remaining: number) => void;
  paused?: boolean;
}

export default function Timer({ initialSeconds, onTimeout, onTick, paused = false }: TimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const onTimeoutRef = useRef(onTimeout);
  const onTickRef = useRef(onTick);
  const firedRef = useRef(false);

  // Keep refs up to date
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  useEffect(() => {
    if (paused) return;
    if (firedRef.current) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (onTickRef.current) onTickRef.current(next);
        if (next <= 0 && !firedRef.current) {
          firedRef.current = true;
          clearInterval(id);
          setTimeout(() => onTimeoutRef.current(), 50);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [paused]);

  const pct = remaining / initialSeconds;
  const isUrgent = remaining <= 60;
  const isWarning = remaining <= 120 && !isUrgent;

  const color = isUrgent ? "#ff3d3d" : isWarning ? "#ffd600" : "#00e676";
  const bgColor = isUrgent
    ? "rgba(255,61,61,0.08)"
    : isWarning
    ? "rgba(255,214,0,0.08)"
    : "rgba(0,230,118,0.06)";
  const borderColor = isUrgent
    ? "rgba(255,61,61,0.3)"
    : isWarning
    ? "rgba(255,214,0,0.3)"
    : "rgba(0,230,118,0.2)";

  // Progress bar segments (10 segments)
  const totalSegments = 10;
  const activeSegments = Math.ceil(pct * totalSegments);

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "10px 16px",
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        minWidth: 130,
        transition: "all 0.3s ease",
      }}
      className={isUrgent ? "animate-pulse-red" : isWarning ? "animate-pulse-yellow" : ""}
    >
      {/* Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: color,
          opacity: 0.8,
        }}
      >
        <Clock size={10} />
        Time Remaining
      </div>

      {/* Time display */}
      <div
        className={isUrgent ? "animate-timer-pulse" : ""}
        style={{
          fontFamily: "var(--font-orbitron), Orbitron, monospace",
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: "0.08em",
          color,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(remaining)}
      </div>

      {/* Segment progress bar */}
      <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 3,
              borderRadius: 1,
              backgroundColor:
                i < activeSegments ? color : "rgba(92,107,122,0.3)",
              transition: "background-color 0.3s ease",
            }}
          />
        ))}
      </div>

      {isUrgent && (
        <div
          style={{
            fontSize: 10,
            color: "#ff3d3d",
            letterSpacing: "0.1em",
            fontWeight: 700,
            animation: "blink 0.8s step-end infinite",
          }}
        >
          HURRY UP!
        </div>
      )}
    </div>
  );
}
