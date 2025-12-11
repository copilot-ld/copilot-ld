/* eslint-env browser */
/* global microsoftTeams */

/**
 * Settings application for Microsoft Teams integration
 */
class SettingsApp {
  #context = null;
  #enforceTeamsContainer = true;
  #runInTeamsWarningHtml =
    "<p>This page must be loaded in Microsoft Teams.</p>";
  #defaultDelayMs = 5000;
  #loggingElementId = "logging";
  #hostElementId = "host";
  #portElementId = "port";
  #formElementId = "settings-form";

  constructor(options = {}) {
    this.#enforceTeamsContainer = options.enforceTeamsContainer ?? true;
    this.#defaultDelayMs = options.defaultDelayMs ?? 5000;
    this.#loggingElementId = options.loggingElementId ?? "logging";
    this.#hostElementId = options.hostElementId ?? "host";
    this.#portElementId = options.portElementId ?? "port";
    this.#formElementId = options.formElementId ?? "settings-form";
  }

  /**
   * Initialize the settings application
   */
  async initialize() {
    this.#context = await this.#initTeamsAppContext();

    // Optionally, check if running in Teams
    if (!this.#context && this.#enforceTeamsContainer) {
      document.body.innerHTML = this.#runInTeamsWarningHtml;
    }

    await this.fetchAndPopulateSettings();
    this.#setupFormHandler();
  }

  /**
   * Setup form submit handler
   */
  #setupFormHandler() {
    const form = document.getElementById(this.#formElementId);
    if (form) {
      form.addEventListener("submit", (e) => this.#formSubmitHandler(e));
    }
  }

  /**
   * Set a message in the logging element
   * @param {string} message - Message to display
   */
  setMessage(message) {
    const logging = document.getElementById(this.#loggingElementId);
    if (logging) {
      logging.innerHTML = message;
    }
    console.log(message);
  }

  /**
   * Set a message and then clear it after a delay
   * @param {string} message - Message to display
   * @param {number} delay - Delay in milliseconds before clearing
   */
  setMessageThenClear(message, delay = this.#defaultDelayMs) {
    this.setMessage(message);
    setTimeout(() => this.setMessage(""), delay);
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast ("success" or "error")
   */
  #showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Fetch current settings and populate form fields
   * @returns {Promise<void>}
   */
  async fetchAndPopulateSettings() {
    try {
      const teamsToken = await this.#getAuthToken();
      const response = await fetch("/api/settings", {
        method: "GET",
        headers: {
          ...(teamsToken ? { Authorization: `Bearer ${teamsToken}` } : {}),
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.host !== undefined) {
          const hostElement = document.getElementById(this.#hostElementId);
          if (hostElement) {
            hostElement.value = data.host;
          }
        }
        if (data.port !== undefined) {
          const portElement = document.getElementById(this.#portElementId);
          if (portElement) {
            portElement.value = data.port;
          }
        }
        this.setMessage("Got Settings ✅");
      } else {
        this.setMessage("Failed to load settings.");
      }
    } catch (err) {
      this.setMessage("Error loading settings: " + err);
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   * @returns {Promise<void>}
   */
  async #formSubmitHandler(e) {
    e.preventDefault();
    // Collect form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const teamsToken = await this.#getAuthToken();

    if (!teamsToken) {
      this.#showToast("Authentication required", "error");
      this.setMessage("❌ Authentication failed");
      return;
    }

    // Send to backend with bearer token
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teamsToken}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        this.#showToast("Settings saved successfully!");
        this.setMessageThenClear("Settings saved successfully! ✅");
        await this.#sendTeamsNotification();
      } else {
        const msg = await response.text();
        this.#showToast("Failed to save settings: " + msg, "error");
        this.setMessage("❌ Failed to save settings");
      }
    } catch (err) {
      this.#showToast("Error saving settings: " + err, "error");
      this.setMessage(" ❌ Error saving settings: " + err);
    }
  }

  /**
   * Get authentication token from Microsoft Teams
   * @returns {Promise<string|null>} Authentication token or null if failed
   */
  async #getAuthToken() {
    try {
      const token = await microsoftTeams.authentication.getAuthToken();
      this.setMessage("Got Token ✅");
      return token;
    } catch (e) {
      this.setMessage("Token Error ❌ : " + e);
      return null;
    }
  }

  /**
   * Send Teams notification
   * @returns {Promise<void>}
   */
  async #sendTeamsNotification() {
    try {
      await microsoftTeams.app.notifySuccess();
    } catch (e) {
      console.error("Teams notification not available", e);
    }
  }

  /**
   * Initialize Microsoft Teams app context
   * @returns {Promise<object|null>} Teams context or null if initialization fails
   */
  async #initTeamsAppContext() {
    try {
      await microsoftTeams.app.initialize();
      try {
        return await microsoftTeams.app.getContext();
      } catch (e) {
        console.error("Failed to get Teams context:", e);
        return null;
      }
    } catch (e) {
      console.error("Failed to get Teams context, container missing", e);
      if (this.#enforceTeamsContainer) {
        document.body.innerHTML = this.#runInTeamsWarningHtml;
      }
      return null;
    }
  }
}

export { SettingsApp };
