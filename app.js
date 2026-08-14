const person = {
  name: "Teresa Lai",
  handle: "teresalai_",
  initials: "TL",
  avatarClass: "avatar-teresa",
  online: true
};

const messages = [
  { from: "them", text: "Best birthday spa retreat ever, amirite?! My face is glowing", time: "9:41 AM" },
  { from: "me", text: "My face too. Thanks again for everything. You are the best!", time: "9:43 AM" },
  { from: "them", text: "Anytime. Let me know if you want to link up again!", time: "1:41 PM", reaction: ":)" },
  { from: "me", text: "Lets def go again. Best spa in the city!", time: "1:43 PM" },
  { from: "me", text: "Can you send the pic you took while we were there?", time: "1:44 PM", reaction: "👍", status: "Seen" }
];

const chatPerson = document.querySelector("#chat-person");
const chatBody = document.querySelector("#chat-body");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const toast = document.querySelector("#toast");
const audioCallButton = document.querySelector("#audio-call");
const videoCallButton = document.querySelector("#video-call");

function avatarMarkup(className = "") {
  return `<span class="avatar ${person.avatarClass} ${className}">${person.initials}</span>`;
}

function renderHeader() {
  chatPerson.innerHTML = `${avatarMarkup()}<span><span class="chat-name">${person.name}</span><span class="chat-handle">@${person.handle}</span></span>`;
}

function renderMessages() {
  chatBody.innerHTML = `<div class="date-divider">Today</div>` + messages.map((message) => `
    <div class="message-row ${message.from === "me" ? "sent" : "received"}">
      ${message.from === "them" ? avatarMarkup("message-avatar") : ""}
      <div class="message-stack">
        <span class="message-bubble">${message.text}</span>
        ${message.reaction ? `<span class="message-reaction">${message.reaction}</span>` : ""}
        ${message.status ? `<span class="message-status">${message.status}</span>` : ""}
      </div>
    </div>
  `).join("");
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("visible"), 1900);
}

function startCall(type) {
  showToast(`${type} call UI is ready for the AI model hookup`);
}

messageInput.addEventListener("input", () => {
  messageForm.classList.toggle("has-text", messageInput.value.trim().length > 0);
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messages.push({ from: "me", text, time: "Now", status: "Sent" });
  messageInput.value = "";
  messageForm.classList.remove("has-text");
  renderMessages();
  showToast("Message added to demo chat");
});

audioCallButton.addEventListener("click", () => startCall("Audio"));
videoCallButton.addEventListener("click", () => startCall("Video"));

renderHeader();
renderMessages();
