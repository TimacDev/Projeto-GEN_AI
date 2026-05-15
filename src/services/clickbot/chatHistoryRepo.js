import { db } from "../../../db.js";

export async function insertExchange(userMessage, aiResponse) {
  await db.query(
    "INSERT INTO chat_history (user_message, ai_response) VALUES (?, ?)",
    [userMessage, aiResponse],
  );
}

export async function findAllHistory() {
  const [rows] = await db.query("SELECT * FROM chat_history ORDER BY id DESC");
  return rows;
}
