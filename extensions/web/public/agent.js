class AgentChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.i = -1;
    this.messages = [];
    this.loading = false;
    this.collapsed = localStorage.getItem("agent_collapsed") === "true";
    this.expanded = localStorage.getItem("agent_expanded") === "true";
    this.session_id = localStorage.getItem("agent_session_id");
    const msg = localStorage.getItem("agent_messages");
    if (this.session_id && msg) this.messages = JSON.parse(msg);

    // Microdata functionality
    this.microdataItems = [];
    this.excludedMicrodataIds = new Set();
  }

  connectedCallback() {
    this.extractMicrodata();
    this.update();
    setTimeout(() => this.scrollToBottom(), 0);
  }

  /**
   * Extract microdata from the current page
   */
  extractMicrodata() {
    this.microdataItems = [];

    // Find all elements with itemscope attribute
    const itemscopeElements = document.querySelectorAll("[itemscope]");

    itemscopeElements.forEach((element) => {
      const item = this.extractMicrodataItem(element);
      if (item && item["@id"]) {
        this.microdataItems.push(item);
      }
    });
  }

  /**
   * Extract microdata from a single element
   * @param {Element} element - The element with itemscope
   * @returns {Object} The extracted microdata object
   */
  extractMicrodataItem(element) {
    const item = {};

    // Extract @type from itemtype attribute
    const itemtype = element.getAttribute("itemtype");
    if (itemtype) {
      const match = itemtype.match(/^(.+\/)([^/]+)$/);
      if (match) {
        item["@type"] = match[2];
        item["@context"] = match[1];
      }
    }

    // Extract @id from itemid attribute
    const itemid = element.getAttribute("itemid");
    if (itemid) {
      item["@id"] = itemid.trim();
    }

    // Extract properties from itemprop elements within this scope
    const props = element.querySelectorAll(
      "[itemprop]:not([itemscope] [itemprop])",
    );
    props.forEach((prop) => {
      const propName = prop.getAttribute("itemprop");
      const propValue = this.extractPropertyValue(prop);

      if (item[propName]) {
        // Convert to array if multiple values
        if (Array.isArray(item[propName])) {
          item[propName].push(propValue);
        } else {
          item[propName] = [item[propName], propValue];
        }
      } else {
        item[propName] = propValue;
      }
    });

    return item;
  }

  /**
   * Extract the value from an itemprop element
   * @param {Element} element - The element with itemprop
   * @returns {string|Object} The extracted value
   */
  extractPropertyValue(element) {
    // If element has itemtype, it's a nested object
    if (element.hasAttribute("itemtype")) {
      return this.extractMicrodataItem(element);
    }

    // Extract value based on element type
    const tagName = element.tagName.toLowerCase();
    switch (tagName) {
      case "meta": {
        return element.getAttribute("content") || "";
      }
      case "link":
      case "a": {
        return element.getAttribute("href") || "";
      }
      case "img": {
        return element.getAttribute("src") || "";
      }
      case "input": {
        return element.getAttribute("value") || element.value || "";
      }
      case "select": {
        const selected = element.querySelector("[selected]");
        return selected ? selected.textContent.trim() : "";
      }
      default: {
        return element.textContent.trim();
      }
    }
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

    // Add event listeners for microdata exclusion buttons
    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("exclude-microdata")) {
        const itemId = e.target.dataset.itemId;
        this.excludeMicrodataItem(itemId);
      } else if (e.target.classList.contains("include-microdata")) {
        const itemId = e.target.dataset.itemId;
        this.includeMicrodataItem(itemId);
      }
    });
  }

  /**
   * Exclude a microdata item from being sent to the agent
   * @param {string} itemId - The @id of the microdata item to exclude
   */
  excludeMicrodataItem(itemId) {
    this.excludedMicrodataIds.add(itemId);
    this.update();
  }

  /**
   * Include a previously excluded microdata item
   * @param {string} itemId - The @id of the microdata item to include
   */
  includeMicrodataItem(itemId) {
    this.excludedMicrodataIds.delete(itemId);
    this.update();
  }

  /**
   * Get the active microdata items (not excluded)
   * @returns {Array} Array of active microdata items
   */
  getActiveMicrodataItems() {
    return this.microdataItems.filter(
      (item) => !this.excludedMicrodataIds.has(item["@id"]),
    );
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
      // Prepare request body with microdata context
      const requestBody = {
        message,
        session_id: this.session_id,
      };

      // Add microdata context if available
      const activeMicrodata = this.getActiveMicrodataItems();
      if (activeMicrodata.length > 0) {
        requestBody.microdata_context = activeMicrodata;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      this.session_id = data.session_id;
      localStorage.setItem("agent_session_id", this.session_id);

      this.addMessage("assistant", data.choices[0].message.content);
    } catch (error) {
      console.error("Error:", error);
      this.addMessage("error", `Error: ${error.message}`);
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
    this.session_id = null;
    this.messages = [];
    localStorage.removeItem("agent_session_id");
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

  renderMicrodataItems() {
    if (this.microdataItems.length === 0) {
      return "";
    }

    const activeItems = this.getActiveMicrodataItems();
    const excludedItems = this.microdataItems.filter((item) =>
      this.excludedMicrodataIds.has(item["@id"]),
    );

    return `
      <section class="microdata-section">
        <h4>Page Context</h4>
        ${
          activeItems.length > 0
            ? `
          <div class="microdata-items active">
            <h5>Included:</h5>
            ${activeItems
              .map(
                (item) => `
              <div class="microdata-item">
                <span class="microdata-id">${item["@id"]}</span>
                <button class="exclude-microdata" data-item-id="${item["@id"]}" title="Exclude from context">×</button>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
        ${
          excludedItems.length > 0
            ? `
          <div class="microdata-items excluded">
            <h5>Excluded:</h5>
            ${excludedItems
              .map(
                (item) => `
              <div class="microdata-item excluded">
                <span class="microdata-id">${item["@id"]}</span>
                <button class="include-microdata" data-item-id="${item["@id"]}" title="Include in context">+</button>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </section>
    `;
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
      ${this.renderMicrodataItems()}
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
      
      .microdata-section {
        padding: 12px 16px 0;
        border-bottom: 1px solid var(--border);
        background: var(--bg-secondary);
      }
      
      .microdata-section h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text);
      }
      
      .microdata-section h5 {
        margin: 8px 0 4px 0;
        font-size: 12px;
        font-weight: 500;
        color: var(--text);
        opacity: 0.8;
      }
      
      .microdata-items {
        margin-bottom: 8px;
      }
      
      .microdata-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        margin: 2px 0;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 12px;
      }
      
      .microdata-item.excluded {
        opacity: 0.6;
        background: var(--bg-secondary);
      }
      
      .microdata-id {
        flex: 1;
        color: var(--accent);
        font-family: ui-monospace, monospace;
        word-break: break-all;
      }
      
      .exclude-microdata,
      .include-microdata {
        width: 20px;
        height: 20px;
        margin-left: 8px;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 3px;
        color: var(--text);
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .exclude-microdata:hover {
        background: var(--error);
        color: white;
        border-color: var(--error);
      }
      
      .include-microdata:hover {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
      }
    `;
  }
}

customElements.define("agent-chat", AgentChat);
