"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Popup from "@/components/ui/Popup";
import { AlertTriangle } from "lucide-react";

interface SecurityWrapperProps {
  teamId: string;
  level: number;
  timeTaken: number;
  onDisqualify: () => void;
  children: React.ReactNode;
  active?: boolean;
}

export default function SecurityWrapper({
  teamId,
  level,
  timeTaken,
  onDisqualify,
  children,
  active = true,
}: SecurityWrapperProps) {
  const [isDisqualifying, setIsDisqualifying] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const disqualifiedRef = useRef(false);
  const timeTakenRef = useRef(timeTaken);
  const onDisqualifyRef = useRef(onDisqualify);

  // Keep refs current
  useEffect(() => { timeTakenRef.current = timeTaken; }, [timeTaken]);
  useEffect(() => { onDisqualifyRef.current = onDisqualify; }, [onDisqualify]);

  const triggerDisqualify = useCallback(async (reason: string) => {
    if (!active) return;
    if (disqualifiedRef.current) return;
    disqualifiedRef.current = true;
    setIsDisqualifying(true);

    console.warn(`[Security] Disqualification triggered: ${reason}`);

    try {
      await fetch("/api/exam/disqualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          level,
          timeTaken: timeTakenRef.current,
        }),
      });
    } catch {
      // Best effort — always disqualify even if API fails
    }

    onDisqualifyRef.current();
  }, [active, teamId, level]);

  useEffect(() => {
    if (!active) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerDisqualify("Tab hidden / window minimised");
      }
    };

    const handleWindowBlur = () => {
      // Small debounce: browser can briefly blur during interactions
      setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          triggerDisqualify("Window lost focus (another app / split screen)");
        }
      }, 150);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Disable right-click in exam
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common cheat shortcuts
      const blocked = [
        e.key === "F12",
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I",
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J",
        (e.ctrlKey || e.metaKey) && e.key === "u",
        (e.altKey && e.key === "Tab"),
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Fires on F5 / Ctrl-R / browser refresh button.
    // sendBeacon is used because a regular fetch is cancelled by the browser
    // before it can complete during a page unload. Next.js client-side
    // navigation (router.push) does NOT trigger beforeunload, so legitimate
    // submission redirects are never caught here.
    const handleBeforeUnload = () => {
      if (disqualifiedRef.current) return;
      disqualifiedRef.current = true;
      const payload = new Blob(
        [JSON.stringify({ teamId, level, timeTaken: timeTakenRef.current })],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/exam/disqualify", payload);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [active, triggerDisqualify]);

  return (
    <>
      {isDisqualifying && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            backgroundColor: "rgba(6,8,13,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <AlertTriangle size={52} color="#ffd600" className="animate-pulse-yellow" />
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-orbitron), Orbitron, monospace",
                fontSize: 18,
                fontWeight: 800,
                color: "#ffd600",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Disqualified
            </p>
            <p style={{ fontSize: 13, color: "#8a9ab0", maxWidth: 360, textAlign: "center", lineHeight: 1.7 }}>
              Tab switch, window minimise, or focus loss detected.
              <br />
              Your exam has been automatically terminated.
            </p>
          </div>
          <div
            style={{
              padding: "8px 20px",
              border: "1px solid rgba(255,214,0,0.3)",
              backgroundColor: "rgba(255,214,0,0.06)",
              borderRadius: 3,
              fontSize: 12,
              color: "#ffd600",
              letterSpacing: "0.08em",
            }}
          >
            Redirecting…
          </div>
        </div>
      )}

      {children}
    </>
  );
}