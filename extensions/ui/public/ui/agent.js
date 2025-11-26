class AgentChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.i = -1;
    this.messages = [];
    this.loading = false;
    this.collapsed = localStorage.getItem("agent_collapsed") === "true";
    this.expanded = localStorage.getItem("agent_expanded") === "true";
    this.resource_id = localStorage.getItem("agent_resource_id");
    const msg = localStorage.getItem("agent_messages");
    if (this.resource_id && msg) this.messages = JSON.parse(msg);
  }

  connectedCallback() {
    // Get API URL from data attribute, env config, or default to current origin + /web/api
    this.apiUrl =
      this.getAttribute("data-api") ||
      window.ENV?.API_URL ||
      `${window.location.origin}/web/api`;
    this.update();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  update() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector("form");
    const input = this.shadowRoot.querySelector("#prompt");

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !this.loading) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    input?.addEventListener("keydown", (e) => {
      const msg = this.messages.filter((m) => m.role === "user");
      if (!msg.length || !["ArrowUp", "ArrowDown"].includes(e.key)) return;

      this.i =
        e.key === "ArrowUp"
          ? Math.min(msg.length - 1, this.i + 1)
          : Math.max(-1, this.i - 1);

      e.preventDefault();
      input.value = this.i === -1 ? "" : msg[msg.length - 1 - this.i].content;
    });

    ["#new", "#collapsed", "#expanded"].forEach((id) => {
      this.shadowRoot
        .querySelector(id)
        ?.addEventListener("click", () =>
          id === "#new" ? this.newSession() : this.toggle(id.slice(1)),
        );
    });
  }

  toggle(prop) {
    this[prop] = !this[prop];
    localStorage.setItem(`agent_${prop}`, this[prop].toString());
    this.update();
    if (!this[prop]) setTimeout(() => this.scrollToBottom(), 0);
  }

  async sendMessage() {
    const input = this.shadowRoot.querySelector("#prompt");
    const message = input.value.trim();
    if (!message || this.loading) return;

    this.i = -1;
    this.addMessage("user", message);
    input.value = "";
    this.setLoading(true);

    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          resource_id: this.resource_id,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      this.resource_id = data.resource_id;
      localStorage.setItem("agent_resource_id", this.resource_id);

      this.addMessage(data.message.role, data.message.content);
    } catch (error) {
      console.error(error.message || String(error));
      this.addMessage("error", `Error`);
    } finally {
      this.setLoading(false);
    }
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
    localStorage.setItem("agent_messages", JSON.stringify(this.messages));
    this.update();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  newSession() {
    this.i = -1;
    this.resource_id = null;
    this.messages = [];
    localStorage.removeItem("agent_resource_id");
    localStorage.removeItem("agent_messages");
    this.update();
    this.shadowRoot.querySelector("#prompt").focus();
  }

  setLoading(loading) {
    this.loading = loading;
    this.update();
    if (!loading) this.shadowRoot.querySelector("#prompt").focus();
  }

  scrollToBottom() {
    const main = this.shadowRoot.querySelector("main");
    if (main) main.scrollTop = main.scrollHeight;
  }

  renderMessages() {
    return this.messages
      .map((m) => `<article role="${m.role}">${m.content}</article>`)
      .join("");
  }

  render() {
    this.shadowRoot.innerHTML = `${this.getHtml()}\n<style>${this.getCss()}</style>`;
  }

  getHtml() {
    return `
      <header>
        <h1>🔮 Agent Walter</h1>
        <button 
          id="new"
          title="New conversation"
        >
          +
        </button>
        <button 
          id="expanded"
          title="${this.expanded ? "Smaller dialog" : "Larger dialog"}"
        >
          □
        </button>
        <button 
          id="collapsed"
          title="${this.collapsed ? "Expand dialog" : "Collapse dialog"}"
        >
          ${this.collapsed ? "↑" : "↓"}
        </button>
      </header>
      ${
        this.collapsed
          ? ""
          : `
      <main>
        ${this.renderMessages()}
      </main>
      <footer>
        <form>
          <textarea 
            id="prompt"
            placeholder="How can I help you?"
            rows="3"
            ${this.loading ? "disabled" : ""}
          ></textarea>
          <button 
            type="submit"
            id="send"
            ${this.loading ? "disabled" : ""}
          >
            ${this.loading ? "..." : "➤"}
          </button>
        </form>
      </footer>
      `
      }
    `;
  }

  getCss() {
    return `
      :host {
        --text: #24292f;
        --error: #dc2626;
        --accent: #1e40af;
        --accent-subtle: #0969da1a;
        --bg: #ffffff;
        --bg-secondary: #f8f9fa;
        --border: #e1e5e9;
        position: fixed;
        z-index: 1000;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        width: ${this.expanded ? "800px" : "400px"};
        height: ${this.collapsed ? "50px" : this.expanded ? "1000px" : "600px"};
        background: var(--bg);
        border: 1px solid var(--border);
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        font: 14px system-ui, sans-serif;
        transition: all 0.2s ease-in-out;
      }
      
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 50px;
        padding: 0 16px;
        gap: 8px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border);
      }
      
      h1 {
        margin: 0 auto 0 0;
        font-weight: 600;
        font-size: 16px;
        line-height: 1;
        color: var(--text);
      }
      
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      
      header button {
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        color: var(--text);
        font-size: 18px;
      }
      
      header button:hover {
        background: var(--accent-subtle);
      }
      
      main {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }
      
      footer {
        padding: 16px;
        border-top: 1px solid var(--border);
      }
      
      form {
        position: relative;
        margin: 0;
      }
      
      form textarea {
        box-sizing: border-box;
        width: 100%;
        min-height: 44px;
        padding: 10px 48px 10px 12px;
        border: 1px solid var(--border);
        font: inherit;
        line-height: 1.4;
        resize: none;
      }
      
      form textarea:focus {
        outline: none;
        border-color: var(--accent);
      }
      
      form textarea:disabled {
        background: var(--bg-secondary);
      }
      
      form button {
        position: absolute;
        right: 4px;
        bottom: 4px;
        width: 36px;
        height: 36px;
        background: transparent;
        border: none;
        color: var(--accent);
        font-family: inherit;
        font-weight: 500;
        font-size: 16px;
      }
      
      form button:hover:not(:disabled) {
        background: var(--accent-subtle);
      }
      
      form button:disabled {
        cursor: not-allowed;
      }
      
      article {
        margin-bottom: 1em;
        line-height: 1.4;
      }
      
      article[role="user"] {
        max-width: 85%;
        margin-left: auto;
        padding: 12px;
        background: var(--accent-subtle);
        color: var(--accent);
      }
      
      article[role="error"] {
        color: var(--error);
      }
      
      article pre {
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--accent);
        font: 12px ui-monospace, monospace;
        overflow: auto;
      }
    `;
  }
}

customElements.define("agent-chat", AgentChat);
