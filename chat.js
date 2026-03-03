(function () {
  if (!window.AI_COMPANY_KEY) {
    console.error("AI_COMPANY_KEY saknas");
    return;
  }

  const API_URL = "https://ai-backend-ltel.vercel.app/api/chatkit/session";

  // Skapa chat container
  const chatBubble = document.createElement("div");
  chatBubble.innerHTML = `
    <div id="ai-chat-button">💬</div>
    <div id="ai-chat-window" class="hidden">
      <div id="ai-chat-header">AI Assistent</div>
      <div id="ai-chat-messages"></div>
      <div id="ai-chat-input-area">
        <input id="ai-chat-input" placeholder="Skriv ett meddelande..." />
        <button id="ai-chat-send">Skicka</button>
      </div>
    </div>
  `;
  document.body.appendChild(chatBubble);

  // CSS
  const style = document.createElement("style");
  style.innerHTML = `
    #ai-chat-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: black;
      color: white;
      padding: 15px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      z-index: 9999;
    }

    #ai-chat-window {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 320px;
      height: 420px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
    }

    #ai-chat-header {
      background: black;
      color: white;
      padding: 12px;
      font-weight: bold;
    }

    #ai-chat-messages {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
      font-size: 14px;
    }

    #ai-chat-input-area {
      display: flex;
      border-top: 1px solid #eee;
    }

    #ai-chat-input {
      flex: 1;
      border: none;
      padding: 10px;
      outline: none;
    }

    #ai-chat-send {
      background: black;
      color: white;
      border: none;
      padding: 10px 15px;
      cursor: pointer;
    }

    .hidden {
      display: none;
    }

    .ai-message {
      margin-bottom: 8px;
    }

    .ai-user {
      text-align: right;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  const button = document.getElementById("ai-chat-button");
  const windowEl = document.getElementById("ai-chat-window");
  const messagesEl = document.getElementById("ai-chat-messages");
  const inputEl = document.getElementById("ai-chat-input");
  const sendBtn = document.getElementById("ai-chat-send");

  button.onclick = () => {
    windowEl.classList.toggle("hidden");
  };

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, "ai-user");
    inputEl.value = "";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          api_key: window.AI_COMPANY_KEY
        })
      });

      const data = await res.json();

      if (data.reply) {
        addMessage(data.reply, "ai-bot");
      } else {
        addMessage("Något gick fel.", "ai-bot");
      }

    } catch (err) {
      addMessage("Serverfel.", "ai-bot");
    }
  }

  function addMessage(text, className) {
    const div = document.createElement("div");
    div.className = "ai-message " + className;
    div.innerText = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

})();
