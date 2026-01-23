/**
 * Base element class with shared functionality.
 * Provides common methods for all chat elements.
 * @module libchat/elements/base
 */

import { formatMessage } from "../api.js";

/**
 * Base class for chat elements.
 * Provides shared functionality for client injection, rendering, and message handling.
 */
export class ChatElementBase extends HTMLElement {
  /** @type {import('../client.js').ChatClient|null} */
  #client = null;

  /** @type {boolean} */
  #loading = false;

  /** @type {number} */
  #historyIndex = -1;

  /** @type {() => void} */
  #unsubscribe = null;

  /**
   * Sets the ChatClient instance.
   * @param {import('../client.js').ChatClient} client - Client instance
   */
  set client(client) {
    if (!client) throw new Error("client is required");
    this.#client = client;

    // Subscribe to state changes
    if (this.#unsubscribe) {
      this.#unsubscribe();
    }
    this.#unsubscribe = this.#client.state.onStateChange(() => {
      this.render();
      this.scrollToBottom();
    });

    if (this.isConnected) {
      this.render();
      this.scrollToBottom();
    }
  }

  /**
   * Gets the ChatClient instance.
   * @returns {import('../client.js').ChatClient|null} Client instance
   */
  get client() {
    return this.#client;
  }

  /**
   * Gets the loading state.
   * @returns {boolean} Loading state
   */
  get loading() {
    return this.#loading;
  }

  /**
   * Gets the agent name from attributes.
   * @returns {string} Agent name
   */
  get agentName() {
    return this.getAttribute("data-name") || "Agent";
  }

  /**
   * Gets the placeholder text from attributes.
   * @returns {string} Placeholder text
   */
  get placeholder() {
    return this.getAttribute("data-placeholder") || "How can I help you?";
  }

  /**
   * Gets the current messages from state.
   * @returns {Array<{role: string, content: string}>} Messages
   */
  get messages() {
    return this.#client?.state.messages ?? [];
  }

  /** Called when element is removed from DOM. */
  disconnectedCallback() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
  }

  /**
   * Sends a user message.
   */
  async sendMessage() {
    const input = this.shadowRoot.querySelector("#prompt");
    const message = input.value.trim();
    if (!message || this.#loading) return;

    this.#historyIndex = -1;
    this.#client.state.addMessage({ role: "user", content: message });
    input.value = "";
    this.setLoading(true);

    try {
      for await (const chunk of this.#client.chat(message)) {
        this.handleStreamChunk(chunk);
      }
    } catch (error) {
      this.#client.state.addMessage({
        role: "error",
        content: `Error: ${error.message}`,
      });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handles a stream chunk from the API.
   * @param {object} data - Stream chunk data
   */
  handleStreamChunk(data) {
    if (data.error) {
      this.#client.state.addMessage({
        role: "error",
        content: `Error: ${data.error}`,
      });
      return;
    }

    if (data.messages?.length > 0) {
      for (const msg of data.messages) {
        this.processMessageChunk(msg);
      }
    }
  }

  /**
   * Processes a message chunk and updates state.
   * @param {object} msg - Message object
   */
  processMessageChunk(msg) {
    const content = formatMessage(msg);
    const messages = this.#client.state.messages;
    const lastMsg = messages[messages.length - 1];
    const shouldAppend =
      lastMsg &&
      lastMsg.role === msg.role &&
      !msg.tool_calls &&
      lastMsg.role !== "tool";

    if (shouldAppend) {
      this.#client.state.appendToLastMessage(content);
    } else {
      this.#client.state.addMessage({ role: msg.role, content });
    }
  }

  /**
   * Starts a new conversation session.
   */
  newSession() {
    this.#historyIndex = -1;
    this.#client.clear();
    this.shadowRoot.querySelector("#prompt")?.focus();

    this.dispatchEvent(
      new CustomEvent("chat:clear", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Sets the loading state.
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.#loading = loading;
    this.render();
    if (!loading) {
      this.shadowRoot.querySelector("#prompt")?.focus();
    }
  }

  /** Scrolls chat to bottom. */
  scrollToBottom() {
    const main = this.shadowRoot.querySelector("main");
    if (main) {
      main.scrollTop = main.scrollHeight;
    }
  }

  /**
   * Renders messages HTML.
   * @returns {string} Messages HTML
   */
  renderMessages() {
    return this.messages
      .map((m) => `<article role="${m.role}">${m.content}</article>`)
      .join("");
  }

  /**
   * Sets up form event listeners.
   */
  setupFormListeners() {
    const form = this.shadowRoot.querySelector("form");
    const input = this.shadowRoot.querySelector("#prompt");

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    input?.addEventListener("keypress", (e) => {
      // Shift+Enter creates newline, Enter alone sends
      if (e.key === "Enter" && !e.shiftKey && !this.#loading) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // History navigation with arrow keys
    input?.addEventListener("keydown", (e) => {
      const userMessages = this.messages.filter((m) => m.role === "user");
      if (!userMessages.length || !["ArrowUp", "ArrowDown"].includes(e.key))
        return;

      this.#historyIndex =
        e.key === "ArrowUp"
          ? Math.min(userMessages.length - 1, this.#historyIndex + 1)
          : Math.max(-1, this.#historyIndex - 1);

      e.preventDefault();
      input.value =
        this.#historyIndex === -1
          ? ""
          : userMessages[userMessages.length - 1 - this.#historyIndex].content;
    });

    // New conversation button
    this.shadowRoot
      .querySelector("#new")
      ?.addEventListener("click", () => this.newSession());
  }

  /**
   * Render method to be implemented by subclasses.
   * @abstract
   */
  render() {
    throw new Error("render() must be implemented by subclass");
  }
}
