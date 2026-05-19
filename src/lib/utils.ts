export function generateTeamId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function now(): number {
  return Date.now();
}

export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function getLevelLabel(level: number): string {
  return `Level ${level}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "correct":
      return "text-green-400 border-green-400/30 bg-green-400/10";
    case "incorrect":
      return "text-red-400 border-red-400/30 bg-red-400/10";
    case "disqualified":
      return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
    default:
      return "text-gray-400 border-gray-400/30 bg-gray-400/10";
  }
}
