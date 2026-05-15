import { streamChat } from "./api.js";
import { loadTasks, setFilter } from "./tasks.js";

const messages = document.getElementById("messages");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

function addBubble(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `message message--${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function checkForFilter(msg) {
  const t = msg.toLowerCase();
  if (!t.includes("mostra") && !t.includes("lista") && !t.includes("quais")) return;

  if (t.includes("urgent")) setFilter("priority", "URGENT");
  else if (t.includes("alta prioridade") || t.includes("importante")) setFilter("priority", "HIGH");
  else if (t.includes("baixa prioridade")) setFilter("priority", "LOW");

  if (t.includes("feita") || t.includes("done") || t.includes("concluíd")) setFilter("status", "DONE");
  else if (t.includes("progresso") || t.includes("andamento")) setFilter("status", "IN_PROGRESS");
  else if (t.includes("pendente") || t.includes("por fazer")) setFilter("status", "TODO");
}

export function initChat() {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";
    sendBtn.disabled = true;
    addBubble("user", msg);
    checkForFilter(msg);

    const botBubble = addBubble("bot", "");
    botBubble.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    let first = true;

    try {
      await streamChat(msg, (chunk) => {
        if (first) {
          botBubble.textContent = "";
          first = false;
        }
        botBubble.textContent += chunk;
        messages.scrollTop = messages.scrollHeight;
      });
      loadTasks();
    } catch (err) {
      botBubble.textContent = "Erro: " + err.message;
    }

    sendBtn.disabled = false;
    input.focus();
  });
}
