/**
 * ChatDrawerElement - Collapsible drawer chat interface.
 * @module libchat/elements/drawer
 */

import { ChatElementBase } from "./base.js";
import { baseStyles } from "../styles/base.js";
import { drawerStyles } from "../styles/drawer.js";

const UI_STATE_KEY = "chat_ui_state";

/**
 * Collapsible drawer chat interface component.
 * Floating panel with expand/collapse controls.
 *
 * Attributes:
 * - data-name: Agent display name (defaults to 'Agent')
 * - data-placeholder: Input placeholder text (optional)
 *
 * Events:
 * - chat:message: Dispatched when a message is added (bubbles, composed)
 * - chat:clear: Dispatched when session is cleared (bubbles, composed)
 * @example
 * <chat-drawer data-name="Agent Walter"></chat-drawer>
 * <script type="module">
 *   import { ChatClient, ChatDrawerElement } from "@copilot-ld/libchat";
 *   const client = new ChatClient({ chatUrl: "/api" });
 *   document.querySelector("chat-drawer").client = client;
 * </script>
 */
export class ChatDrawerElement extends ChatElementBase {
  #collapsed = false;
  #expanded = false;

  /** Creates a new ChatDrawerElement. */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#loadUIState();
  }

  /** Called when element is added to DOM. */
  connectedCallback() {
    this.setAttribute("data-collapsed", this.#collapsed);
    this.setAttribute("data-expanded", this.#expanded);

    if (this.client) {
      this.render();
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  /** Toggles collapsed state. */
  toggleCollapsed() {
    this.#collapsed = !this.#collapsed;
    this.#saveUIState();
    this.setAttribute("data-collapsed", this.#collapsed);
    this.render();
    if (!this.#collapsed) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  /** Toggles expanded state. */
  toggleExpanded() {
    this.#expanded = !this.#expanded;
    this.#saveUIState();
    this.setAttribute("data-expanded", this.#expanded);
  }

  /** Loads UI state from storage. */
  #loadUIState() {
    try {
      const stored = localStorage.getItem(UI_STATE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        this.#collapsed = state.collapsed ?? false;
        this.#expanded = state.expanded ?? false;
      }
    } catch {
      // Ignore storage errors
    }
  }

  /** Saves UI state to storage. */
  #saveUIState() {
    try {
      localStorage.setItem(
        UI_STATE_KEY,
        JSON.stringify({
          collapsed: this.#collapsed,
          expanded: this.#expanded,
        }),
      );
    } catch {
      // Ignore storage errors
    }
  }

  /** Renders the component. */
  render() {
    this.shadowRoot.innerHTML = `
      <style>${baseStyles}</style>
      <style>${drawerStyles}</style>
      <header>
        <h1><mark>✦</mark>${this.agentName}</h1>
        <button id="new" class="btn-icon" title="New conversation">+</button>
        <button id="expand" class="btn-icon" title="${this.#expanded ? "Smaller" : "Larger"}">
          ${this.#expanded ? "▫" : "▢"}
        </button>
        <button id="collapse" class="btn-icon" title="${this.#collapsed ? "Expand" : "Collapse"}">
          ${this.#collapsed ? "▲" : "▼"}
        </button>
      </header>
      ${
        this.#collapsed
          ? ""
          : `
        <main>${this.renderMessages()}</main>
        <footer>
          <form>
            <textarea
              id="prompt"
              placeholder="${this.placeholder}"
              rows="1"
              ${this.loading ? "disabled" : ""}
            ></textarea>
            <button type="submit" class="btn-icon" ${this.loading ? "disabled" : ""}>
              ${this.loading ? "…" : "➤"}
            </button>
          </form>
        </footer>
      `
      }
    `;

    this.setupFormListeners();

    this.shadowRoot
      .querySelector("#collapse")
      ?.addEventListener("click", () => this.toggleCollapsed());

    this.shadowRoot
      .querySelector("#expand")
      ?.addEventListener("click", () => this.toggleExpanded());
  }
}

customElements.define("chat-drawer", ChatDrawerElement);
