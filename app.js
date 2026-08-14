const person = {
  name: "Maya Chen",
  handle: "mayachen",
  initials: "MC",
  avatarClass: "avatar-maya",
  online: true
};

const messages = [
  { from: "them", text: "Hey! I pulled together a few directions for the new moodboard.", time: "10:41 AM" },
  { from: "them", text: "The new moodboard is looking so good ✨", time: "10:42 AM" },
  { from: "me", text: "I’m obsessed with the lime accent. It feels so fresh.", time: "10:43 AM" },
  { from: "them", text: "Right? I knew that one would be the winner. Want to review the type options too?", time: "10:44 AM" }
];

const chatPerson = document.querySelector("#chat-person");
const chatBody = document.querySelector("#chat-body");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const toast = document.querySelector("#toast");

function avatarMarkup(className = "") {
  return `<span class="avatar ${person.avatarClass} ${className}">${person.initials}</span>`;
}

function renderHeader() {
  chatPerson.innerHTML = `${avatarMarkup()}<span><span class="chat-name">${person.name}</span><span class="chat-handle">@${person.handle}</span></span>`;
}

function renderMessages() {
  chatBody.innerHTML = `<div class="date-divider">Today</div>` + messages.map((message) => `
    <div class="message-row ${message.from === "me" ? "sent" : "received"}">
      ${avatarMarkup("message-avatar")}
      <span class="message-bubble">${message.text}</span>
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

messageInput.addEventListener("input", () => messageForm.classList.toggle("has-text", messageInput.value.trim().length > 0));

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  messages.push({ from: "me", text, time: "Now" });
  messages.push({ from: "them", text: "No backend yet — this is a frontend-only prototype.", time: "Now" });
  messageInput.value = "";
  messageForm.classList.remove("has-text");
  renderMessages();
  showToast("Message saved locally");
});

renderHeader();
renderMessages();
