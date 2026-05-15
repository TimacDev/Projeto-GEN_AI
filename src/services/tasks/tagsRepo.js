import { db } from "../../../db.js";

export async function findOrInsertTag(name) {
  const normalized = name.toLowerCase().trim();
  await db.query("INSERT IGNORE INTO tags (name) VALUES (?)", [normalized]);
  const [rows] = await db.query("SELECT id FROM tags WHERE name = ?", [normalized]);
  return rows[0].id;
}

export async function linkTagToTask(taskId, tagId) {
  await db.query(
    "INSERT IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)",
    [taskId, tagId]
  );
}

export async function findTagsByTaskId(taskId) {
  const [rows] = await db.query(
    `SELECT t.name
     FROM tags t
     JOIN task_tags tt ON tt.tag_id = t.id
     WHERE tt.task_id = ?`,
    [taskId]
  );
  return rows.map((r) => r.name);
}
