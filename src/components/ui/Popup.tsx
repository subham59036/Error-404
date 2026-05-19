"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface PopupProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
  actions?: React.ReactNode;
  closable?: boolean;
}

const variantStyles = {
  default: { accent: "#40c4ff", border: "rgba(64,196,255,0.25)" },
  success: { accent: "#00e676", border: "rgba(0,230,118,0.25)" },
  danger: { accent: "#ff3d3d", border: "rgba(255,61,61,0.25)" },
  warning: { accent: "#ffd600", border: "rgba(255,214,0,0.25)" },
};

export default function Popup({
  isOpen,
  onClose,
  title,
  children,
  variant = "default",
  actions,
  closable = true,
}: PopupProps) {
  const v = variantStyles[variant];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable && onClose) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closable, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(6, 8, 13, 0.85)",
        backdropFilter: "blur(6px)",
      }}
      onClick={closable ? onClose : undefined}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#0d1219",
          border: `1px solid ${v.border}`,
          borderTop: `2px solid ${v.accent}`,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: `0 0 40px rgba(0,0,0,0.6), 0 0 0 1px ${v.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: "1px solid #1a2535",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: v.accent,
            }}
          >
            {title}
          </span>
          {closable && onClose && (
            <button
              onClick={onClose}
              style={{
                color: "#5c6b7a",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#dde4ee")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5c6b7a")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "20px", color: "#dde4ee", fontSize: 14, lineHeight: 1.6 }}>
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid #1a2535",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
