"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Minus, Users, CheckCircle2, Clock, Trophy, AlertTriangle, Zap } from "lucide-react";
import LoadingDots from "@/components/ui/LoadingDots";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import { DEPARTMENTS } from "@/types";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/utils";
import type { TeamStatus } from "@/types";

const DEPT_OPTIONS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
];

interface MemberInput {
  name: string;
  email: string;
  department: string;
}

const emptyMember = (): MemberInput => ({ name: "", email: "", department: "" });

export default function TeamRegistration() {
  const [members, setMembers] = useState<MemberInput[]>([emptyMember(), emptyMember(), emptyMember()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamStatus, setTeamStatus] = useState<TeamStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const router = useRouter();

  // Load teamId from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("ptb_team_id");
    if (stored) setTeamId(stored);
  }, []);

  const fetchStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}/status`);
      if (res.ok) {
        const data = await res.json();
        setTeamStatus(data);
      } else {
        sessionStorage.removeItem("ptb_team_id");
        setTeamId(null);
        setTeamStatus(null);
      }
    } catch {
      // Network error, ignore
    }
  }, []);

  // Poll team status every 3 seconds when registered
  useEffect(() => {
    if (!teamId) return;
    fetchStatus(teamId);
    const interval = setInterval(() => fetchStatus(teamId), 3000);
    return () => clearInterval(interval);
  }, [teamId, fetchStatus]);

  // Determine the active level for this team
  useEffect(() => {
    if (!teamStatus) return;
    const levels = teamStatus.levels;
    if (levels[3].isPromoted || (levels[3].isQualified && !levels[2].hasSubmitted)) {
      setCurrentLevel(3);
    } else if (levels[2].isPromoted || (levels[2].isQualified && !levels[1].hasSubmitted)) {
      setCurrentLevel(2);
    } else {
      setCurrentLevel(1);
    }
  }, [teamStatus]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.department) {
        setError(`Member ${i + 1}: All fields are required.`);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
        setError(`Member ${i + 1}: Enter a valid email address.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/teams/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("ptb_team_id", data.teamId);
      setTeamId(data.teamId);
      setLoading(false);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const addMember = () => {
    if (members.length < 4) setMembers([...members, emptyMember()]);
  };

  const removeMember = () => {
    if (members.length > 3) setMembers(members.slice(0, -1));
  };

  const updateMember = (idx: number, field: keyof MemberInput, value: string) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: value };
    setMembers(updated);
  };

  const handleStartExam = (level: number) => {
    sessionStorage.setItem("ptb_current_level", String(level));
    router.push(`/exam/${level}`);
  };

  // ── If team is registered, show status dashboard ──
  if (teamId && teamStatus) {
    const lvl = teamStatus.levels[currentLevel as 1 | 2 | 3];
    const lvlSub = lvl.submission;

    return (
      <div className="animate-slide-up" style={{ width: "100%", maxWidth: 540 }}>
        {/* Team ID Banner */}
        <div
          className="animate-pulse-green"
          style={{
            padding: "16px 20px",
            backgroundColor: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.25)",
            borderRadius: 4,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 6 }}>
            Your Team ID
          </p>
          <p
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 900,
              fontSize: 32,
              letterSpacing: "0.35em",
              color: "#00e676",
            }}
          >
            {teamId}
          </p>
          <p style={{ fontSize: 11, color: "#5c6b7a", marginTop: 4 }}>
            {teamStatus.members.length} members · Keep this ID safe
          </p>
        </div>

        {/* Level Status Cards */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {([1, 2, 3] as const).map((lvlNum) => {
            const ls = teamStatus.levels[lvlNum];
            let statusBadge: React.ReactNode = null;
            if (ls.hasSubmitted && ls.isDisqualified) {
              statusBadge = <Badge variant="disqualified">Disqualified</Badge>;
            } else if (ls.hasSubmitted && ls.submission?.is_correct) {
              statusBadge = <Badge variant="correct">Correct</Badge>;
            } else if (ls.hasSubmitted) {
              statusBadge = <Badge variant="incorrect">Submitted</Badge>;
            } else if (ls.isPromoted || (lvlNum === 1)) {
              statusBadge = ls.isActive ? <Badge variant="active" pulse>Live</Badge> : <Badge variant="inactive">Waiting</Badge>;
            } else {
              statusBadge = <Badge variant="inactive">Locked</Badge>;
            }

            return (
              <div
                key={lvlNum}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: currentLevel === lvlNum ? "rgba(0,230,118,0.06)" : "#0d1219",
                  border: `1px solid ${currentLevel === lvlNum ? "rgba(0,230,118,0.25)" : "#1a2535"}`,
                  borderRadius: 3,
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 6 }}>
                  Level {lvlNum}
                </p>
                {statusBadge}
              </div>
            );
          })}
        </div>

        {/* Main Action Area */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#0d1219",
            border: "1px solid #1a2535",
            borderRadius: 4,
          }}
        >
          {/* Disqualified state */}
          {lvl.hasSubmitted && lvl.isDisqualified && (
            <div style={{ textAlign: "center" }}>
              <AlertTriangle size={32} color="#ffd600" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-orbitron), monospace", fontSize: 13, color: "#ffd600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Disqualified — Level {currentLevel}
              </p>
              <p style={{ fontSize: 12, color: "#5c6b7a" }}>
                Tab switch or window event detected.
                {lvlSub && ` Time recorded: ${formatDuration(lvlSub.time_taken as number)}`}
              </p>
            </div>
          )}

          {/* Submitted, waiting for promotion */}
          {lvl.hasSubmitted && !lvl.isDisqualified && !lvl.isPromoted && currentLevel < 3 && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 size={32} color="#00e676" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-orbitron), monospace", fontSize: 13, color: "#00e676", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Level {currentLevel} Submitted
              </p>
              {lvlSub && (
                <p style={{ fontSize: 12, color: "#8a9ab0", marginBottom: 6 }}>
                  Time: {formatDuration(lvlSub.time_taken as number)} ·{" "}
                  {lvlSub.is_correct ? (
                    <span style={{ color: "#00e676" }}>Correct</span>
                  ) : (
                    <span style={{ color: "#ff3d3d" }}>Incorrect</span>
                  )}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <Clock size={14} color="#5c6b7a" />
                <span style={{ fontSize: 12, color: "#5c6b7a" }}>Waiting for superuser to announce Level {currentLevel + 1} qualifiers</span>
                <LoadingDots color="green" size="sm" />
              </div>
            </div>
          )}

          {/* All done - Level 3 submitted */}
          {lvl.hasSubmitted && !lvl.isDisqualified && currentLevel === 3 && (
            <div style={{ textAlign: "center" }}>
              <Trophy size={32} color="#ffd600" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-orbitron), monospace", fontSize: 13, color: "#ffd600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Competition Complete!
              </p>
              <p style={{ fontSize: 12, color: "#5c6b7a" }}>All 3 levels submitted. Awaiting final results.</p>
            </div>
          )}

          {/* Exam not yet active */}
          {!lvl.hasSubmitted && !lvl.isActive && (lvl.isQualified || lvl.isPromoted || currentLevel === 1) && (
            <div style={{ textAlign: "center" }}>
              <Clock size={28} color="#5c6b7a" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-orbitron), monospace", fontSize: 13, color: "#8a9ab0", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Level {currentLevel} — Standby
              </p>
              <p style={{ fontSize: 12, color: "#5c6b7a", marginBottom: 12 }}>
                Waiting for the superuser to activate the exam.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <LoadingDots color="green" size="sm" />
              </div>
            </div>
          )}

          {/* Ready to start exam */}
          {!lvl.hasSubmitted && lvl.isActive && (lvl.isQualified || lvl.isPromoted || currentLevel === 1) && (
            <div style={{ textAlign: "center" }}>
              <Zap size={28} color="#00e676" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-orbitron), monospace", fontSize: 13, color: "#00e676", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Level {currentLevel} is Live!
              </p>
              <p style={{ fontSize: 12, color: "#5c6b7a", marginBottom: 16 }}>
                Time limit: {Math.floor(lvl.timeLimit / 60)} minutes. Read carefully before you begin.
              </p>
              <button
                onClick={() => handleStartExam(currentLevel)}
                className="animate-pulse-green"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "13px 28px",
                  backgroundColor: "#00e676",
                  color: "#06080d",
                  border: "none",
                  borderRadius: 3,
                  fontFamily: "var(--font-orbitron), Orbitron, monospace",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#00ff8a")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#00e676")}
              >
                <Zap size={15} /> Start Exam — Level {currentLevel}
              </button>
            </div>
          )}

          {/* Not qualified for next level */}
          {!lvl.isQualified && !lvl.isPromoted && currentLevel > 1 && !lvl.hasSubmitted && (
            <div style={{ textAlign: "center" }}>
              <AlertTriangle size={28} color="#ffd600" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "var(--font-orbitron), monospace", fontSize: 13, color: "#ffd600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                Not Qualified
              </p>
              <p style={{ fontSize: 12, color: "#5c6b7a" }}>
                Your team was not selected to advance to Level {currentLevel}.
              </p>
            </div>
          )}
        </div>

        {/* Members list */}
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            backgroundColor: "#0d1219",
            border: "1px solid #1a2535",
            borderRadius: 3,
          }}
        >
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5c6b7a", marginBottom: 10 }}>
            Team Members ({teamStatus.members.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {teamStatus.members.map((m, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#8a9ab0" }}
              >
                <span style={{ color: "#00e676", fontWeight: 600, minWidth: 16 }}>{i + 1}.</span>
                <span style={{ color: "#dde4ee" }}>{m.name as string}</span>
                <span style={{ color: "#5c6b7a" }}>·</span>
                <span>{m.department as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading stored team
  if (teamId && !teamStatus) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <LoadingSpinner size="md" label="Loading team status..." />
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div className="animate-slide-up" style={{ width: "100%", maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "var(--font-orbitron), Orbitron, monospace",
            fontSize: 13,
            fontWeight: 700,
            color: "#00e676",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Team Registration
        </p>
        <p style={{ fontSize: 12, color: "#5c6b7a" }}>
          Register your team to receive a unique Team ID. 3–4 members required.
        </p>
      </div>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {members.map((member, idx) => (
          <div
            key={idx}
            className="animate-fade-in"
            style={{
              padding: "16px",
              backgroundColor: "#0d1219",
              border: "1px solid #1a2535",
              borderRadius: 3,
              position: "relative",
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#00e676",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Users size={12} /> Member {idx + 1}
              {idx === 0 && <span style={{ color: "#5c6b7a", fontSize: 10 }}>(Team Lead)</span>}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#5c6b7a", marginBottom: 5, letterSpacing: "0.08em" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(idx, "name", e.target.value)}
                  placeholder="e.g. Arjun Sharma"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1a2535")}
                  disabled={loading}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#5c6b7a", marginBottom: 5, letterSpacing: "0.08em" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => updateMember(idx, "email", e.target.value)}
                  placeholder="name@college.edu"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1a2535")}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "#5c6b7a", marginBottom: 5, letterSpacing: "0.08em" }}>
                Department *
              </label>
              <select
                value={member.department}
                onChange={(e) => updateMember(idx, "department", e.target.value)}
                style={{
                  ...inputStyle,
                  width: "100%",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%235c6b7a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: 30,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1a2535")}
                disabled={loading}
              >
                <option value="" style={{ background: "#0d1219" }}>Select department…</option>
                {DEPT_OPTIONS.map((d) => (
                  <option key={d} value={d} style={{ background: "#0d1219" }}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {/* Add/remove member */}
        <div style={{ display: "flex", gap: 8 }}>
          {members.length < 4 && (
            <button
              type="button"
              onClick={addMember}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px",
                backgroundColor: "transparent",
                border: "1px dashed #243245",
                borderRadius: 3,
                color: "#5c6b7a",
                fontSize: 12,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; e.currentTarget.style.color = "#00e676"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243245"; e.currentTarget.style.color = "#5c6b7a"; }}
            >
              <Plus size={14} /> Add Member ({members.length}/4)
            </button>
          )}
          {members.length > 3 && (
            <button
              type="button"
              onClick={removeMember}
              style={{
                padding: "9px 14px",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,61,61,0.3)",
                borderRadius: 3,
                color: "#ff3d3d",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,61,61,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Minus size={14} /> Remove
            </button>
          )}
        </div>

        {error && (
          <div
            className="animate-slide-down"
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(255,61,61,0.08)",
              border: "1px solid rgba(255,61,61,0.3)",
              borderRadius: 3,
              color: "#ff3d3d",
              fontSize: 12,
            }}
          >
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "13px 20px",
            backgroundColor: loading ? "rgba(0,230,118,0.1)" : "#00e676",
            color: loading ? "#00e676" : "#06080d",
            border: "1px solid #00e676",
            borderRadius: 3,
            fontFamily: "var(--font-orbitron), Orbitron, monospace",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#00ff8a"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#00e676"; }}
        >
          {loading ? (
            <>Registering <LoadingDots color="green" size="sm" /></>
          ) : (
            <>Register Team <span style={{ fontSize: 14 }}>→</span></>
          )}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  backgroundColor: "#111922",
  border: "1px solid #1a2535",
  borderRadius: 3,
  color: "#dde4ee",
  fontSize: 13,
  fontFamily: "var(--font-jetbrains), monospace",
};
