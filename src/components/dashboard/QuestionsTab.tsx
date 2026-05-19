"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LoadingDots from "@/components/ui/LoadingDots";
import Popup from "@/components/ui/Popup";
import { Save, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface QuestionsTabProps {
  token: string;
}

interface QuestionData {
  level: number;
  language: string;
  content: string;
}

const LEVEL_CONFIGS = [
  {
    level: 1,
    label: "Level 1 — Debug the Code",
    description: "Provide buggy code (with logic and syntax errors) for each language. Teams will pick one language and fix it.",
    languages: [
      { value: "c", label: "C", monacoLang: "c" },
      { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
      { value: "python", label: "Python", monacoLang: "python" },
      { value: "java", label: "Java", monacoLang: "java" },
    ],
  },
  {
    level: 2,
    label: "Level 2 — Problem Solving",
    description: "Write a problem statement. Teams will solve it in their preferred language.",
    languages: [{ value: "general", label: "Problem Statement", monacoLang: "markdown" }],
  },
  {
    level: 3,
    label: "Level 3 — Advanced Problem",
    description: "Write a harder problem statement. Teams will solve it in their preferred language.",
    languages: [{ value: "general", label: "Problem Statement", monacoLang: "markdown" }],
  },
];

export default function QuestionsTab({ token }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<Record<string, string>>({});
  const [originalQuestions, setOriginalQuestions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ open: boolean; message: string; variant: "success" | "danger" } | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: false });
  const [editorMounted, setEditorMounted] = useState<Record<string, boolean>>({});

  const makeKey = (level: number, lang: string) => `${level}:${lang}`;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/admin/questions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          for (const q of data.questions) {
            map[makeKey(q.level, q.language)] = q.content;
          }
          setQuestions(map);
          setOriginalQuestions(map);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [token]);

  const handleSave = async (level: number, lang: string) => {
    const key = makeKey(level, lang);
    setSaving(key);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level, language: lang, content: questions[key] || "" }),
      });
      if (res.ok) {
        setOriginalQuestions((p) => ({ ...p, [key]: questions[key] || "" }));
        setPopup({ open: true, message: "Question saved successfully.", variant: "success" });
      } else {
        setPopup({ open: true, message: "Failed to save question. Please try again.", variant: "danger" });
      }
    } catch {
      setPopup({ open: true, message: "Network error. Please try again.", variant: "danger" });
    } finally {
      setSaving(null);
    }
  };

  const hasChanges = (level: number, lang: string) => {
    const key = makeKey(level, lang);
    return questions[key] !== originalQuestions[key];
  };

  const editorTheme = {
    base: "vs-dark" as const,
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0d1219",
      "editor.foreground": "#dde4ee",
      "editor.lineHighlightBackground": "#111922",
      "editor.selectionBackground": "#00e67630",
      "editorCursor.foreground": "#00e676",
      "editorLineNumber.foreground": "#2a3a4a",
      "editorLineNumber.activeForeground": "#00e676",
    },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <LoadingSpinner size="md" label="Loading questions…" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Popup
        isOpen={!!popup?.open}
        onClose={() => setPopup(null)}
        title={popup?.variant === "success" ? "Saved" : "Error"}
        variant={popup?.variant}
      >
        <p style={{ fontSize: 13 }}>{popup?.message}</p>
      </Popup>

      {LEVEL_CONFIGS.map((levelConfig) => (
        <div
          key={levelConfig.level}
          style={{
            border: "1px solid #1a2535",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* Level header */}
          <button
            onClick={() => setExpanded((p) => ({ ...p, [levelConfig.level]: !p[levelConfig.level] }))}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              backgroundColor: "#111922",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-orbitron), Orbitron, monospace",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#00e676",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 3,
                }}
              >
                {levelConfig.label}
              </p>
              <p style={{ fontSize: 11, color: "#5c6b7a" }}>{levelConfig.description}</p>
            </div>
            <span style={{ color: "#5c6b7a", flexShrink: 0 }}>
              {expanded[levelConfig.level] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {expanded[levelConfig.level] && (
            <div
              className="animate-slide-down"
              style={{ borderTop: "1px solid #1a2535" }}
            >
              {levelConfig.languages.map((lang, langIdx) => {
                const key = makeKey(levelConfig.level, lang.value);
                const isSaving = saving === key;
                const changed = hasChanges(levelConfig.level, lang.value);
                const isMonted = editorMounted[key];

                return (
                  <div
                    key={lang.value}
                    style={{
                      padding: "20px",
                      borderTop: langIdx > 0 ? "1px solid #1a2535" : "none",
                    }}
                  >
                    {/* Language sub-header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            padding: "2px 10px",
                            backgroundColor: "rgba(0,230,118,0.08)",
                            border: "1px solid rgba(0,230,118,0.2)",
                            borderRadius: 2,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#00e676",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          {lang.label}
                        </span>
                        {changed && (
                          <span style={{ fontSize: 11, color: "#ffd600", display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertCircle size={11} /> Unsaved changes
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleSave(levelConfig.level, lang.value)}
                        disabled={isSaving || !changed}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "7px 16px",
                          backgroundColor: changed ? "#00e676" : "transparent",
                          color: changed ? "#06080d" : "#5c6b7a",
                          border: `1px solid ${changed ? "#00e676" : "#1a2535"}`,
                          borderRadius: 3,
                          fontSize: 11,
                          fontFamily: "var(--font-orbitron), Orbitron, monospace",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          cursor: changed && !isSaving ? "pointer" : "not-allowed",
                        }}
                        onMouseEnter={(e) => { if (changed && !isSaving) e.currentTarget.style.backgroundColor = "#00ff8a"; }}
                        onMouseLeave={(e) => { if (changed && !isSaving) e.currentTarget.style.backgroundColor = "#00e676"; }}
                      >
                        {isSaving ? (
                          <><LoadingDots color="green" size="sm" /> Saving</>
                        ) : (
                          <><Save size={12} /> Save</>
                        )}
                      </button>
                    </div>

                    {/* Monaco Editor */}
                    <div
                      style={{
                        border: "1px solid #1a2535",
                        borderRadius: 3,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {!isMonted && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#0d1219",
                            zIndex: 5,
                          }}
                        >
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                      <MonacoEditor
                        height="280px"
                        language={lang.monacoLang}
                        value={questions[key] || ""}
                        theme="ptb-dark"
                        onChange={(val) =>
                          setQuestions((p) => ({ ...p, [key]: val || "" }))
                        }
                        options={{
                          fontSize: 13,
                          fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
                          fontLigatures: true,
                          lineHeight: 20,
                          padding: { top: 12, bottom: 12 },
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: "on",
                          tabSize: 4,
                          renderLineHighlight: "line",
                          scrollbar: { verticalScrollbarSize: 5 },
                        }}
                        beforeMount={(monaco) => {
                          if (!monaco.editor.getModel(monaco.Uri.parse(`ptb-dark`))) {
                            monaco.editor.defineTheme("ptb-dark", editorTheme);
                          }
                        }}
                        onMount={() =>
                          setEditorMounted((p) => ({ ...p, [key]: true }))
                        }
                      />
                    </div>
                    <p style={{ fontSize: 10, color: "#5c6b7a", marginTop: 6 }}>
                      {levelConfig.level === 1
                        ? "Write the buggy code here. Include both logic and syntax errors."
                        : "Write the problem statement clearly. Gemini will evaluate submissions against this."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
