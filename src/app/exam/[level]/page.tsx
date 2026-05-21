"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import CodeEditor from "@/components/exam/CodeEditor";
import Timer from "@/components/exam/Timer";
import SecurityWrapper from "@/components/exam/SecurityWrapper";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LoadingDots from "@/components/ui/LoadingDots";
import Badge from "@/components/ui/Badge";
import Popup from "@/components/ui/Popup";
import { Send, AlertTriangle, Code2 } from "lucide-react";
import type { Language } from "@/types";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const level = parseInt(params.level as string);

  const [teamId, setTeamId] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState(600);
  const [question, setQuestion] = useState<string>("");
  const [questions, setQuestions] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>("c");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [securityActive, setSecurityActive] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const codeRef = useRef(code);
  const elapsedRef = useRef(0);

  // Keep refs current
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // Tick elapsed time every second
  useEffect(() => {
    if (!securityActive) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [securityActive]);

  // On mount: validate team, level, and load question
  useEffect(() => {
    const init = async () => {
      const storedId = sessionStorage.getItem("ptb_team_id");
      if (!storedId) {
        router.replace("/");
        return;
      }
      setTeamId(storedId);

      if (isNaN(level) || level < 1 || level > 3) {
        router.replace("/");
        return;
      }

      // Check exam status
      const statusRes = await fetch(
        `/api/exam/status?teamId=${storedId}&level=${level}`
      );
      if (!statusRes.ok) {
        setError("Failed to check exam status.");
        setLoading(false);
        return;
      }
      const status = await statusRes.json();

      if (status.hasSubmitted) {
        // Already submitted — go to result. Append &dq=1 when the submission
        // was a disqualification (e.g. page reload) so the result page renders
        // the correct status instead of falling back to "Incorrect".
        router.replace(
          `/exam/result?level=${level}${status.isDisqualified ? "&dq=1" : ""}`
        );
        return;
      }

      if (!status.isActive) {
        setError("This exam is not currently active.");
        setLoading(false);
        return;
      }

      if (!status.isQualified) {
        setError("Your team is not qualified for this level.");
        setLoading(false);
        return;
      }

      setTimeLimit(status.timeLimit);

      // Fetch questions via the public endpoint
      const qRes = await fetch(`/api/exam/questions?level=${level}`);
      if (qRes.ok) {
        const qData = await qRes.json();
        if (level === 1) {
          const questionsData: Record<string, string> = {};
          for (const q of qData.questions as Array<{ language: string; content: string }>) {
            questionsData[q.language] = q.content;
          }
          setQuestions(questionsData);
          setQuestion(questionsData["c"] || "");
          setLanguage("c");
        } else {
          const general = (qData.questions as Array<{ language: string; content: string }>).find(
            (q) => q.language === "general"
          );
          setQuestion(general?.content || "");
        }
      }

      setLoading(false);
      setSecurityActive(true);
      startTimeRef.current = Date.now();
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // When language changes in Level 1, update displayed question
  useEffect(() => {
    if (level === 1) {
      setQuestion(questions[language] || "");
    }
  }, [language, questions, level]);

  const doSubmit = useCallback(
    async (isTimeout = false, isDisqualified = false) => {
      if (!teamId) return;
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

      setSubmitting(true);
      setSecurityActive(false);

      if (isDisqualified) {
        // SecurityWrapper already called disqualify API
        sessionStorage.setItem("ptb_last_result", JSON.stringify({
          level,
          time_taken: timeTaken,
          is_correct: false,
          is_disqualified: true,
        }));
        router.push(`/exam/result?level=${level}&dq=1`);
        return;
      }

      try {
        const res = await fetch("/api/exam/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            level,
            language,
            code: codeRef.current,
            timeTaken,
          }),
        });

        const data = await res.json();

        sessionStorage.setItem(
          "ptb_last_result",
          JSON.stringify({
            level,
            time_taken: timeTaken,
            is_correct: data.is_correct || false,
            is_disqualified: false,
            gemini_response: data.gemini_response || "",
            timeout: isTimeout,
          })
        );

        router.push(`/exam/result?level=${level}`);
      } catch {
        setError("Submission failed. Please contact the invigilator.");
        setSubmitting(false);
        setSecurityActive(true);
      }
    },
    [teamId, level, language, router]
  );

  const handleDisqualify = useCallback(() => {
    doSubmit(false, true);
  }, [doSubmit]);

  const handleTimeout = useCallback(() => {
    doSubmit(true, false);
  }, [doSubmit]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          backgroundColor: "#06080d",
        }}
      >
        <Logo size="md" />
        <LoadingSpinner size="lg" label="Preparing exam…" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          backgroundColor: "#06080d",
        }}
      >
        <Logo size="md" />
        <div
          style={{
            maxWidth: 460,
            padding: "24px",
            backgroundColor: "#0d1219",
            border: "1px solid rgba(255,61,61,0.3)",
            borderTop: "3px solid #ff3d3d",
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <AlertTriangle size={32} color="#ff3d3d" style={{ marginBottom: 14 }} />
          <p
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 700,
              fontSize: 13,
              color: "#ff3d3d",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Access Denied
          </p>
          <p style={{ fontSize: 13, color: "#8a9ab0", marginBottom: 20 }}>{error}</p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              border: "1px solid #243245",
              borderRadius: 3,
              color: "#8a9ab0",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-jetbrains), monospace",
            }}
          >
            ← Return to Home
          </button>
        </div>
      </div>
    );
  }

  const availableLangs: Language[] =
    level === 1 ? ["c", "javascript", "python", "java"] : ["c", "javascript", "python", "java"];

  return (
    <SecurityWrapper
      teamId={teamId || ""}
      level={level}
      timeTaken={elapsed}
      onDisqualify={handleDisqualify}
      active={securityActive}
    >
      {/* Submission confirmation popup */}
      <Popup
        isOpen={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        title="Submit Answer"
        variant="success"
        closable
        actions={
          <>
            <button
              onClick={() => setConfirmSubmit(false)}
              style={{
                padding: "8px 16px",
                background: "transparent",
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
              onClick={() => { setConfirmSubmit(false); doSubmit(); }}
              style={{
                padding: "8px 20px",
                backgroundColor: "#00e676",
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
              Submit Now
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          Are you sure you want to submit? This action is{" "}
          <strong style={{ color: "#ff3d3d" }}>irreversible</strong>. Your current code in{" "}
          <strong style={{ color: "#00e676" }}>
            {language.toUpperCase()}
          </strong>{" "}
          will be evaluated by Gemini.
        </p>
      </Popup>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#06080d",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: "1px solid #1a2535",
            backgroundColor: "rgba(6,8,13,0.95)",
            backdropFilter: "blur(6px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <Logo size="sm" />

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                backgroundColor: "#111922",
                border: "1px solid #1a2535",
                borderRadius: 3,
              }}
            >
              <Code2 size={12} color="#5c6b7a" />
              <span
                style={{
                  fontFamily: "var(--font-orbitron), Orbitron, monospace",
                  fontSize: 12,
                  color: "#00e676",
                  letterSpacing: "0.2em",
                  fontWeight: 700,
                }}
              >
                {teamId}
              </span>
            </div>

            <Badge variant="active" pulse>
              Level {level} — Live
            </Badge>

            <Timer
              initialSeconds={timeLimit}
              onTimeout={handleTimeout}
              onTick={(r) => setElapsed(timeLimit - r)}
            />
          </div>
        </header>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            overflow: "hidden",
          }}
        >
          {/* Split layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: level === 1 ? "1fr 1fr" : "2fr 3fr",
              flex: 1,
              minHeight: 0,
              height: "calc(100vh - 70px)",
            }}
          >
            {/* Left panel: Question */}
            <div
              style={{
                borderRight: "1px solid #1a2535",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #1a2535",
                  backgroundColor: "#111922",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#5c6b7a",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  {level === 1 ? "Buggy Code" : "Problem Statement"}
                </span>
                {level === 1 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "#ffd600",
                      padding: "2px 8px",
                      border: "1px solid rgba(255,214,0,0.3)",
                      borderRadius: 2,
                      letterSpacing: "0.08em",
                    }}
                  >
                    Find & fix ALL bugs
                  </span>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: 0,
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    padding: "20px",
                    fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: "#dde4ee",
                    whiteSpace: "pre",
                    minHeight: "100%",
                    backgroundColor: "transparent",
                  }}
                >
                  {question || (
                    <span style={{ color: "#5c6b7a", fontStyle: "italic" }}>
                      No question set for this level yet. Please contact the invigilator.
                    </span>
                  )}
                </pre>
              </div>
            </div>

            {/* Right panel: Code Editor */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Editor toolbar note */}
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid #1a2535",
                  backgroundColor: "#111922",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#5c6b7a",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  {level === 1 ? "Write Corrected Code" : "Write Your Solution"}
                </span>
                {level !== 1 && (
                  <span style={{ fontSize: 11, color: "#5c6b7a" }}>
                    Switching language will clear your code
                  </span>
                )}
              </div>

              {/* Code editor */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  onLanguageChange={(l) => setLanguage(l)}
                  showLanguageSelector={true}
                  availableLanguages={availableLangs}
                  height="100%"
                />
              </div>

              {/* Submit bar */}
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid #1a2535",
                  backgroundColor: "#111922",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: 12, color: "#5c6b7a" }}>
                  {code.trim()
                    ? `${code.split("\n").length} lines written`
                    : "No code written yet"}
                </div>

                <button
                  onClick={() => setConfirmSubmit(true)}
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 24px",
                    backgroundColor: submitting ? "rgba(0,230,118,0.1)" : "#00e676",
                    color: submitting ? "#00e676" : "#06080d",
                    border: "1px solid #00e676",
                    borderRadius: 3,
                    fontFamily: "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#00ff8a"; }}
                  onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#00e676"; }}
                >
                  {submitting ? (
                    <>Evaluating with AI <LoadingDots color="green" size="sm" /></>
                  ) : (
                    <><Send size={14} /> Submit Answer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SecurityWrapper>
  );
}