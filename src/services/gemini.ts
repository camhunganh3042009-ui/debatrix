import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type Mode = 
  | 'observer' 
  | 'combat' 
  | 'ideas' 
  | 'simulation' 
  | 'fallacy' 
  | 'vocab' 
  | 'speed' 
  | 'destroy';

export interface Message {
  role: 'user' | 'ai' | 'system' | 'ai1' | 'ai2';
  content: string;
}

export async function askGemini(prompt: string, systemInstruction?: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are a helpful IELTS Debate Trainer.",
      },
    });
    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while connecting to the AI.";
  }
}

export async function getIELTSResponse(mode: Mode, input: string, history: Message[] = []) {
  const systemInstructions: Record<Mode, string> = {
    observer: "Simulate a debate between two intellectual personas (AI 1 and AI 2) on the given topic. Provide 3-5 sharp exchanges. Format: 'AI 1: ... \n AI 2: ...'. Use Band 8-9 vocabulary.",
    combat: "You are an aggressive IELTS debate opponent. Attack the user's logic fiercely and point out flaws. After your attack, provide a 'Language Upgrade' section with Band 7-8 vocabulary suggestions for their points.",
    ideas: "Generate 3 strong 'For' and 3 strong 'Against' ideas for the given IELTS topic. Each idea should have a core point and a brief explanation suitable for a Band 8 essay/speaking response.",
    simulation: "You are an IELTS examiner. Ask provocative Speaking Part 3 questions related to the topic. Be strict but professional. Wait for the user's response and then ask the next related question.",
    fallacy: "Make a flawed argument about the given topic containing a common logical fallacy (e.g., strawman, ad hominem, slippery slope). The user must identify it. If they succeed, confirm and explain. If they fail, gently explain the fallacy.",
    vocab: "Take the user's sentence and rewrite it to reach IELTS Band 7-8 or higher. Explain why the new version is better (collocations, precision, complexity).",
    speed: "You are a high-pressure debate opponent. Give very short, sharp counter-points (max 2 sentences). Force the user to think fast. Be direct and slightly impatient.",
    destroy: "Your goal is to completely dismantle the user's argument using cold logic and advanced rhetoric. Be dismissive of weak points and challenge every assumption they make."
  };

  const formattedHistory = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const prompt = `Topic/Input: ${input}\n\nHistory:\n${formattedHistory}\n\nNext Response:`;

  return await askGemini(prompt, systemInstructions[mode]);
}
