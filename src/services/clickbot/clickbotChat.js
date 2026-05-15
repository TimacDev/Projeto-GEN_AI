import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { summarizeHistory } from "../ai/summarizeHistory.js";
import { createSystemPrompt } from "../ai/createSystemPrompt.js";
import { insertExchange } from "./chatHistoryRepo.js";
import { createTaskDeclaration } from "../tasks/createTask.js";
import { refineTaskDeclaration } from "../tasks/refineTask.js";
import { suggestTagsDeclaration } from "../tasks/suggestTags.js";
import { summarizeTask, summarizeTaskDeclaration } from "../tasks/summarizeTask.js";
import { deleteTaskDeclaration } from "../tasks/deleteTask.js";
import {
  insertTask,
  updateTask,
  findById,
  findLast,
  findAll,
  deleteTask,
} from "../tasks/tasksRepo.js";
import {
  findOrInsertTag,
  linkTagToTask,
  findTagsByTaskId,
} from "../tasks/tagsRepo.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const history = [];
const WINDOW = 6;
const SUMMARIZE_AFTER = 10;
let memorySummary = "";
let lastTaskId = null;

export async function* clickbotChat(message) {
  if (history.length >= SUMMARIZE_AFTER) {
    const oldTurns = history.splice(0, history.length - WINDOW);
    memorySummary = await summarizeHistory(oldTurns);
  }

  history.push({ role: "user", parts: [{ text: message }] });

  const currentTasks = await findAll();
  const baseInstruction = createSystemPrompt(currentTasks);

  const systemInstruction = memorySummary
    ? `${baseInstruction}\n\nResumo da conversa anterior: ${memorySummary}`
    : baseInstruction;

  const stream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: history.slice(-WINDOW),
    config: {
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            createTaskDeclaration,
            refineTaskDeclaration,
            suggestTagsDeclaration,
            summarizeTaskDeclaration,
            deleteTaskDeclaration,
          ],
        },
      ],
    },
  });

  let reply = "";
  let toolCall = null;

  for await (const chunk of stream) {
    if (chunk.text) {
      reply += chunk.text;
      yield chunk.text;
    }
    if (chunk.functionCalls?.[0]) {
      toolCall = chunk.functionCalls[0];
    }
  }

  if (toolCall) {
    const confirmation = await executeTool(toolCall);
    reply += confirmation;
    yield confirmation;
  }

  history.push({ role: "model", parts: [{ text: reply }] });
  await insertExchange(message, reply);
}

async function resolveTaskId(argsId) {
  if (Number.isInteger(argsId)) return argsId;
  if (lastTaskId !== null) return lastTaskId;
  const last = await findLast();
  return last?.id ?? null;
}

async function executeTool(toolCall) {
  if (toolCall.name === "create_task") {
    const { title, priority, space, assignee, due_date, status } = toolCall.args;
    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    const id = await insertTask({
      title,
      priority,
      space,
      assignee: assignee || null,
      due_date: due_date.split("T")[0],
      status: validStatuses.includes(status) ? status : "TODO",
    });
    const task = await findById(id);
    lastTaskId = task.id;
    return `Criei a tarefa "${task.title}" (id ${task.id}) com prioridade ${task.priority}.`;
  }

  if (toolCall.name === "refine_task") {
    const id = await resolveTaskId(toolCall.args.id);
    if (!id) return "Não encontrei nenhuma tarefa para atualizar.";
    const original = await findById(id);
    const args = toolCall.args;
    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    const validPriorities = ["URGENT", "HIGH", "MEDIUM", "LOW"];
    await updateTask(id, {
      title: args.title || original.title,
      priority: validPriorities.includes(args.priority) ? args.priority : original.priority,
      space: args.space || original.space,
      assignee: args.assignee || null,
      due_date: args.due_date ? args.due_date.split("T")[0] : String(original.due_date).slice(0, 10),
      status: validStatuses.includes(args.status) ? args.status : original.status,
    });
    const task = await findById(id);
    lastTaskId = task.id;
    return `Atualizei a tarefa "${task.title}" (id ${task.id}).`;
  }

  if (toolCall.name === "suggest_tags") {
    const id = await resolveTaskId(toolCall.args.id);
    if (!id) return "Não encontrei nenhuma tarefa para etiquetar.";
    for (const tagName of toolCall.args.tags) {
      const tagId = await findOrInsertTag(tagName);
      await linkTagToTask(id, tagId);
    }
    const allTags = await findTagsByTaskId(id);
    return `Adicionei as tags: ${allTags.join(", ")}.`;
  }

  if (toolCall.name === "summarize_task") {
    const id = await resolveTaskId(toolCall.args.id);
    if (!id) return "Não encontrei nenhuma tarefa para sumarizar.";
    const { summary } = await summarizeTask(id);
    lastTaskId = id;
    return `Resumo: ${summary}`;
  }

  if (toolCall.name === "delete_task") {
    const id = await resolveTaskId(toolCall.args.id);
    if (!id) return "Não encontrei nenhuma tarefa para apagar.";
    const task = await findById(id);
    const ok = await deleteTask(id);
    if (!ok) return `Não consegui apagar a tarefa ${id}.`;
    if (lastTaskId === id) lastTaskId = null;
    return `Apaguei a tarefa "${task?.title ?? id}" (id ${id}).`;
  }

  return `Função desconhecida: ${toolCall.name}.`;
}
