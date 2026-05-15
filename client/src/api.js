const BASE = "/api";

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  if (res.status === 204) return null;

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body.data;
}

export function fetchTasks() {
  return jsonFetch(`${BASE}/tasks`);
}

export function deleteTaskApi(id) {
  return jsonFetch(`${BASE}/tasks/${id}`, { method: "DELETE" });
}

export function refineTaskApi(id, body) {
  return jsonFetch(`${BASE}/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function fetchHistory() {
  return jsonFetch(`${BASE}/clickbot/history`);
}

export function streamChat(message, onChunk) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}/clickbot/chat-stream?message=${encodeURIComponent(message)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const data = event.data;
      if (data === "[DONE]") {
        es.close();
        resolve();
        return;
      }
      if (data.startsWith("[ERROR]")) {
        es.close();
        reject(new Error(data.replace("[ERROR]", "").trim()));
        return;
      }
      onChunk(data);
    };

    es.onerror = () => {
      es.close();
      reject(new Error("Ligação ao servidor perdida."));
    };
  });
}
