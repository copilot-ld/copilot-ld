/**
 * ChatPageElement - Full-page chat interface.
 * @module libchat/elements/page
 */

import { ChatElementBase } from "./base.js";
import { baseStyles } from "../styles/base.js";
import { pageStyles } from "../styles/page.js";

/**
 * Full-page chat interface component.
 * When empty, shows centered welcome message with input at bottom.
 * When chatting, shows header + messages + input.
 *
 * Attributes:
 * - data-name: Agent display name (defaults to 'Agent')
 * - data-placeholder: Input placeholder text (optional)
 *
 * Events:
 * - chat:message: Dispatched when a message is added (bubbles, composed)
 * - chat:clear: Dispatched when session is cleared (bubbles, composed)
 * @example
 * <chat-page data-name="Agent Walter"></chat-page>
 * <script type="module">
 *   import { ChatClient, ChatPageElement } from "@copilot-ld/libchat";
 *   const client = new ChatClient({ chatUrl: "/api" });
 *   document.querySelector("chat-page").client = client;
 * </script>
 */
export class ChatPageElement extends ChatElementBase {
  /** Creates a new ChatPageElement. */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /** Called when element is added to DOM. */
  connectedCallback() {
    if (this.client) {
      this.render();
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  /** Renders the component. */
  render() {
    const empty = this.messages.length === 0;
    this.toggleAttribute("data-empty", empty);

    const formHTML = `
      <form>
        <textarea
          id="prompt"
          placeholder="${this.placeholder}"
          rows="1"
          ${this.loading ? "disabled" : ""}
        ></textarea>
        ${empty ? "" : '<button type="button" id="new" class="btn-icon" title="New conversation">+</button>'}
        <button type="submit" class="btn-icon" ${this.loading ? "disabled" : ""}>
          ${this.loading ? "…" : "➤"}
        </button>
      </form>
    `;

    this.shadowRoot.innerHTML = `
      <style>${baseStyles}</style>
      <style>${pageStyles}</style>
      ${
        empty
          ? `
        <section>
          <h2><mark>✦</mark>${this.agentName}</h2>
          ${formHTML}
        </section>
      `
          : `
        <header>
          <h1><mark>✦</mark>${this.agentName}</h1>
        </header>
        <main>${this.renderMessages()}</main>
        <footer>${formHTML}</footer>
      `
      }
    `;

    this.setupFormListeners();
  }
}

customElements.define("chat-page", ChatPageElement);
