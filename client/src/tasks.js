import { fetchTasks, deleteTaskApi, refineTaskApi } from "./api.js";

const taskList = document.getElementById("task-list");
const filterPriority = document.getElementById("filter-priority");
const filterStatus = document.getElementById("filter-status");
const filterSpace = document.getElementById("filter-space");
const refreshBtn = document.getElementById("refresh-tasks");

let allTasks = [];
const filters = { priority: "", status: "", space: "" };

function formatDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function fillSpaceOptions() {
  const spaces = [...new Set(allTasks.map((t) => t.space).filter(Boolean))];
  filterSpace.innerHTML = '<option value="">Todos os espaços</option>';
  for (const sp of spaces) {
    const opt = document.createElement("option");
    opt.value = sp;
    opt.textContent = sp;
    if (sp === filters.space) opt.selected = true;
    filterSpace.appendChild(opt);
  }
}

function applyFilters(tasks) {
  return tasks.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.space && t.space !== filters.space) return false;
    return true;
  });
}

function renderCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.innerHTML = `
    <div class="task-card__head">
      <div class="task-card__title" data-id="${task.id}">${task.title}</div>
      <span class="priority-pill" data-priority="${task.priority}">${task.priority}</span>
    </div>
    <div class="task-card__meta">
      <span>📁 ${task.space || "—"}</span>
      <span>📅 ${formatDate(task.due_date)}</span>
      <span>👤 ${task.assignee || "—"}</span>
      <span class="status-pill" data-status="${task.status}">${task.status}</span>
    </div>
    <div class="task-card__actions">
      <button class="success" data-action="done">✓ Done</button>
      <button class="danger" data-action="delete">🗑️ Apagar</button>
    </div>
  `;

  const titleEl = card.querySelector(".task-card__title");
  titleEl.addEventListener("click", () => {
    titleEl.contentEditable = "true";
    titleEl.focus();
  });
  titleEl.addEventListener("blur", async () => {
    titleEl.contentEditable = "false";
    const newTitle = titleEl.textContent.trim();
    if (newTitle && newTitle !== task.title) {
      await refineTaskApi(task.id, { title: newTitle });
      loadTasks();
    }
  });
  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      titleEl.blur();
    }
  });

  card.querySelector('[data-action="done"]').addEventListener("click", async () => {
    await refineTaskApi(task.id, { status: "DONE" });
    loadTasks();
  });

  card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    if (!confirm(`Apagar "${task.title}"?`)) return;
    await deleteTaskApi(task.id);
    loadTasks();
  });

  return card;
}

function render() {
  const filtered = applyFilters(allTasks);
  taskList.innerHTML = "";
  if (filtered.length === 0) {
    taskList.innerHTML = '<p class="empty">Sem tarefas para mostrar.</p>';
    return;
  }
  for (const task of filtered) {
    taskList.appendChild(renderCard(task));
  }
}

export async function loadTasks() {
  try {
    allTasks = await fetchTasks();
    fillSpaceOptions();
    render();
  } catch (err) {
    taskList.innerHTML = `<p class="empty">Erro ao carregar: ${err.message}</p>`;
  }
}

export function setFilter(field, value) {
  filters[field] = value;
  if (field === "priority") filterPriority.value = value;
  if (field === "status") filterStatus.value = value;
  if (field === "space") filterSpace.value = value;
  render();
}

export function initTasks() {
  filterPriority.addEventListener("change", () => setFilter("priority", filterPriority.value));
  filterStatus.addEventListener("change", () => setFilter("status", filterStatus.value));
  filterSpace.addEventListener("change", () => setFilter("space", filterSpace.value));
  refreshBtn.addEventListener("click", () => loadTasks());
}
