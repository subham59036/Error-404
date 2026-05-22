"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Badge from "@/components/ui/Badge";
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, Clock, Code2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Suspense } from "react";

interface ResultData {
  level: number;
  time_taken: number;
  is_correct: boolean;
  is_disqualified: boolean;
  gemini_response?: string;
  timeout?: boolean;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const level = parseInt(searchParams.get("level") || "1" || "2");
  const isDq = ["1", "2"].includes(searchParams.get("dq") ?? "");

  const [teamId, setTeamId] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const storedTeamId = sessionStorage.getItem("ptb_team_id");
    setTeamId(storedTeamId);

    const storedResult = sessionStorage.getItem("ptb_last_result");
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch {
        setResult({
          level,
          time_taken: 0,
          is_correct: false,
          is_disqualified: isDq,
        });
      }
    } else {
      setResult({
        level,
        time_taken: 0,
        is_correct: false,
        is_disqualified: isDq,
      });
    }
  }, [level, isDq]);

  const handleProceed = () => {
    sessionStorage.removeItem("ptb_last_result");
    sessionStorage.removeItem("ptb_current_level");
    router.push("/");
  };

  if (!result) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ color: "#5c6b7a" }}>Loading result…</p>
      </div>
    );
  }

  const isDisq = result.is_disqualified;
  const isCorrect = !isDisq && result.is_correct;
  const isTimeout = result.timeout && !isDisq;

  const accentColor = isDisq ? "#ffd600" : isCorrect ? "#00e676" : "#ff3d3d";
  const bgGlow = isDisq
    ? "rgba(255,214,0,0.06)"
    : isCorrect
    ? "rgba(0,230,118,0.06)"
    : "rgba(255,61,61,0.06)";
  const borderColor = isDisq
    ? "rgba(255,214,0,0.3)"
    : isCorrect
    ? "rgba(0,230,118,0.3)"
    : "rgba(255,61,61,0.25)";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        backgroundColor: "#06080d",
      }}
      className="bg-grid"
    >
      <div className="animate-slide-up" style={{ width: "100%", maxWidth: 540 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <Logo size="md" />
        </div>

        {/* Result card */}
        <div
          style={{
            backgroundColor: "#0d1219",
            border: `1px solid ${borderColor}`,
            borderTop: `3px solid ${accentColor}`,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: `0 0 60px ${bgGlow}`,
          }}
        >
          {/* Status header */}
          <div
            style={{
              padding: "28px 32px",
              backgroundColor: bgGlow,
              borderBottom: `1px solid ${borderColor}`,
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              {isDisq ? (
                <AlertTriangle
                  size={52}
                  color="#ffd600"
                  className="animate-pulse-yellow"
                />
              ) : isCorrect ? (
                <CheckCircle2
                  size={52}
                  color="#00e676"
                  className="animate-pulse-green"
                />
              ) : (
                <XCircle
                  size={52}
                  color="#ff3d3d"
                  className="animate-pulse-red"
                />
              )}
            </div>

            <p
              style={{
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: accentColor,
                marginBottom: 8,
              }}
            >
              {isDisq
                ? "Disqualified"
                : isCorrect
                ? "Correct!"
                : isTimeout
                ? "Time's Up"
                : "Incorrect"}
            </p>

            <p style={{ fontSize: 12, color: "#5c6b7a", lineHeight: 1.6 }}>
              {isDisq
                ? "Tab switch or window event detected. Your exam was terminated automatically."
                : isCorrect
                ? "Excellent work! Your solution passed Gemini's evaluation."
                : isTimeout
                ? "The time limit was reached. Your code was submitted automatically."
                : "Your solution did not pass evaluation. Better luck in the next round!"}
            </p>
          </div>

          {/* Stats */}
          <div style={{ padding: "24px 32px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Team ID */}
              <div
                style={{
                  padding: "14px 12px",
                  backgroundColor: "#111922",
                  border: "1px solid #1a2535",
                  borderRadius: 4,
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                  <Code2 size={14} color="#5c6b7a" />
                </div>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 4 }}>
                  Team ID
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 900,
                    fontSize: 16,
                    color: "#00e676",
                    letterSpacing: "0.22em",
                  }}
                >
                  {teamId || "—"}
                </p>
              </div>

              {/* Level */}
              <div
                style={{
                  padding: "14px 12px",
                  backgroundColor: "#111922",
                  border: "1px solid #1a2535",
                  borderRadius: 4,
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: "#5c6b7a" }}>🏁</span>
                </div>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 4 }}>
                  Round
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 900,
                    fontSize: 20,
                    color: "#dde4ee",
                    letterSpacing: "0.1em",
                  }}
                >
                  L{result.level}
                </p>
              </div>

              {/* Time taken */}
              <div
                style={{
                  padding: "14px 12px",
                  backgroundColor: "#111922",
                  border: "1px solid #1a2535",
                  borderRadius: 4,
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                  <Clock size={14} color="#5c6b7a" />
                </div>
                <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 4 }}>
                  Time Taken
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#dde4ee",
                    letterSpacing: "0.08em",
                  }}
                >
                  {formatDuration(result.time_taken)}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <Badge
                variant={isDisq ? "disqualified" : isCorrect ? "correct" : "incorrect"}
                pulse
              >
                {isDisq ? "⚡ Disqualified" : isCorrect ? "✓ Correct — 1 Point" : "✗ Incorrect — 0 Points"}
              </Badge>
            </div>

            {/* Gemini response */}
            {result.gemini_response && !isDisq && (
              <div
                style={{
                  padding: "14px 16px",
                  backgroundColor: "#111922",
                  border: "1px solid #1a2535",
                  borderRadius: 4,
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#5c6b7a",
                    marginBottom: 8,
                  }}
                >
                  Gemini Evaluation
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#8a9ab0",
                    lineHeight: 1.7,
                    fontFamily: "var(--font-jetbrains), monospace",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {result.gemini_response}
                </p>
              </div>
            )}

            {/* Info message */}
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "rgba(0,230,118,0.04)",
                border: "1px solid rgba(0,230,118,0.15)",
                borderRadius: 3,
                fontSize: 12,
                color: "#5c6b7a",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#00e676" }}>What happens next?</strong>
              <br />
              The superuser will review all Level {result.level} submissions and announce which teams advance to the next round.
              Click <strong>Proceed</strong> to return to the team portal and check your status.
            </div>

            {/* Proceed button */}
            <button
              onClick={handleProceed}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px",
                backgroundColor: accentColor,
                color: "#06080d",
                border: "none",
                borderRadius: 3,
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Proceed to Team Portal <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#5c6b7a", marginTop: 24 }}>
          Error404 · Coding Competition · Level {result.level} Complete
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#06080d" }}>
        <p style={{ color: "#5c6b7a" }}>Loading…</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
