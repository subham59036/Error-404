## How the Competition Works

### For Teams

1. Open the site and go to the **Team Portal** tab.
2. Enter 3–4 member details (name, email, department) and click **Register Team**.
3. You receive a **5-character Team ID** — keep it safe.
4. Wait for the superuser to activate the exam.
5. Click **Start Exam** when available.
6. Write your solution in the code editor. Submit before time runs out.
7. View your result, then wait to see if you are promoted to the next level.

### For the Superuser

1. Open the **Superuser** tab on the main page and log in with the password.
2. You are redirected to the **Dashboard** at `/dashboard`.

**Dashboard tabs:**
- **Questions** — Write and save questions for each level. Level 1 requires separate buggy code for C, JavaScript, Python, and Java. Levels 2 and 3 require a single problem statement.
- **Exam** — Set time limits and activate/deactivate each level. Only activate a level when all teams are ready.
- **Leaderboard** — View ranked results for any level. Click **Promote** to advance a team to the next level.
- **Teams** — See all registered teams with full member details.
- **Answers** — Review every submission with the Gemini evaluation response.

---

## Security Features

- **Single-device superuser sessions** — Only one login is allowed at any time. The session is stored in Turso, not in browser cookies or localStorage.
- **Auto-logout** — The superuser session terminates immediately when the browser tab is hidden or switched.
- **Exam integrity** — Any tab switch, window minimise, focus loss, or split-screen event on the exam page triggers automatic disqualification. The violation is recorded and the team is locked from resubmitting.
- **No client-side auth storage** — Superuser tokens are held in React state only and are lost on page refresh.

---

## Competition Rules (displayed to teams)

- Teams: 3–4 members.
- Each level has a configurable time limit (default 10 minutes).
- **Level 1**: Fix the buggy code in your chosen language (C, JS, Python, Java).
- **Levels 2–3**: Solve the problem statement in any language.
- Switching language clears your current code editor.
- Submitting is final and irreversible.
- Scores: 1 point for correct, 0 for incorrect or disqualified.
- Tiebreaker: fastest time, then fewest team members.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home — registration & superuser login
│   ├── dashboard/page.tsx    # Superuser dashboard
│   ├── exam/[level]/page.tsx # Exam page (levels 1–3)
│   ├── exam/result/page.tsx  # Post-exam result page
│   └── api/                  # All API routes
├── components/
│   ├── ui/                   # Logo, Badge, Popup, LoadingDots, LoadingSpinner
│   ├── auth/                 # SuperuserLogin, TeamRegistration
│   ├── exam/                 # CodeEditor, Timer, SecurityWrapper
│   └── dashboard/            # QuestionsTab, TeamsTab, AnswersTab, LeaderboardTab, ExamTab
├── context/
│   └── AuthContext.tsx       # Superuser token state (in-memory only)
├── lib/
│   ├── db.ts                 # Turso client + schema init
│   ├── auth.ts               # Session management
│   ├── gemini.ts             # AI code evaluation
│   └── utils.ts              # Helpers
└── types/
    └── index.ts              # Shared TypeScript types
```
