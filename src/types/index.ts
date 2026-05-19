export interface Team {
  id: string;
  created_at: number;
}

export interface TeamMember {
  id: number;
  team_id: string;
  name: string;
  email: string;
  department: string;
  position: number;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface Question {
  id: number;
  level: number;
  language: string;
  content: string;
  updated_at: number;
}

export interface Submission {
  id: number;
  team_id: string;
  level: number;
  language: string;
  code: string;
  is_correct: number;
  gemini_response: string;
  time_taken: number;
  submitted_at: number;
  is_disqualified: number;
}

export interface ExamSettings {
  level: number;
  is_active: number;
  time_limit: number;
  updated_at: number;
}

export interface LevelProgression {
  team_id: string;
  level: number;
  is_promoted: number;
  promoted_at: number | null;
}

export interface SuperuserSession {
  id: number;
  token: string;
  device_id: string;
  created_at: number;
  expires_at: number;
}

export type Language = "c" | "javascript" | "python" | "java";
export type ExamLevel = 1 | 2 | 3;

export interface LevelStatus {
  isActive: boolean;
  timeLimit: number;
  isQualified: boolean;
  hasSubmitted: boolean;
  isDisqualified: boolean;
  isPromoted: boolean;
  submission: Submission | null;
}

export interface TeamStatus {
  team: Team;
  members: TeamMember[];
  levels: {
    1: LevelStatus;
    2: LevelStatus;
    3: LevelStatus;
  };
}

export interface LeaderboardEntry {
  team_id: string;
  members: TeamMember[];
  marks: number;
  time_taken: number | null;
  member_count: number;
  is_promoted: boolean;
  status: "correct" | "incorrect" | "disqualified" | "pending";
}

export const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
] as const;

export const LANGUAGES: { value: Language; label: string; monacoLang: string }[] = [
  { value: "c", label: "C", monacoLang: "c" },
  { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { value: "python", label: "Python", monacoLang: "python" },
  { value: "java", label: "Java", monacoLang: "java" },
];
