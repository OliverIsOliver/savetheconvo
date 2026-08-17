"use strict";
const people = [
    { name: "Tiffany", handle: "tiffany.lane", initials: "T", avatarClass: "avatar-tiffany", image: "assets/tiffany-profile.png" },
    { name: "Emma", handle: "emma.rose", initials: "E", avatarClass: "avatar-emma", image: "assets/emma-profile.png" },
    { name: "Lucia", handle: "lucia.vibes", initials: "L", avatarClass: "avatar-lucia", image: "assets/lucia-profile.png" }
];
let activePerson = people[0];
const messagesByPerson = new Map([
    ["tiffany.lane", [
            { from: "them", text: "wait are you in econ 204 too?" },
            { from: "me", text: "yeah lol, back row most days" },
            { from: "them", text: "ok wait i knew you looked familiar 😭" }
        ]],
    ["emma.rose", [{ from: "them", text: "wait I have to tell you what happened" }]],
    ["lucia.vibes", [{ from: "them", text: "your story was so cute omg" }]]
]);
let messages = messagesByPerson.get(activePerson.handle);
const state = {
    userScore: 5,
    herScore: 5,
    pending: false,
    prompts: { systemPrompt: "Loading...", dynamicPrompt: "Loading..." }
};
const chatPerson = document.querySelector("#chat-person");
const chatListView = document.querySelector("#chat-list-view");
const chatView = document.querySelector("#chat-view");
const chatBody = document.querySelector("#chat-body");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const emojiButton = document.querySelector("#emoji-button");
const emojiPicker = document.querySelector("#emoji-picker");
const toast = document.querySelector("#toast");
const typingIndicator = document.querySelector("#typing-indicator");
const userScoreInput = document.querySelector("#user-score");
const herScoreInput = document.querySelector("#her-score");
const userScoreValue = document.querySelector("#user-score-value");
const herScoreValue = document.querySelector("#her-score-value");
const scoreSummary = document.querySelector("#score-summary");
const systemPrompt = document.querySelector("#system-prompt");
const dynamicPrompt = document.querySelector("#dynamic-prompt");
const settingsPage = document.querySelector("#settings-page");
const settingsBack = document.querySelector("#settings-back");
const chatBack = document.querySelector("#chat-back");
let toastTimer;
function avatarMarkup(className = "") {
    const avatar = document.createElement("span");
    avatar.className = `avatar ${activePerson.avatarClass} ${className}`;
    const image = activePerson.image;
    if (image) {
        const profileImage = document.createElement("img");
        profileImage.src = image;
        profileImage.alt = activePerson.name;
        avatar.append(profileImage);
    }
    else {
        avatar.textContent = activePerson.initials;
    }
    return avatar;
}
function renderHeader() {
    chatPerson.replaceChildren();
    chatPerson.append(avatarMarkup());
    const identity = document.createElement("span");
    identity.innerHTML = `<span class="chat-name">${activePerson.name}</span><span class="chat-handle">${activePerson.handle}</span>`;
    chatPerson.append(identity);
}
function renderMessages() {
    chatBody.replaceChildren();
    const divider = document.createElement("div");
    divider.className = "date-divider";
    divider.textContent = "9:41 AM";
    chatBody.append(divider);
    messages.forEach((message) => {
        const row = document.createElement("div");
        row.className = `message-row ${message.from === "me" ? "sent" : "received"}`;
        if (message.from !== "me")
            row.append(avatarMarkup("message-avatar"));
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
    if (toastTimer !== undefined)
        window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
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
            body: JSON.stringify({ userScore: state.userScore, herScore: state.herScore, history: historyForRequest(), message })
        });
        const data = (await response.json());
        if (!response.ok)
            throw new Error(data.error || "Could not load prompts.");
        state.prompts = data;
        systemPrompt.textContent = data.systemPrompt;
        dynamicPrompt.textContent = data.dynamicPrompt;
    }
    catch (error) {
        showToast(error instanceof Error ? error.message : "Could not load prompts.");
    }
}
function setLoading(isLoading) {
    state.pending = isLoading;
    typingIndicator.classList.toggle("visible", isLoading);
    sendButton.disabled = isLoading;
    messageInput.disabled = isLoading;
    sendButton.setAttribute("aria-busy", String(isLoading));
}
messageInput.addEventListener("input", () => {
    messageForm.classList.toggle("has-text", messageInput.value.trim().length > 0);
});
emojiButton.addEventListener("click", () => {
    emojiPicker.hidden = !emojiPicker.hidden;
});
emojiPicker.querySelectorAll("[data-emoji]").forEach((button) => {
    button.addEventListener("click", () => {
        messageInput.value += button.dataset.emoji || "";
        messageForm.classList.add("has-text");
        emojiPicker.hidden = true;
        messageInput.focus();
    });
});
function closeEmojiPickerIfOutside(target) {
    if (!(target instanceof Node))
        return;
    if (!emojiButton.contains(target) && !emojiPicker.contains(target))
        emojiPicker.hidden = true;
}
document.addEventListener("pointerdown", (event) => closeEmojiPickerIfOutside(event.target));
document.addEventListener("focusin", (event) => closeEmojiPickerIfOutside(event.target));
[userScoreInput, herScoreInput].forEach((input) => {
    input.addEventListener("input", () => {
        updateScores();
        void requestPromptPreview(messageInput.value.trim());
    });
});
messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text || state.pending)
        return;
    const previousHistory = historyForRequest();
    messages.push({ from: "me", text });
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
        const data = (await response.json());
        if (!response.ok)
            throw new Error(data.error || "Could not reach Tiffany.");
        messages.push({ from: "them", text: data.reply });
        if (data.promptInspector) {
            state.prompts = data.promptInspector;
            systemPrompt.textContent = data.promptInspector.systemPrompt;
            dynamicPrompt.textContent = data.promptInspector.dynamicPrompt;
        }
        renderMessages();
    }
    catch (error) {
        messages.pop();
        renderMessages();
        showToast(error instanceof Error ? error.message : "Could not reach Tiffany.");
    }
    finally {
        setLoading(false);
        messageInput.focus();
    }
});
document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
        if (button.dataset.action === "info") {
            chatView.hidden = true;
            settingsPage.hidden = false;
            void requestPromptPreview(messageInput.value.trim());
            return;
        }
        showToast(`${button.getAttribute("aria-label")} is coming soon`);
    });
});
chatBack.addEventListener("click", () => {
    chatView.hidden = true;
    chatListView.hidden = false;
});
document.querySelectorAll("[data-person]").forEach((button) => {
    button.addEventListener("click", () => {
        const selectedPerson = people.find((person) => person.handle === button.dataset.person);
        if (!selectedPerson)
            return;
        activePerson = selectedPerson;
        messages = messagesByPerson.get(activePerson.handle);
        renderHeader();
        renderMessages();
        chatListView.hidden = true;
        chatView.hidden = false;
    });
});
settingsBack.addEventListener("click", () => {
    settingsPage.hidden = true;
    chatView.hidden = false;
});
document.querySelectorAll("[data-prompt-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
        const selected = tab.dataset.promptTab;
        document.querySelectorAll("[data-prompt-tab]").forEach((item) => {
            const isSelected = item === tab;
            item.classList.toggle("active", isSelected);
            item.setAttribute("aria-selected", String(isSelected));
        });
        systemPrompt.hidden = selected !== "system";
        dynamicPrompt.hidden = selected !== "dynamic";
    });
});
updateScores();
renderHeader();
renderMessages();
