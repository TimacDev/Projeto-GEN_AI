import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import { findById } from "./tasksRepo.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const summarizeTaskDeclaration = {
  name: "summarize_task",
  description:
    "Resume uma tarefa existente numa frase curta para leitura rápida.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.INTEGER,
        description: "ID da tarefa a resumir.",
      },
      summary: {
        type: Type.STRING,
        description:
          "Frase única, máximo 20 palavras, com verbo no infinitivo ou imperativo. Captura o QUE precisa de ser feito e PORQUÊ se relevante.",
      },
    },
    required: ["id", "summary"],
  },
};

export async function summarizeTask(id) {
  const task = await findById(id);

  if (!task) {
    throw new Error(`Tarefa ${id} não encontrada`);
  }

  const prompt = `És um assistente que resume tarefas existentes num sistema de gestão.

  Tarefa:
  ${JSON.stringify(task, null, 2)}

  Regras:
  - Não inventes informação que não esteja na tarefa original.
  - Não repitas literalmente o título — sintetiza.
  - Linguagem objetiva, sem floreados.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: [summarizeTaskDeclaration] }],
    },
  });

  const tool_call = response.functionCalls?.[0];

  if (!tool_call) {
    throw new Error("Modelo não conseguiu resumir a tarefa");
  }

  return { summary: tool_call.args.summary };
}
