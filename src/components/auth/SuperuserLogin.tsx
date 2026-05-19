"use client";

import { useState, useRef } from "react";
import { Eye, EyeOff, LogIn, ShieldAlert } from "lucide-react";
import LoadingDots from "@/components/ui/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SuperuserLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setToken } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deviceId = `${navigator.userAgent}-${Date.now()}`;
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, deviceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      setToken(data.token);
      router.push("/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-slide-up"
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 4,
              backgroundColor: "rgba(0,230,118,0.08)",
              border: "1px solid rgba(0,230,118,0.25)",
            }}
          >
            <ShieldAlert size={26} color="#00e676" />
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-orbitron), Orbitron, monospace",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#00e676",
            marginBottom: 6,
          }}
        >
          Superuser Access
        </p>
        <p style={{ fontSize: 12, color: "#5c6b7a", lineHeight: 1.5 }}>
          Restricted area. Credentials required.
          <br />
          Session expires on tab close or switch.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ position: "relative" }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#5c6b7a",
              marginBottom: 8,
            }}
          >
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter superuser password"
              autoComplete="off"
              style={{
                width: "100%",
                padding: "11px 40px 11px 14px",
                backgroundColor: "#111922",
                border: `1px solid ${error ? "rgba(255,61,61,0.5)" : "#1a2535"}`,
                borderRadius: 3,
                color: "#dde4ee",
                fontSize: 14,
                fontFamily: "var(--font-jetbrains), monospace",
                letterSpacing: "0.05em",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = error ? "rgba(255,61,61,0.5)" : "#1a2535")
              }
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#5c6b7a",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#dde4ee")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6b7a")}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
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
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ flexShrink: 0 }}>⚠</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "12px 20px",
            backgroundColor: loading ? "rgba(0,230,118,0.1)" : "#00e676",
            color: loading ? "#00e676" : "#06080d",
            border: "1px solid #00e676",
            borderRadius: 3,
            fontFamily: "var(--font-orbitron), Orbitron, monospace",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: loading || !password.trim() ? "not-allowed" : "pointer",
            opacity: !password.trim() && !loading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading && password.trim())
              e.currentTarget.style.backgroundColor = "#00ff8a";
          }}
          onMouseLeave={(e) => {
            if (!loading && password.trim())
              e.currentTarget.style.backgroundColor = "#00e676";
          }}
        >
          {loading ? (
            <>
              Authenticating <LoadingDots color="green" size="sm" />
            </>
          ) : (
            <>
              <LogIn size={14} />
              Login
            </>
          )}
        </button>
      </form>

      <p style={{ fontSize: 11, color: "#5c6b7a", textAlign: "center", marginTop: 18 }}>
        ⚡ Only 1 device may be logged in at a time
      </p>
    </div>
  );
}
