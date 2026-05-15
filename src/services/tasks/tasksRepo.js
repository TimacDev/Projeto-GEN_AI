import { db } from "../../../db.js";

export async function findAll() {
  const [rows] = await db.query("SELECT * FROM tasks ORDER BY id DESC");
  return rows;
}

export async function findById(id) {
  const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function findLast() {
  const [rows] = await db.query(
    "SELECT * FROM tasks ORDER BY created_at DESC, id DESC LIMIT 1"
  );
  return rows[0] || null;
}

export async function insertTask({ title, priority, space, assignee, due_date, status = "TODO" }) {
  const [result] = await db.query(
    `INSERT INTO tasks (title, priority, space, assignee, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, priority, space, assignee, due_date, status]
  );
  return result.insertId;
}

export async function updateTask(id, { title, priority, space, assignee, due_date, status }) {
  await db.query(
    `UPDATE tasks
     SET title = ?, priority = ?, space = ?, assignee = ?, due_date = ?, status = ?
     WHERE id = ?`,
    [title, priority, space, assignee, due_date, status, id]
  );
}

const ALLOWED_PATCH_FIELDS = ["title", "priority", "space", "assignee", "due_date", "status"];

export async function partialUpdateTask(id, fields) {
  const entries = Object.entries(fields).filter(([k]) => ALLOWED_PATCH_FIELDS.includes(k));
  if (entries.length === 0) return findById(id);

  const setClause = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);

  await db.query(`UPDATE tasks SET ${setClause} WHERE id = ?`, [...values, id]);
  return findById(id);
}

export async function deleteTask(id) {
  const [result] = await db.query("DELETE FROM tasks WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
