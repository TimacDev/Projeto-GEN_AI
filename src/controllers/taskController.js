import { createTaskFromText } from "../services/tasks/createTask.js";
import { refineTask } from "../services/tasks/refineTask.js";
import { summarizeTask } from "../services/tasks/summarizeTask.js";
import { suggestTags } from "../services/tasks/suggestTags.js";
import { findAll, findById, findLast, deleteTask, partialUpdateTask } from "../services/tasks/tasksRepo.js";

const VALID_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const VALID_PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export async function createTask(req, res, next) {
  try {
    const { text } = req.body;
    const task = await createTaskFromText(text);

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function listTasks(req, res, next) {
  try {
    const tasks = await findAll();
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

export async function getLastTask(req, res, next) {
  try {
    const task = await findLast();
    if (!task) {
      return res.status(404).json({ success: false, error: "Nenhuma tarefa encontrada" });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function removeTask(req, res, next) {
  try {
    const ok = await deleteTask(req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function patchTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, priority, space, assignee, due_date, status } = req.body;
    const fields = {};

    if (title !== undefined) fields.title = title;
    if (space !== undefined) fields.space = space;
    if (assignee !== undefined) fields.assignee = assignee || null;
    if (due_date !== undefined) fields.due_date = String(due_date).slice(0, 10);
    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, error: `priority inválida` });
      }
      fields.priority = priority;
    }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: `status inválido` });
      }
      fields.status = status;
    }

    const existing = await findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    }

    const updated = await partialUpdateTask(id, fields);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function refine(req, res, next) {
  try {
    const { id } = req.params;
    const result = await refineTask(id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function summarize(req, res, next) {
  try {
    const result = await summarizeTask(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function suggest(req, res, next) {
  try {
    const result = await suggestTags(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
