import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import { insertTask, findById } from "./tasksRepo.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const today = new Date().toISOString().split("T")[0];

export const createTaskDeclaration = {
  name: "create_task",
  description:
    "Cria uma NOVA tarefa estruturada. Usa SEMPRE esta função quando o utilizador disser 'cria', 'adiciona', 'nova tarefa' ou similar. NUNCA uses refine_task para criar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Título curto e claro da tarefa (máx 8 palavras)",
      },
      priority: {
        type: Type.STRING,
        enum: ["URGENT", "HIGH", "MEDIUM", "LOW"],
        description:
          "'urgente'/'crítico' → URGENT; 'importante' → HIGH; default → MEDIUM; sem urgência → LOW",
      },
      space: {
        type: Type.STRING,
        description:
          "Espaço/área (ex: Desenvolvimento, Design, Marketing). Inferir pelo contexto.",
      },
      assignee: {
        type: Type.STRING,
        description:
          "Nome da pessoa responsável, se mencionada no texto. Omitir se não especificada.",
      },
      due_date: {
        type: Type.STRING,
        description: `Data limite em ISO 8601 (YYYY-MM-DD). Hoje é ${today}. Converter expressões relativas como "amanhã" ou "próxima semana".`,
      },
      status: {
        type: Type.STRING,
        enum: ["TODO", "IN_PROGRESS", "DONE"],
        description:
          "Status inicial. Omite (= TODO) a menos que o utilizador o especifique ao criar (ex: 'cria... e marca como em progresso' → IN_PROGRESS).",
      },
    },
    required: ["title", "priority", "space", "due_date"],
  },
};

export async function createTaskFromText(text) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text }] }],
    config: {
      tools: [{ functionDeclarations: [createTaskDeclaration] }],
    },
  });

  const tool_call = response.functionCalls?.[0];

  if (!tool_call) {
    throw new Error("Modelo não conseguiu extrair uma tarefa do input");
  }

  if (tool_call.name !== "create_task") {
    throw new Error(`Tool inesperada: ${tool_call.name}`);
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const id = await insertTask({
    title: tool_call.args.title,
    priority: tool_call.args.priority,
    space: tool_call.args.space,
    assignee: tool_call.args.assignee || null,
    due_date: tool_call.args.due_date.split("T")[0],
    status: validStatuses.includes(tool_call.args.status) ? tool_call.args.status : "TODO",
  });

  return await findById(id);
}
