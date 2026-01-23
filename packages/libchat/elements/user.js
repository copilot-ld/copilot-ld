/**
 * ChatUserElement - Authentication UI component.
 * @module libchat/elements/user
 */

import { baseStyles } from "../styles/base.js";
import { userStyles } from "../styles/user.js";

/**
 * Authentication UI component for login/logout.
 * Simple form-based auth with clean styling.
 *
 * Events:
 * - chat:login: Dispatched when user logs in (bubbles, composed)
 * - chat:logout: Dispatched when user logs out (bubbles, composed)
 * - chat:error: Dispatched on authentication error (bubbles, composed)
 * @example
 * <chat-user></chat-user>
 * <script type="module">
 *   import { ChatClient, ChatUserElement } from "@copilot-ld/libchat";
 *   const client = new ChatClient({
 *     chatUrl: "/api",
 *     auth: { url: "http://localhost:9999" }
 *   });
 *   document.querySelector("chat-user").client = client;
 * </script>
 */
export class ChatUserElement extends HTMLElement {
  #client = null;
  #unsubscribe = null;

  /** Creates a new ChatUserElement. */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * Sets the ChatClient instance.
   * @param {import('../client.js').ChatClient} client - Client instance
   */
  set client(client) {
    if (!client) throw new Error("client is required");
    this.#client = client;

    if (this.#unsubscribe) {
      this.#unsubscribe();
    }
    if (this.#client.auth) {
      this.#unsubscribe = this.#client.auth.onAuthStateChange(() => {
        this.render();
      });
    }

    if (this.isConnected) {
      this.render();
    }
  }

  /**
   * Gets the ChatClient instance.
   * @returns {import('../client.js').ChatClient|null} Client instance
   */
  get client() {
    return this.#client;
  }

  /** Called when element is added to DOM. */
  connectedCallback() {
    if (this.#client) {
      this.render();
    }
  }

  /** Called when element is removed from DOM. */
  disconnectedCallback() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
  }

  /**
   * Handles login form submission.
   * @param {Event} e - Submit event
   */
  async #handleLogin(e) {
    e.preventDefault();

    const email = this.shadowRoot.querySelector("#email").value;
    const password = this.shadowRoot.querySelector("#password").value;

    try {
      const { error } = await this.#client.auth.signIn(email, password);
      if (error) {
        this.#showError(error.message);
        this.dispatchEvent(
          new CustomEvent("chat:error", {
            bubbles: true,
            composed: true,
            detail: { error },
          }),
        );
      } else {
        this.dispatchEvent(
          new CustomEvent("chat:login", {
            bubbles: true,
            composed: true,
            detail: { email },
          }),
        );
      }
    } catch (error) {
      this.#showError(error.message);
      this.dispatchEvent(
        new CustomEvent("chat:error", {
          bubbles: true,
          composed: true,
          detail: { error },
        }),
      );
    }
  }

  /** Handles logout button click. */
  async #handleLogout() {
    await this.#client.auth.signOut();
    this.dispatchEvent(
      new CustomEvent("chat:logout", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Shows an error message.
   * @param {string} message - Error message
   */
  #showError(message) {
    const errorEl = this.shadowRoot.querySelector("output");
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  /** Renders the component. */
  render() {
    if (!this.#client.auth) {
      this.shadowRoot.innerHTML = `
        <style>${baseStyles}</style>
        <style>${userStyles}</style>
        <p>Authentication not configured.</p>
      `;
      return;
    }

    const { session } = this.#client.auth.getSession();

    if (session) {
      this.shadowRoot.innerHTML = `
        <style>${baseStyles}</style>
        <style>${userStyles}</style>
        <aside>
          <p>Signed in as <strong>${session.user.email}</strong></p>
          <button>Sign Out</button>
        </aside>
      `;

      this.shadowRoot
        .querySelector("button")
        .addEventListener("click", () => this.#handleLogout());
    } else {
      this.shadowRoot.innerHTML = `
        <style>${baseStyles}</style>
        <style>${userStyles}</style>
        <form>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="you@example.com" required />
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Password" required />
          </div>
          <button type="submit">Sign In</button>
          <output></output>
        </form>
      `;

      this.shadowRoot
        .querySelector("form")
        .addEventListener("submit", (e) => this.#handleLogin(e));
    }
  }
}

customElements.define("chat-user", ChatUserElement);
