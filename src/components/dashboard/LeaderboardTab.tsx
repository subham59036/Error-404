"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LoadingDots from "@/components/ui/LoadingDots";
import Badge from "@/components/ui/Badge";
import Popup from "@/components/ui/Popup";
import { RefreshCw, Trophy, ChevronUp, ChevronDown, Medal } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface LeaderboardTabProps {
  token: string;
}

interface LeaderboardEntry {
  team_id: string;
  members: Array<{ name: string; email: string; department: string; position: number }>;
  marks: number;
  time_taken: number | null;
  member_count: number;
  is_promoted: boolean;
  status: "correct" | "incorrect" | "disqualified" | "pending";
}

export default function LeaderboardTab({ token }: LeaderboardTabProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ open: boolean; message: string; variant: "success" | "danger" } | null>(null);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/admin/leaderboard?level=${level}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, level]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handlePromote = async (teamId: string, promote: boolean) => {
    setPromoting(teamId);
    try {
      const res = await fetch("/api/admin/promote", {
        method: promote ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId, fromLevel: level }),
      });
      if (res.ok) {
        setPopup({
          open: true,
          message: promote
            ? `Team ${teamId} has been promoted to Level ${level + 1}.`
            : `Team ${teamId} promotion has been revoked.`,
          variant: "success",
        });
        await fetchLeaderboard(true);
      } else {
        const data = await res.json();
        setPopup({ open: true, message: data.error || "Action failed.", variant: "danger" });
      }
    } catch {
      setPopup({ open: true, message: "Network error.", variant: "danger" });
    } finally {
      setPromoting(null);
    }
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal size={14} color="#ffd600" />;
    if (rank === 2) return <Medal size={14} color="#b0bec5" />;
    if (rank === 3) return <Medal size={14} color="#cd7f32" />;
    return (
      <span style={{ fontSize: 12, color: "#5c6b7a", minWidth: 14, textAlign: "center", display: "inline-block" }}>
        {rank}
      </span>
    );
  };

  const statusColors: Record<string, { row: string; border: string }> = {
    correct: { row: "rgba(0,230,118,0.04)", border: "rgba(0,230,118,0.18)" },
    incorrect: { row: "rgba(255,61,61,0.04)", border: "rgba(255,61,61,0.14)" },
    disqualified: { row: "rgba(255,214,0,0.04)", border: "rgba(255,214,0,0.14)" },
    pending: { row: "transparent", border: "#1a2535" },
  };

  return (
    <div>
      <Popup
        isOpen={!!popup?.open}
        onClose={() => setPopup(null)}
        title={popup?.variant === "success" ? "Done" : "Error"}
        variant={popup?.variant}
      >
        <p style={{ fontSize: 13 }}>{popup?.message}</p>
      </Popup>

      {/* Level selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={16} color="#ffd600" />
          <span
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "#dde4ee",
              letterSpacing: "0.1em",
            }}
          >
            Leaderboard
          </span>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {([1, 2, 3] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              style={{
                padding: "6px 16px",
                fontSize: 11,
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                backgroundColor:
                  level === l ? "rgba(255,214,0,0.12)" : "transparent",
                color: level === l ? "#ffd600" : "#5c6b7a",
                border: `1px solid ${level === l ? "rgba(255,214,0,0.4)" : "#1a2535"}`,
                borderRadius: 2,
                cursor: "pointer",
              }}
            >
              Level {l}
            </button>
          ))}

          <button
            onClick={() => fetchLeaderboard(true)}
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
              marginLeft: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#dde4ee"; e.currentTarget.style.borderColor = "#243245"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#5c6b7a"; e.currentTarget.style.borderColor = "#1a2535"; }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin-slow" : ""} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Badge variant="correct">Correct (+1 pt)</Badge>
        <Badge variant="incorrect">Incorrect (0 pt)</Badge>
        <Badge variant="disqualified">Disqualified</Badge>
        <Badge variant="pending">Pending</Badge>
        {level < 3 && (
          <span style={{ fontSize: 11, color: "#5c6b7a", alignSelf: "center", marginLeft: 8 }}>
            · Promote button advances team to Level {level + 1}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <LoadingSpinner size="md" label="Loading leaderboard…" />
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#5c6b7a",
            border: "1px dashed #1a2535",
            borderRadius: 4,
          }}
        >
          <Trophy size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>
            {level === 1
              ? "No teams have registered yet."
              : `No teams have been promoted to Level ${level} yet.`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {entries.map((entry, idx) => {
            const colors = statusColors[entry.status];
            const isPromoting = promoting === entry.team_id;

            return (
              <div
                key={entry.team_id}
                className="animate-fade-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  backgroundColor: colors.row,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${
                    entry.status === "correct"
                      ? "#00e676"
                      : entry.status === "disqualified"
                      ? "#ffd600"
                      : entry.status === "incorrect"
                      ? "#ff3d3d"
                      : "#1a2535"
                  }`,
                  borderRadius: 3,
                }}
              >
                {/* Rank */}
                <div style={{ minWidth: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {rankIcon(idx + 1)}
                </div>

                {/* Team ID */}
                <span
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 900,
                    fontSize: 14,
                    color: "#00e676",
                    letterSpacing: "0.2em",
                    minWidth: 70,
                  }}
                >
                  {entry.team_id}
                </span>

                {/* Members */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {entry.members.map((m, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          color: "#8a9ab0",
                          padding: "1px 6px",
                          backgroundColor: "#111922",
                          border: "1px solid #1a2535",
                          borderRadius: 2,
                        }}
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexShrink: 0,
                    fontSize: 12,
                    color: "#5c6b7a",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-orbitron), Orbitron, monospace",
                        fontWeight: 900,
                        fontSize: 18,
                        color:
                          entry.marks > 0 ? "#00e676" : "#5c6b7a",
                        lineHeight: 1,
                      }}
                    >
                      {entry.marks}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: "0.1em", marginTop: 2 }}>PTS</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#dde4ee", fontSize: 13, lineHeight: 1 }}>
                      {entry.time_taken !== null ? formatDuration(entry.time_taken) : "—"}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: "0.1em", marginTop: 2 }}>TIME</div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#dde4ee", fontSize: 13, lineHeight: 1 }}>
                      {entry.member_count}
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: "0.1em", marginTop: 2 }}>MBRS</div>
                  </div>
                </div>

                {/* Status badge */}
                <Badge variant={entry.status}>
                  {entry.status === "correct"
                    ? "✓ Correct"
                    : entry.status === "disqualified"
                    ? "⚡ DQ"
                    : entry.status === "incorrect"
                    ? "✗ Wrong"
                    : "Pending"}
                </Badge>

                {/* Promote controls — only show if not on level 3 */}
                {level < 3 && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {entry.is_promoted ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#00e676",
                            letterSpacing: "0.1em",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <ChevronUp size={12} /> L{level + 1}
                        </span>
                        <button
                          onClick={() => handlePromote(entry.team_id, false)}
                          disabled={!!promoting}
                          style={{
                            padding: "4px 10px",
                            fontSize: 10,
                            fontFamily: "var(--font-orbitron), Orbitron, monospace",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            backgroundColor: "transparent",
                            color: "#ff3d3d",
                            border: "1px solid rgba(255,61,61,0.4)",
                            borderRadius: 2,
                            cursor: isPromoting ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,61,61,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {isPromoting ? <LoadingDots color="red" size="sm" /> : "Revoke"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePromote(entry.team_id, true)}
                        disabled={!!promoting}
                        style={{
                          padding: "5px 12px",
                          fontSize: 10,
                          fontFamily: "var(--font-orbitron), Orbitron, monospace",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          backgroundColor: "rgba(0,230,118,0.1)",
                          color: "#00e676",
                          border: "1px solid rgba(0,230,118,0.4)",
                          borderRadius: 2,
                          cursor: isPromoting ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,230,118,0.18)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,230,118,0.1)")}
                      >
                        {isPromoting ? (
                          <LoadingDots color="green" size="sm" />
                        ) : (
                          <><ChevronUp size={11} /> Promote</>
                        )}
                      </button>
                    )}
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
