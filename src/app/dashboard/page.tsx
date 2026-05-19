"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import QuestionsTab from "@/components/dashboard/QuestionsTab";
import TeamsTab from "@/components/dashboard/TeamsTab";
import AnswersTab from "@/components/dashboard/AnswersTab";
import LeaderboardTab from "@/components/dashboard/LeaderboardTab";
import ExamTab from "@/components/dashboard/ExamTab";
import {
  FileCode2,
  Users,
  FileText,
  Trophy,
  Zap,
  LogOut,
  ShieldAlert,
} from "lucide-react";

type DashboardTab = "questions" | "teams" | "answers" | "leaderboard" | "exam";

const TABS: { key: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { key: "questions", label: "Questions", icon: <FileCode2 size={14} /> },
  { key: "teams", label: "Teams", icon: <Users size={14} /> },
  { key: "answers", label: "Answers", icon: <FileText size={14} /> },
  { key: "leaderboard", label: "Leaderboard", icon: <Trophy size={14} /> },
  { key: "exam", label: "Exam", icon: <Zap size={14} /> },
];

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("exam");
  const [verifying, setVerifying] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Verify the stored token is still valid on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerifying(false);
        setIsAuthed(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setIsAuthed(data.valid === true);
      } catch {
        setIsAuthed(false);
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [token]);

  // Periodically re-verify the token to keep session fresh (every 30s)
  useEffect(() => {
    if (!isAuthed || !token) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.valid) {
          setIsAuthed(false);
        }
      } catch {
        // network hiccup — don't log out aggressively
      }
    }, 30000);
    return () => clearInterval(id);
  }, [isAuthed, token]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await logout();
    router.push("/");
  }, [logout, router]);

  // ── Loading state ──
  if (verifying) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#06080d",
        }}
      >
        <Logo size="md" />
        <LoadingSpinner size="lg" label="Verifying session…" />
      </div>
    );
  }

  // ── Not authenticated ──
  if (!isAuthed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: 24,
          backgroundColor: "#06080d",
        }}
        className="bg-grid"
      >
        <Logo size="lg" />
        <div
          style={{
            maxWidth: 440,
            padding: "28px 32px",
            backgroundColor: "#0d1219",
            border: "1px solid rgba(255,61,61,0.3)",
            borderTop: "3px solid #ff3d3d",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <ShieldAlert size={36} color="#ff3d3d" style={{ marginBottom: 14 }} />
          <p
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 700,
              fontSize: 14,
              color: "#ff3d3d",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Access Restricted
          </p>
          <p style={{ fontSize: 13, color: "#8a9ab0", lineHeight: 1.7, marginBottom: 22 }}>
            No active superuser session found. The dashboard requires authentication.
            Please log in from the main portal.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 22px",
              backgroundColor: "#00e676",
              color: "#06080d",
              border: "none",
              borderRadius: 3,
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#06080d" }}>
      {/* Top navigation */}
      <header
        style={{
          borderBottom: "1px solid #1a2535",
          backgroundColor: "rgba(6,8,13,0.95)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "13px 0" }}>
            <Logo size="sm" />
            <div
              style={{
                height: 24,
                width: 1,
                backgroundColor: "#1a2535",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#5c6b7a",
              }}
            >
              Superuser Dashboard
            </span>
          </div>

          {/* Tab bar (center) */}
          <nav style={{ display: "flex", gap: 2, height: "100%" }}>
            {TABS.map(({ key, label, icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 18px",
                    height: 56,
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? "2px solid #00e676" : "2px solid transparent",
                    color: isActive ? "#00e676" : "#5c6b7a",
                    fontFamily:
                      "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "color 0.15s, border-color 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#dde4ee"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#5c6b7a"; }}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              backgroundColor: "transparent",
              border: "1px solid rgba(255,61,61,0.3)",
              borderRadius: 3,
              color: "#ff3d3d",
              fontSize: 11,
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loggingOut ? "not-allowed" : "pointer",
              opacity: loggingOut ? 0.6 : 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,61,61,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={13} />
            {loggingOut ? "…" : "Logout"}
          </button>
        </div>
      </header>

      {/* Page content */}
      <main
        style={{
          flex: 1,
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Tab heading */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 800,
              fontSize: 16,
              color: "#dde4ee",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {TABS.find((t) => t.key === activeTab)?.label}
          </h1>
          <div
            style={{
              height: 1,
              backgroundColor: "#1a2535",
              marginTop: 16,
            }}
          />
        </div>

        {/* Tab content */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "questions" && <QuestionsTab token={token!} />}
          {activeTab === "teams" && <TeamsTab token={token!} />}
          {activeTab === "answers" && <AnswersTab token={token!} />}
          {activeTab === "leaderboard" && <LeaderboardTab token={token!} />}
          {activeTab === "exam" && <ExamTab token={token!} />}
        </div>
      </main>
    </div>
  );
}
