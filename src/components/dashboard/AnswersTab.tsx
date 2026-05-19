"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import { RefreshCw, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface AnswersTabProps {
  token: string;
}

interface AnswerData {
  id: number;
  team_id: string;
  level: number;
  language: string;
  code: string;
  is_correct: number;
  gemini_response: string;
  time_taken: number;
  submitted_at: number;
  is_disqualified: number;
}

export default function AnswersTab({ token }: AnswersTabProps) {
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [levelFilter, setLevelFilter] = useState<"all" | 1 | 2 | 3>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchAnswers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const url =
        levelFilter !== "all"
          ? `/api/admin/answers?level=${levelFilter}`
          : "/api/admin/answers";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnswers(data.answers || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAnswers();
  }, [token, levelFilter]);

  const getStatus = (a: AnswerData): "correct" | "incorrect" | "disqualified" => {
    if (a.is_disqualified) return "disqualified";
    return a.is_correct ? "correct" : "incorrect";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <LoadingSpinner size="md" label="Loading answers…" />
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", 1, 2, 3] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              style={{
                padding: "6px 14px",
                fontSize: 11,
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                backgroundColor:
                  levelFilter === l ? "rgba(0,230,118,0.12)" : "transparent",
                color: levelFilter === l ? "#00e676" : "#5c6b7a",
                border: `1px solid ${levelFilter === l ? "rgba(0,230,118,0.4)" : "#1a2535"}`,
                borderRadius: 2,
                cursor: "pointer",
              }}
            >
              {l === "all" ? "All Levels" : `Level ${l}`}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#5c6b7a" }}>
            {answers.length} submission{answers.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => fetchAnswers(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              backgroundColor: "transparent",
              border: "1px solid #1a2535",
              borderRadius: 3,
              color: "#5c6b7a",
              fontSize: 12,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#dde4ee"; e.currentTarget.style.borderColor = "#243245"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#5c6b7a"; e.currentTarget.style.borderColor = "#1a2535"; }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin-slow" : ""} />
          </button>
        </div>
      </div>

      {answers.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#5c6b7a",
            border: "1px dashed #1a2535",
            borderRadius: 4,
          }}
        >
          <FileCode size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No submissions yet for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {answers.map((answer) => {
            const status = getStatus(answer);
            const isExpanded = expandedId === answer.id;

            const rowBg =
              status === "correct"
                ? "rgba(0,230,118,0.04)"
                : status === "disqualified"
                ? "rgba(255,214,0,0.04)"
                : "rgba(255,61,61,0.04)";

            const borderColor =
              status === "correct"
                ? "rgba(0,230,118,0.2)"
                : status === "disqualified"
                ? "rgba(255,214,0,0.2)"
                : "rgba(255,61,61,0.15)";

            return (
              <div
                key={answer.id}
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: 4,
                  overflow: "hidden",
                  backgroundColor: rowBg,
                }}
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : answer.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-orbitron), Orbitron, monospace",
                        fontWeight: 900,
                        fontSize: 14,
                        color: "#00e676",
                        letterSpacing: "0.2em",
                        flexShrink: 0,
                      }}
                    >
                      {answer.team_id}
                    </span>

                    <span
                      style={{
                        padding: "2px 8px",
                        backgroundColor: "#111922",
                        border: "1px solid #1a2535",
                        borderRadius: 2,
                        fontSize: 10,
                        color: "#8a9ab0",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        flexShrink: 0,
                      }}
                    >
                      L{answer.level}
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        color: "#5c6b7a",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        flexShrink: 0,
                      }}
                    >
                      {answer.language}
                    </span>

                    <Badge variant={status}>
                      {status === "correct" ? "✓ Correct" : status === "disqualified" ? "⚡ Disqualified" : "✗ Incorrect"}
                    </Badge>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "#5c6b7a" }}>
                      {formatDuration(answer.time_taken)}
                    </span>
                    <span style={{ color: "#5c6b7a" }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className="animate-slide-down"
                    style={{ borderTop: `1px solid ${borderColor}` }}
                  >
                    {/* Code */}
                    {answer.code && (
                      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${borderColor}` }}>
                        <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 8 }}>
                          Submitted Code
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            padding: "12px 14px",
                            backgroundColor: "#111922",
                            border: "1px solid #1a2535",
                            borderRadius: 3,
                            fontSize: 12,
                            color: "#dde4ee",
                            fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                            overflowX: "auto",
                            whiteSpace: "pre",
                            maxHeight: 280,
                            overflowY: "auto",
                          }}
                        >
                          {answer.code || "(empty)"}
                        </pre>
                      </div>
                    )}

                    {/* Gemini response */}
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 8 }}>
                        Gemini Evaluation
                      </p>
                      <div
                        style={{
                          padding: "12px 14px",
                          backgroundColor: "#111922",
                          border: "1px solid #1a2535",
                          borderRadius: 3,
                          fontSize: 12,
                          color: "#dde4ee",
                          fontFamily: "var(--font-jetbrains), monospace",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {answer.gemini_response || "(no response)"}
                      </div>
                      <p style={{ fontSize: 10, color: "#5c6b7a", marginTop: 6 }}>
                        Submitted: {new Date(answer.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
