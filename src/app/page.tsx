"use client";

import { useState } from "react";
import Logo from "@/components/ui/Logo";
import TeamRegistration from "@/components/auth/TeamRegistration";
import SuperuserLogin from "@/components/auth/SuperuserLogin";
import { Users, ShieldAlert } from "lucide-react";

type ActiveTab = "team" | "superuser";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("team");

  return (
    <div
      className="bg-grid"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top header bar */}
      <header
        style={{
          borderBottom: "1px solid #1a2535",
          backgroundColor: "rgba(6,8,13,0.9)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Logo size="md" />
          <div
            style={{
              fontSize: 11,
              color: "#5c6b7a",
              letterSpacing: "0.1em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#00e676",
                animation: "blink 2s ease-in-out infinite",
              }}
            />
            SYSTEM ONLINE
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "48px 24px",
        }}
      >
        {/* Hero section */}
        <div
          className="animate-slide-up"
          style={{ textAlign: "center", marginBottom: 44, maxWidth: 600 }}
        >
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <p
            style={{
              fontSize: 13,
              color: "#5c6b7a",
              lineHeight: 1.8,
              letterSpacing: "0.04em",
            }}
          >
            Welcome to the official competition platform. Register your team below, or
            log in as the superuser to manage the event.
          </p>
        </div>

        {/* Tab card */}
        <div
          className="animate-slide-up"
          style={{
            width: "100%",
            maxWidth: 680,
            backgroundColor: "#0d1219",
            border: "1px solid #1a2535",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Tab headers */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #1a2535",
              backgroundColor: "#111922",
            }}
          >
            {(
              [
                { key: "team", label: "Team Portal", icon: <Users size={14} /> },
                {
                  key: "superuser",
                  label: "Superuser",
                  icon: <ShieldAlert size={14} />,
                },
              ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]
            ).map(({ key, label, icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "15px 20px",
                    background: "none",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid #00e676"
                      : "2px solid transparent",
                    color: isActive ? "#00e676" : "#5c6b7a",
                    fontFamily:
                      "var(--font-orbitron), Orbitron, monospace",
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginBottom: -1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#dde4ee";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#5c6b7a";
                  }}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: "36px 32px" }}>
            {activeTab === "team" && <TeamRegistration />}
            {activeTab === "superuser" && <SuperuserLogin />}
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            marginTop: 32,
            fontSize: 11,
            color: "#5c6b7a",
            textAlign: "center",
            letterSpacing: "0.06em",
            lineHeight: 1.6,
          }}
        >
          All exam sessions are monitored. Tab switching or window changes
          will result in automatic disqualification.
        </p>
      </main>

      {/* Bottom bar */}
      <footer
        style={{
          borderTop: "1px solid #1a2535",
          padding: "12px 24px",
          textAlign: "center",
          fontSize: 10,
          color: "#5c6b7a",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Pass The Bug · Coding Competition Platform
      </footer>
    </div>
  );
}
