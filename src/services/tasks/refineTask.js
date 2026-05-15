import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import { findById, updateTask } from "./tasksRepo.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const today = new Date().toISOString().split("T")[0];

export const refineTaskDeclaration = {
  name: "refine_task",
  description:
    "Refina uma tarefa existente: melhora o título, completa campos em falta, ajusta prioridade. Se o utilizador se referir implicitamente à última tarefa (ex: 'muda essa'), omite o campo id — o backend resolve.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.INTEGER,
        description:
          "ID da tarefa a refinar. Omitir se o utilizador se referir à 'última tarefa', 'essa tarefa' ou similar.",
      },
      title: { type: Type.STRING },
      priority: {
        type: Type.STRING,
        enum: ["URGENT", "HIGH", "MEDIUM", "LOW"],
      },
      space: { type: Type.STRING },
      assignee: { type: Type.STRING },
      due_date: {
        type: Type.STRING,
        description: `ISO 8601. Hoje é ${today}.`,
      },
      status: {
        type: Type.STRING,
        enum: ["TODO", "IN_PROGRESS", "DONE"],
      },
    },
    required: ["title", "priority", "space", "due_date", "status"],
  },
};

export async function refineTask(id, updates = {}) {
  const original = await findById(id);

  if (!original) {
    throw new Error(`Tarefa ${id} não encontrada`);
  }

  const prompt = `És um assistente que refina tarefas existentes num sistema de gestão.

  Estado atual da tarefa na base de dados:
  ${JSON.stringify(original, null, 2)}

  Alterações pedidas pelo utilizador:
  ${JSON.stringify(updates, null, 2)}

  Regras para o campo "status":
  - Se "updates" contém um valor para status → usa exatamente esse valor
  - Caso contrário, mantém o status atual: "${original.status}"
  - NUNCA mudes o status baseado em interpretação de outros campos

  Regras para os outros campos:
  - Melhora o título se estiver pouco claro ou demasiado longo
  - Completa campos em falta usando o contexto do título
  - Para "assignee": se "updates" não contém e "original" tem null, mantém null. NÃO inventes nomes.
  - Para "due_date": mantém a data exceto se "updates" trouxer outra. Formato YYYY-MM-DD.
  - Para "priority"/"space": aplica o que está em "updates" se existir, senão melhora coerência com o título.`;

  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: [refineTaskDeclaration] }],
    },
  });

  const tool_call = response.functionCalls?.[0];

  if (!tool_call) {
    throw new Error("Modelo não conseguiu refinar a tarefa");
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const args = tool_call.args;

  await updateTask(id, {
    title: args.title || original.title,
    priority: validPriorities.includes(args.priority) ? args.priority : original.priority,
    space: args.space || original.space,
    assignee: args.assignee || null,
    due_date: args.due_date ? args.due_date.split("T")[0] : String(original.due_date).slice(0, 10),
    status: validStatuses.includes(args.status) ? args.status : original.status,
  });

  return await findById(id);
}
