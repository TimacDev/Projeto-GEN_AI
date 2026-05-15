import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeHistory(history) {
  // 1. Transformar o histórico em texto legível
  const conversationText = history
    .map((turn) => `${turn.role}: ${turn.parts[0].text}`)
    .join("\n");

  // 2. Pedir resumo ao Gemini
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Faz um resumo factual desta conversa em 2-3 frases curtas (máximo 20 palavras cada).
                    Foca em factos sobre o utilizador (nome, profissão, preferências) e tópicos discutidos.
                    Não inventes nada.

                    Conversa:
                    ${conversationText}`,
          },
        ],
      },
    ],
  });

  return response.candidates[0].content.parts[0].text;
}
