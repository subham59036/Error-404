import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});
  }
  return genAI;
}

export interface EvaluationResult {
  is_correct: boolean;
  response: string | undefined;
}

export async function evaluateLevel1or2(
  language: string,
  originalBuggyCode: string,
  submittedCode: string
): Promise<EvaluationResult> {
  if (!submittedCode.trim()) {
    return {
      is_correct: false,
      response: "INCORRECT\nNo code was submitted.",
    };
  }

  try {
  
    const result = await getGenAI().models.generateContent({ 
      model: "gemini-2.5-flash",
      contents: `You are evaluating a code fix submission for a programming competition.

Language: ${language}

Original buggy code:
\`\`\`
${originalBuggyCode}
\`\`\`

Student's submitted corrected code:
\`\`\`
${submittedCode}
\`\`\`

Does the student's code correctly fix ALL the logic and syntax errors in the original code? The fixed code must be logically correct and syntactically valid for the language.

Respond with exactly one of these words on the first line: CORRECT or INCORRECT
Then on the next line, briefly explain why in at most 2 sentences.`,

  })

    const text = await result.text?.trim();
    const firstLine = text?.split("\n")[0].trim().toUpperCase();
    const isCorrect = firstLine === "CORRECT";

    return {
      is_correct: isCorrect,
      response: text,
    };
  } catch (error) {
    console.error("Gemini evaluation error:", error);
    return {
      is_correct: false,
      response: "INCORRECT\nEvaluation service error. Manual review required.",
    };
  }
}

export async function evaluateLevel3(
  level: number,
  language: string,
  problemStatement: string,
  submittedCode: string
): Promise<EvaluationResult> {
  if (!submittedCode.trim()) {
    return {
      is_correct: false,
      response: "INCORRECT\nNo code was submitted.",
    };
  }

  try {

    const result = await getGenAI().models.generateContent({ 
      model: "gemini-2.5-flash",
      contents: `You are evaluating a code solution for a programming competition (Level ${level}).

Problem Statement:
${problemStatement}

Student's solution (Language: ${language}):
\`\`\`
${submittedCode}
\`\`\`

Does this code correctly solve the problem? Consider correctness, edge cases, and logical soundness.

Respond with exactly one of these words on the first line: CORRECT or INCORRECT
Then on the next line, briefly explain why in at most 2 sentences.`,

  })

    const text = await result.text?.trim();
    const firstLine = text?.split("\n")[0].trim().toUpperCase();
    const isCorrect = firstLine === "CORRECT";

    return {
      is_correct: isCorrect,
      response: text,
    };
  } catch (error) {
    console.error("Gemini evaluation error:", error);
    return {
      is_correct: false,
      response: "INCORRECT\nEvaluation service error. Manual review required.",
    };
  }
}
