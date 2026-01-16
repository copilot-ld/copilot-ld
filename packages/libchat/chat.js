import { baseStyles } from "./styles.js";
import { chatStyles } from "./chat-styles.js";
import * as api from "./api.js";
import * as state from "./state.js";

/**
 * AgentChat - A full-page chat interface component.
 *
 * Attributes:
 * - data-api: API endpoint URL (defaults to window.location.origin + '/web/api')
 * - data-name: Agent display name (defaults to 'Agent')
 * - data-placeholder: Input placeholder text (optional)
 *
 * Events:
 * - agent:message: Dispatched when a message is added (bubbles, composed)
 * - agent:session-clear: Dispatched when session is cleared (bubbles, composed)
 */
class AgentChat extends HTMLElement {
  /**
   *
   */
  /**
   * Create a new AgentChat component.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // History navigation index
    this.historyIndex = -1;

    // Load state from storage
    const { resourceId, messages } = state.loadFromStorage();
    this.resourceId = resourceId;
    this.messages = messages;

    this.loading = false;
  }

  /**
   *
   */
  /**
   * Called when component is attached to the DOM.
   */
  connectedCallback() {
    // Get configuration from attributes or defaults
    this.apiUrl =
      this.getAttribute("data-api") ||
      window.ENV?.API_URL ||
      `${window.location.origin}/web/api`;
    this.agentName = this.getAttribute("data-name") || "Agent";
    this.placeholder =
      this.getAttribute("data-placeholder") || "How can I help you?";

    // Listen for messages from other instances
    window.addEventListener("agent:message", this.handleExternalMessage);

    this.render();
    this.setupEventListeners();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  /**
   *
   */
  /**
   * Called when component is removed from the DOM.
   */
  disconnectedCallback() {
    window.removeEventListener("agent:message", this.handleExternalMessage);
  }

  /**
   * Handle message events from other component instances.
   * @param {CustomEvent} event - Message event
   */
  handleExternalMessage = (event) => {
    // Don't process our own events
    if (event.target === this) return;

    const { resourceId, messages } = event.detail;
    if (resourceId === this.resourceId) {
      this.messages = messages;
      this.render();
      setTimeout(() => this.scrollToBottom(), 0);
    }
  };

  /**
   * Dispatch a message event for other components.
   */
  dispatchMessageEvent() {
    this.dispatchEvent(
      new CustomEvent("agent:message", {
        bubbles: true,
        composed: true,
        detail: {
          resourceId: this.resourceId,
          messages: this.messages,
        },
      }),
    );
  }

  /**
   * Set up event listeners for user interactions.
   */
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

    // History navigation with arrow keys
    input?.addEventListener("keydown", (e) => {
      const userMessages = this.messages.filter((m) => m.role === "user");
      if (!userMessages.length || !["ArrowUp", "ArrowDown"].includes(e.key))
        return;

      this.historyIndex =
        e.key === "ArrowUp"
          ? Math.min(userMessages.length - 1, this.historyIndex + 1)
          : Math.max(-1, this.historyIndex - 1);

      e.preventDefault();
      input.value =
        this.historyIndex === -1
          ? ""
          : userMessages[userMessages.length - 1 - this.historyIndex].content;
    });

    // Header button handler
    this.shadowRoot
      .querySelector("#new")
      ?.addEventListener("click", () => this.newSession());
  }

  /**
   * Send a user message to the API.
   */
  async sendMessage() {
    const input = this.shadowRoot.querySelector("#prompt");
    const message = input.value.trim();
    if (!message || this.loading) return;

    this.historyIndex = -1;
    this.addMessage("user", message);
    input.value = "";
    this.setLoading(true);

    try {
      const response = await api.sendChatMessage(
        this.apiUrl,
        message,
        this.resourceId,
      );

      for await (const chunk of api.readStream(response)) {
        this.handleStreamChunk(chunk);
      }
    } catch (error) {
      console.error("Chat error:", error);
      this.addMessage("error", "Error: Unable to send message");
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle a chunk from the streaming response.
   * @param {object} data - Stream chunk data
   */
  handleStreamChunk(data) {
    if (data.error) {
      console.error("Stream error:", data.error, data.details);
      this.addMessage("error", `Error: ${data.error}`);
      return;
    }

    if (data.resource_id) {
      this.resourceId = data.resource_id;
      state.saveToStorage(this.resourceId, this.messages);
    }

    if (data.messages && data.messages.length > 0) {
      data.messages.forEach((msg) => {
        this.processMessageChunk(msg);
      });
    }
  }

  /**
   * Process a message chunk and update UI.
   * @param {object} msg - Message object
   */
  processMessageChunk(msg) {
    const content = api.formatMessage(msg);
    const lastMsg = this.messages[this.messages.length - 1];
    const shouldAppend =
      lastMsg &&
      lastMsg.role === msg.role &&
      !msg.tool_calls &&
      lastMsg.role !== "tool";

    if (shouldAppend) {
      lastMsg.content += content;
      this.updateLastMessageUI(lastMsg);
    } else {
      this.addMessage(msg.role, content);
    }
  }

  /**
   * Update the last message in the UI without full re-render.
   * @param {object} msg - Updated message
   */
  updateLastMessageUI(msg) {
    const main = this.shadowRoot.querySelector("main");
    if (main && main.lastElementChild) {
      main.lastElementChild.innerHTML = msg.content;
      state.saveToStorage(this.resourceId, this.messages);
      this.scrollToBottom();
      this.dispatchMessageEvent();
    }
  }

  /**
   * Add a message to the conversation.
   * @param {string} role - Message role (user, assistant, error, etc.)
   * @param {string} content - Message content
   */
  addMessage(role, content) {
    this.messages.push({ role, content });
    state.saveToStorage(this.resourceId, this.messages);
    this.render();
    setTimeout(() => this.scrollToBottom(), 0);
    this.dispatchMessageEvent();
  }

  /**
   * Start a new conversation session.
   */
  newSession() {
    this.historyIndex = -1;
    this.resourceId = null;
    this.messages = [];
    state.saveToStorage(null, []);
    this.render();
    this.shadowRoot.querySelector("#prompt")?.focus();

    this.dispatchEvent(
      new CustomEvent("agent:session-clear", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Set loading state.
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.loading = loading;
    this.render();
    if (!loading) {
      this.shadowRoot.querySelector("#prompt")?.focus();
    }
  }

  /**
   * Scroll chat to bottom.
   */
  scrollToBottom() {
    const main = this.shadowRoot.querySelector("main");
    if (main) {
      main.scrollTop = main.scrollHeight;
    }
  }

  /**
   * Render messages HTML.
   * @returns {string} - Messages HTML
   */
  renderMessages() {
    return this.messages
      .map((m) => `<article role="${m.role}">${m.content}</article>`)
      .join("");
  }

  /**
   * Render the component.
   */
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getHtml()}
      <style>${baseStyles}</style>
      <style>${chatStyles}</style>
    `;
    this.setupEventListeners();
  }

  /**
   * Get component HTML.
   * @returns {string} - Component HTML
   */
  getHtml() {
    return `
      <header>
        <h1><mark>✦</mark>${this.agentName}</h1>
        <button 
          id="new"
          title="New conversation"
        >
          +
        </button>
      </header>
      <main>
        ${this.renderMessages()}
      </main>
      <footer>
        <form>
          <textarea 
            id="prompt"
            placeholder="${this.placeholder}"
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
    `;
  }
}

customElements.define("agent-chat", AgentChat);
