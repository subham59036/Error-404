"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Users, RefreshCw } from "lucide-react";

interface TeamsTabProps {
  token: string;
}

interface TeamData {
  id: string;
  created_at: number;
  members: Array<{
    name: string;
    email: string;
    department: string;
    position: number;
  }>;
}

export default function TeamsTab({ token }: TeamsTabProps) {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTeams = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [token]);

  const filtered = teams.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(s) ||
      t.members.some(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          m.department.toLowerCase().includes(s)
      )
    );
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <LoadingSpinner size="md" label="Loading teams…" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={16} color="#00e676" />
          <span
            style={{
              fontFamily: "var(--font-orbitron), Orbitron, monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "#dde4ee",
              letterSpacing: "0.1em",
            }}
          >
            {teams.length} Registered Team{teams.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search teams, members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "7px 12px",
              backgroundColor: "#111922",
              border: "1px solid #1a2535",
              borderRadius: 3,
              color: "#dde4ee",
              fontSize: 12,
              fontFamily: "var(--font-jetbrains), monospace",
              width: 220,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1a2535")}
          />
          <button
            onClick={() => fetchTeams(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              backgroundColor: "transparent",
              border: "1px solid #1a2535",
              borderRadius: 3,
              color: "#5c6b7a",
              fontSize: 12,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#243245"; e.currentTarget.style.color = "#dde4ee"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a2535"; e.currentTarget.style.color = "#5c6b7a"; }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin-slow" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#5c6b7a",
            border: "1px dashed #1a2535",
            borderRadius: 4,
          }}
        >
          <Users size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No teams registered yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((team) => (
            <div
              key={team.id}
              className="animate-fade-in"
              style={{
                border: "1px solid #1a2535",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {/* Team header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "#111922",
                  borderBottom: "1px solid #1a2535",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-orbitron), Orbitron, monospace",
                      fontWeight: 900,
                      fontSize: 16,
                      color: "#00e676",
                      letterSpacing: "0.2em",
                    }}
                  >
                    {team.id}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      backgroundColor: "rgba(0,230,118,0.08)",
                      border: "1px solid rgba(0,230,118,0.2)",
                      borderRadius: 2,
                      fontSize: 10,
                      color: "#00e676",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {team.members.length} Members
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#5c6b7a" }}>
                  Registered {new Date(team.created_at).toLocaleString()}
                </span>
              </div>

              {/* Members table */}
              <div style={{ padding: "0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#0d1219",
                        borderBottom: "1px solid #1a2535",
                      }}
                    >
                      {["#", "Name", "Email", "Department"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "8px 14px",
                            textAlign: "left",
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#5c6b7a",
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map((m, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < team.members.length - 1 ? "1px solid #1a2535" : "none",
                          backgroundColor: "transparent",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#111922")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#5c6b7a", width: 30 }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#dde4ee", fontWeight: 500 }}>
                          {m.name}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#8a9ab0" }}>
                          {m.email}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "#5c6b7a" }}>
                          {m.department}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filtered.length === 0 && search && (
            <div style={{ textAlign: "center", padding: 40, color: "#5c6b7a", fontSize: 13 }}>
              No teams match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
