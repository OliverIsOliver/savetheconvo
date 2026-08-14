const person = {
  name: "Tiffany",
  handle: "econ204",
  initials: "T",
  avatarClass: "avatar-tiffany",
  online: true
};

const messages = [
  { from: "them", text: "wait are you in econ 204 too?", time: "Now" },
  { from: "me", text: "yeah lol, back row most days", time: "Now" },
  { from: "them", text: "ok wait i knew you looked familiar 😭", time: "Now" }
];

const state = {
  userScore: 5,
  herScore: 5,
  pending: false,
  prompts: { systemPrompt: "Loading...", dynamicPrompt: "Loading..." }
};

const chatPerson = document.querySelector("#chat-person");
const chatBody = document.querySelector("#chat-body");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const toast = document.querySelector("#toast");
const typingIndicator = document.querySelector("#typing-indicator");
const userScoreInput = document.querySelector("#user-score");
const herScoreInput = document.querySelector("#her-score");
const userScoreValue = document.querySelector("#user-score-value");
const herScoreValue = document.querySelector("#her-score-value");
const scoreSummary = document.querySelector("#score-summary");
const inspectButton = document.querySelector("#inspect-button");
const promptDialog = document.querySelector("#prompt-dialog");
const systemPrompt = document.querySelector("#system-prompt");
const dynamicPrompt = document.querySelector("#dynamic-prompt");

function avatarMarkup(className = "") {
  const avatar = document.createElement("span");
  avatar.className = `avatar ${person.avatarClass} ${className}`;
  avatar.textContent = person.initials;
  return avatar;
}

function renderHeader() {
  chatPerson.replaceChildren();
  chatPerson.append(avatarMarkup());

  const identity = document.createElement("span");
  identity.innerHTML = `<span class="chat-name">${person.name}</span><span class="chat-handle"><span class="online-dot"></span>${person.handle}</span>`;
  chatPerson.append(identity);
}

function renderMessages() {
  chatBody.replaceChildren();

  const divider = document.createElement("div");
  divider.className = "date-divider";
  divider.textContent = "Today";
  chatBody.append(divider);

  messages.forEach((message) => {
    const row = document.createElement("div");
    row.className = `message-row ${message.from === "me" ? "sent" : "received"}`;

    if (message.from !== "me") row.append(avatarMarkup("message-avatar"));

    const bubble = document.createElement("span");
    bubble.className = "message-bubble";
    bubble.textContent = message.text;
    row.append(bubble);
    chatBody.append(row);
  });

  chatBody.scrollTop = chatBody.scrollHeight;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function updateScores() {
  state.userScore = Number(userScoreInput.value);
  state.herScore = Number(herScoreInput.value);
  userScoreValue.textContent = `${state.userScore}/10`;
  herScoreValue.textContent = `${state.herScore}/10`;
  scoreSummary.textContent = `You ${state.userScore} · Tiffany ${state.herScore}`;
}

function historyForRequest() {
  return messages.map(({ from, text }) => ({ from, text }));
}

async function requestPromptPreview(message = "") {
  try {
    const response = await fetch("/api/prompts/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userScore: state.userScore,
        herScore: state.herScore,
        history: historyForRequest(),
        message
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load prompts.");
    state.prompts = data;
    systemPrompt.textContent = data.systemPrompt;
    dynamicPrompt.textContent = data.dynamicPrompt;
  } catch (error) {
    showToast(error.message);
  }
}

function openPromptInspector() {
  requestPromptPreview(messageInput.value.trim());
  if (typeof promptDialog.showModal === "function") promptDialog.showModal();
  else promptDialog.setAttribute("open", "");
}

function setLoading(isLoading) {
  state.pending = isLoading;
  typingIndicator.classList.toggle("visible", isLoading);
  sendButton.disabled = isLoading;
  messageInput.disabled = isLoading;
  sendButton.textContent = isLoading ? "..." : "Send";
}

messageInput.addEventListener("input", () => {
  messageForm.classList.toggle("has-text", messageInput.value.trim().length > 0);
});

[userScoreInput, herScoreInput].forEach((input) => {
  input.addEventListener("input", () => {
    updateScores();
    requestPromptPreview(messageInput.value.trim());
  });
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || state.pending) return;

  const previousHistory = historyForRequest();
  messages.push({ from: "me", text, time: "Now" });
  messageInput.value = "";
  messageForm.classList.remove("has-text");
  renderMessages();
  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userScore: state.userScore,
        herScore: state.herScore,
        history: previousHistory,
        message: text
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not reach Tiffany.");

    messages.push({ from: "them", text: data.reply, time: "Now" });
    if (data.promptInspector) {
      state.prompts = data.promptInspector;
      systemPrompt.textContent = data.promptInspector.systemPrompt;
      dynamicPrompt.textContent = data.promptInspector.dynamicPrompt;
    }
    renderMessages();
  } catch (error) {
    messages.pop();
    renderMessages();
    showToast(error.message);
  } finally {
    setLoading(false);
    messageInput.focus();
  }
});

inspectButton.addEventListener("click", openPromptInspector);

document.querySelectorAll("[data-prompt-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.promptTab;
    document.querySelectorAll("[data-prompt-tab]").forEach((item) => {
      const isSelected = item === tab;
      item.classList.toggle("active", isSelected);
      item.setAttribute("aria-selected", String(isSelected));
    });
    document.querySelector("#system-prompt-panel").hidden = selected !== "system";
    document.querySelector("#dynamic-prompt-panel").hidden = selected !== "dynamic";
  });
});

promptDialog.addEventListener("click", (event) => {
  if (event.target === promptDialog) promptDialog.close();
});

updateScores();
renderHeader();
renderMessages();
requestPromptPreview();
