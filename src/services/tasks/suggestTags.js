import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import { findById } from "./tasksRepo.js";
import {
  findOrInsertTag,
  linkTagToTask,
  findTagsByTaskId,
} from "./tagsRepo.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const suggestTagsDeclaration = {
  name: "suggest_tags",
  description:
    "Sugere entre 2 e 5 tags relevantes para uma tarefa de trabalho, ajudando organização e pesquisa.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.INTEGER,
        description: "ID da tarefa a etiquetar.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Lista de 2 a 5 tags em minúsculas, sem acentos, com hífen em vez de espaços (ex: 'bug-login').",
      },
    },
    required: ["id", "tags"],
  },
};

export async function suggestTags(id) {
  const task = await findById(id);

  if (!task) {
    throw new Error(`Tarefa ${id} não encontrada`);
  }

  const existingTags = await findTagsByTaskId(id);

  const prompt = `És um assistente que sugere tags para organizar tarefas de trabalho.

  Tarefa:
  ${JSON.stringify(task, null, 2)}

  Tags já existentes (NÃO repetir nenhuma):
  ${JSON.stringify(existingTags)}

  Regras:
  - Categorias úteis: tipo de trabalho (bug, feature), área (auth, frontend), tecnologia (node, react).
  - Tags em minúsculas, sem acentos, com hífen em vez de espaços.
  - NÃO inventes tecnologias que não estejam implícitas no título.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: [suggestTagsDeclaration] }],
    },
  });

  const tool_call = response.functionCalls?.[0];

  if (!tool_call) {
    throw new Error("Modelo não conseguiu sugerir tags");
  }

  for (const tagName of tool_call.args.tags) {
    const tagId = await findOrInsertTag(tagName);
    await linkTagToTask(id, tagId);
  }

  return await findTagsByTaskId(id);
}
