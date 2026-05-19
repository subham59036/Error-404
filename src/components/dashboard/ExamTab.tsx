"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LoadingDots from "@/components/ui/LoadingDots";
import Badge from "@/components/ui/Badge";
import Popup from "@/components/ui/Popup";
import { Zap, ZapOff, Clock, RefreshCw, ShieldCheck } from "lucide-react";

interface ExamTabProps {
  token: string;
}

interface ExamSetting {
  level: number;
  is_active: number;
  time_limit: number;
  updated_at: number;
}

const LEVEL_INFO = [
  {
    level: 1,
    title: "Level 1 — Debug the Code",
    description: "Teams fix buggy code in their chosen language. Gemini evaluates correctness.",
  },
  {
    level: 2,
    title: "Level 2 — Problem Solving",
    description: "Promoted teams solve a problem statement in any language of their choice.",
  },
  {
    level: 3,
    title: "Level 3 — Advanced Problem",
    description: "Final round for top performers. Hardest problem, highest stakes.",
  },
];

export default function ExamTab({ token }: ExamTabProps) {
  const [settings, setSettings] = useState<ExamSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLimits, setTimeLimits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [popup, setPopup] = useState<{
    open: boolean;
    message: string;
    variant: "success" | "danger" | "warning";
    title: string;
  } | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{
    open: boolean;
    level: number;
    activate: boolean;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/exam-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const s: ExamSetting[] = data.settings || [];
        setSettings(s);
        const limits: Record<number, string> = {};
        s.forEach((item) => {
          limits[item.level] = String(Math.floor(item.time_limit / 60));
        });
        setTimeLimits(limits);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(() => fetchSettings(), 10000);
    return () => clearInterval(interval);
  }, [fetchSettings]);

  const handleSaveTime = async (level: number) => {
    const mins = parseInt(timeLimits[level] || "10");
    if (isNaN(mins) || mins < 1 || mins > 120) {
      setPopup({
        open: true,
        title: "Invalid Duration",
        message: "Time limit must be between 1 and 120 minutes.",
        variant: "danger",
      });
      return;
    }

    setSaving(level);
    try {
      const current = settings.find((s) => s.level === level);
      const res = await fetch("/api/admin/exam-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level,
          isActive: current?.is_active === 1,
          timeLimit: mins * 60,
        }),
      });
      if (res.ok) {
        await fetchSettings();
        setPopup({
          open: true,
          title: "Saved",
          message: `Level ${level} time limit set to ${mins} minute${mins !== 1 ? "s" : ""}.`,
          variant: "success",
        });
      } else {
        setPopup({ open: true, title: "Error", message: "Failed to save.", variant: "danger" });
      }
    } catch {
      setPopup({ open: true, title: "Error", message: "Network error.", variant: "danger" });
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (level: number, activate: boolean) => {
    setConfirmToggle({ open: true, level, activate });
  };

  const confirmToggleAction = async () => {
    if (!confirmToggle) return;
    const { level, activate } = confirmToggle;
    setConfirmToggle(null);
    setToggling(level);

    try {
      const current = settings.find((s) => s.level === level);
      const res = await fetch("/api/admin/exam-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level,
          isActive: activate,
          timeLimit: current?.time_limit || 600,
        }),
      });

      if (res.ok) {
        await fetchSettings();
        setPopup({
          open: true,
          title: activate ? "Exam Activated" : "Exam Deactivated",
          message: activate
            ? `Level ${level} is now LIVE. Teams can start the exam.`
            : `Level ${level} has been deactivated. No new submissions will be accepted.`,
          variant: activate ? "success" : "warning",
        });
      } else {
        setPopup({ open: true, title: "Error", message: "Failed to update.", variant: "danger" });
      }
    } catch {
      setPopup({ open: true, title: "Error", message: "Network error.", variant: "danger" });
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <LoadingSpinner size="md" label="Loading exam settings…" />
      </div>
    );
  }

  const getSettingForLevel = (level: number): ExamSetting | null =>
    settings.find((s) => s.level === level) || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Confirmation popup */}
      <Popup
        isOpen={!!confirmToggle?.open}
        onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.activate ? "Activate Exam" : "Deactivate Exam"}
        variant={confirmToggle?.activate ? "success" : "warning"}
        closable
        actions={
          <>
            <button
              onClick={() => setConfirmToggle(null)}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #1a2535",
                borderRadius: 3,
                color: "#5c6b7a",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-jetbrains), monospace",
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmToggleAction}
              style={{
                padding: "8px 20px",
                backgroundColor: confirmToggle?.activate ? "#00e676" : "#ffd600",
                border: "none",
                borderRadius: 3,
                color: "#06080d",
                fontSize: 12,
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              {confirmToggle?.activate ? "Yes, Activate" : "Yes, Deactivate"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          {confirmToggle?.activate
            ? `This will make Level ${confirmToggle?.level} live for all qualified teams. They will be able to start the exam immediately.`
            : `This will close Level ${confirmToggle?.level}. Teams currently in the exam will still be able to submit.`}
        </p>
      </Popup>

      {/* Status/result popup */}
      <Popup
        isOpen={!!popup?.open}
        onClose={() => setPopup(null)}
        title={popup?.title || ""}
        variant={popup?.variant}
      >
        <p style={{ fontSize: 13 }}>{popup?.message}</p>
      </Popup>

      {/* Overall status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "#111922",
          border: "1px solid #1a2535",
          borderRadius: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={15} color="#5c6b7a" />
          <span style={{ fontSize: 12, color: "#5c6b7a" }}>
            Exam Control Panel — Changes take effect immediately
          </span>
        </div>
        <button
          onClick={fetchSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: "transparent",
            border: "1px solid #1a2535",
            borderRadius: 3,
            color: "#5c6b7a",
            fontSize: 11,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#dde4ee"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#5c6b7a"; }}
        >
          <RefreshCw size={11} />
          Refresh
        </button>
      </div>

      {/* Level cards */}
      {LEVEL_INFO.map(({ level, title, description }) => {
        const setting = getSettingForLevel(level);
        const isActive = setting?.is_active === 1;
        const isToggling = toggling === level;
        const isSaving = saving === level;
        const timeMins = timeLimits[level] || "10";

        return (
          <div
            key={level}
            style={{
              border: `1px solid ${isActive ? "rgba(0,230,118,0.35)" : "#1a2535"}`,
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: isActive ? "rgba(0,230,118,0.03)" : "#0d1219",
            }}
            className={isActive ? "animate-pulse-green" : ""}
          >
            {/* Level header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                backgroundColor: isActive ? "rgba(0,230,118,0.06)" : "#111922",
                borderBottom: "1px solid #1a2535",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    color: isActive ? "#00e676" : "#dde4ee",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: 11, color: "#5c6b7a" }}>{description}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <Badge variant={isActive ? "active" : "inactive"} pulse={isActive}>
                  {isActive ? "LIVE" : "INACTIVE"}
                </Badge>

                {setting?.updated_at && (
                  <span style={{ fontSize: 10, color: "#5c6b7a" }}>
                    Updated {new Date(setting.updated_at).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "flex-end",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              {/* Time limit control */}
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    color: "#5c6b7a",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  <Clock size={11} /> Time Limit (minutes)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={timeMins}
                    onChange={(e) =>
                      setTimeLimits((p) => ({ ...p, [level]: e.target.value }))
                    }
                    style={{
                      width: 90,
                      padding: "9px 12px",
                      backgroundColor: "#111922",
                      border: "1px solid #1a2535",
                      borderRadius: 3,
                      color: "#dde4ee",
                      fontSize: 16,
                      fontFamily: "var(--font-orbitron), Orbitron, monospace",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#1a2535")}
                  />
                  <button
                    onClick={() => handleSaveTime(level)}
                    disabled={isSaving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 14px",
                      backgroundColor: "transparent",
                      border: "1px solid #243245",
                      borderRadius: 3,
                      color: "#8a9ab0",
                      fontSize: 11,
                      fontFamily: "var(--font-orbitron), Orbitron, monospace",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; e.currentTarget.style.color = "#00e676"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#243245"; e.currentTarget.style.color = "#8a9ab0"; }}
                  >
                    {isSaving ? <LoadingDots color="green" size="sm" /> : "Set"}
                  </button>
                </div>
              </div>

              {/* Activate / Deactivate */}
              <div style={{ marginLeft: "auto" }}>
                {isActive ? (
                  <button
                    onClick={() => handleToggle(level, false)}
                    disabled={isToggling}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 22px",
                      backgroundColor: "rgba(255,61,61,0.1)",
                      color: "#ff3d3d",
                      border: "1px solid rgba(255,61,61,0.45)",
                      borderRadius: 3,
                      fontFamily: "var(--font-orbitron), Orbitron, monospace",
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      cursor: isToggling ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,61,61,0.18)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,61,61,0.1)")}
                  >
                    {isToggling ? (
                      <><LoadingDots color="red" size="sm" /> Processing</>
                    ) : (
                      <><ZapOff size={14} /> Deactivate Exam</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggle(level, true)}
                    disabled={isToggling}
                    className={isToggling ? "" : "animate-pulse-green"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 22px",
                      backgroundColor: "#00e676",
                      color: "#06080d",
                      border: "1px solid #00e676",
                      borderRadius: 3,
                      fontFamily: "var(--font-orbitron), Orbitron, monospace",
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      cursor: isToggling ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => { if (!isToggling) e.currentTarget.style.backgroundColor = "#00ff8a"; }}
                    onMouseLeave={(e) => { if (!isToggling) e.currentTarget.style.backgroundColor = "#00e676"; }}
                  >
                    {isToggling ? (
                      <><LoadingDots color="green" size="sm" /> Activating</>
                    ) : (
                      <><Zap size={14} /> Activate Exam</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
