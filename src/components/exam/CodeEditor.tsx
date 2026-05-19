"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LANGUAGES, type Language } from "@/types";

// Dynamic import — Monaco must never SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  showLanguageSelector?: boolean;
  readOnly?: boolean;
  height?: string;
  availableLanguages?: Language[];
}

export default function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  showLanguageSelector = true,
  readOnly = false,
  height = "360px",
  availableLanguages = ["c", "javascript", "python", "java"],
}: CodeEditorProps) {
  const [editorMounted, setEditorMounted] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Remount editor on language change to clear content
  const handleLanguageChange = (lang: Language) => {
    onLanguageChange(lang);
    setEditorKey((k) => k + 1);
    onChange("");
  };

  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monacoLang || "plaintext";

  const editorTheme = {
    base: "vs-dark" as const,
    inherit: true,
    rules: [
      { token: "comment", foreground: "5c6b7a", fontStyle: "italic" },
      { token: "keyword", foreground: "cc99cd" },
      { token: "string", foreground: "7ec8a4" },
      { token: "number", foreground: "ffd600" },
      { token: "type", foreground: "40c4ff" },
    ],
    colors: {
      "editor.background": "#0d1219",
      "editor.foreground": "#dde4ee",
      "editor.lineHighlightBackground": "#111922",
      "editor.selectionBackground": "#00e67630",
      "editorCursor.foreground": "#00e676",
      "editorLineNumber.foreground": "#2a3a4a",
      "editorLineNumber.activeForeground": "#00e676",
      "editor.inactiveSelectionBackground": "#00e67615",
      "editorIndentGuide.background": "#1a2535",
      "editorIndentGuide.activeBackground": "#243245",
      "scrollbarSlider.background": "#1a253580",
      "scrollbarSlider.hoverBackground": "#24324580",
      "editorWidget.background": "#0d1219",
      "editorWidget.border": "#1a2535",
      "input.background": "#111922",
      "input.foreground": "#dde4ee",
      "input.border": "#1a2535",
      "list.hoverBackground": "#111922",
      "list.activeSelectionBackground": "#1a2535",
    },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #1a2535",
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "#0d1219",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          backgroundColor: "#111922",
          borderBottom: "1px solid #1a2535",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#ff3d3d",
              opacity: 0.7,
            }}
          />
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#ffd600",
              opacity: 0.7,
            }}
          />
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#00e676",
              opacity: 0.7,
            }}
          />
          <span
            style={{
              marginLeft: 10,
              fontSize: 11,
              color: "#5c6b7a",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-jetbrains), monospace",
            }}
          >
            {readOnly ? "// question.code — read only" : "// your_solution.code — write here"}
          </span>
        </div>

        {showLanguageSelector && !readOnly && (
          <div style={{ display: "flex", gap: 4 }}>
            {availableLanguages.map((lang) => {
              const l = LANGUAGES.find((x) => x.value === lang)!;
              const isActive = language === lang;
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  style={{
                    padding: "3px 10px",
                    fontSize: 11,
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: "0.06em",
                    backgroundColor: isActive ? "rgba(0,230,118,0.12)" : "transparent",
                    color: isActive ? "#00e676" : "#5c6b7a",
                    border: `1px solid ${isActive ? "rgba(0,230,118,0.4)" : "#1a2535"}`,
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#dde4ee";
                      e.currentTarget.style.borderColor = "#243245";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#5c6b7a";
                      e.currentTarget.style.borderColor = "#1a2535";
                    }
                  }}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        )}

        {readOnly && (
          <span
            style={{
              fontSize: 11,
              color: "#5c6b7a",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {LANGUAGES.find((l) => l.value === language)?.label}
          </span>
        )}
      </div>

      {/* Editor area */}
      <div style={{ position: "relative", height }}>
        {!editorMounted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0d1219",
              zIndex: 10,
            }}
          >
            <LoadingSpinner size="md" label="Loading editor..." />
          </div>
        )}

        <MonacoEditor
          key={editorKey}
          height={height}
          language={monacoLang}
          value={value}
          theme="ptb-dark"
          onChange={(val) => onChange(val || "")}
          options={{
            readOnly,
            fontSize: 14,
            fontFamily: "var(--font-jetbrains), JetBrains Mono, monospace",
            fontLigatures: true,
            lineHeight: 22,
            padding: { top: 14, bottom: 14 },
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 4,
            insertSpaces: true,
            smoothScrolling: true,
            cursorBlinking: "phase",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
            formatOnPaste: false,
            folding: true,
            lineNumbers: "on",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              verticalScrollbarSize: 5,
              horizontalScrollbarSize: 5,
            },
          }}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme("ptb-dark", editorTheme);
          }}
          onMount={() => setEditorMounted(true)}
        />
      </div>
    </div>
  );
}
