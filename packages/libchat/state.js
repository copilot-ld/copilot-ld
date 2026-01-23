/**
 * State management for chat components.
 * Provides conversation state persistence and synchronization.
 * @module libchat/state
 */

const RESOURCE_KEY = "chat_resource_id";
const MESSAGES_KEY = "chat_messages";

/**
 * @typedef {object} Message
 * @property {string} role - Message role (user, assistant, tool, error)
 * @property {string} content - Message content
 */

/**
 * State management for chat conversations.
 * @example
 * const state = new ChatState(localStorage);
 * state.resourceId = "abc-123";
 * state.addMessage({ role: "user", content: "Hello" });
 */
export class ChatState {
  #storage;
  #resourceId;
  #messages;
  #listeners;

  /**
   * Creates a ChatState instance.
   * @param {Storage} storage - Storage implementation (localStorage, sessionStorage, etc.)
   */
  constructor(storage) {
    if (!storage) throw new Error("storage is required");
    this.#storage = storage;
    this.#resourceId = null;
    this.#messages = [];
    this.#listeners = [];
    this.#load();
  }

  /**
   * Gets the current resource ID.
   * @returns {string|null} Resource ID or null
   */
  get resourceId() {
    return this.#resourceId;
  }

  /**
   * Sets the resource ID and persists to storage.
   * @param {string|null} id - Resource ID
   */
  set resourceId(id) {
    this.#resourceId = id;
    this.#persist();
    this.#notify();
  }

  /**
   * Gets a copy of the current messages.
   * @returns {Array<Message>} Messages array
   */
  get messages() {
    return [...this.#messages];
  }

  /**
   * Adds a message to the conversation.
   * @param {Message} message - Message to add
   */
  addMessage(message) {
    this.#messages.push(message);
    this.#persist();
    this.#notify();
  }

  /**
   * Updates the last message content.
   * @param {string} content - New content to append
   */
  appendToLastMessage(content) {
    const last = this.#messages[this.#messages.length - 1];
    if (last) {
      last.content += content;
      this.#persist();
      this.#notify();
    }
  }

  /**
   * Replaces all messages.
   * @param {Array<Message>} messages - New messages array
   */
  setMessages(messages) {
    this.#messages = [...messages];
    this.#persist();
    this.#notify();
  }

  /**
   * Clears the conversation state.
   */
  clear() {
    this.#resourceId = null;
    this.#messages = [];
    this.#persist();
    this.#notify();
  }

  /**
   * Registers a state change listener.
   * @param {() => void} callback - Listener callback
   * @returns {() => void} Unsubscribe function
   */
  onStateChange(callback) {
    this.#listeners.push(callback);
    return () => {
      const index = this.#listeners.indexOf(callback);
      if (index > -1) {
        this.#listeners.splice(index, 1);
      }
    };
  }

  /** Loads state from storage. */
  #load() {
    const resourceId = this.#storageGet(RESOURCE_KEY);
    const messagesJson = this.#storageGet(MESSAGES_KEY);

    this.#resourceId = resourceId;
    this.#messages = messagesJson ? JSON.parse(messagesJson) : [];
  }

  /** Persists state to storage. */
  #persist() {
    if (this.#resourceId) {
      this.#storageSet(RESOURCE_KEY, this.#resourceId);
      this.#storageSet(MESSAGES_KEY, JSON.stringify(this.#messages));
    } else {
      this.#storageRemove(RESOURCE_KEY);
      this.#storageRemove(MESSAGES_KEY);
    }
  }

  /** Notifies all listeners of state change. */
  #notify() {
    for (const callback of this.#listeners) {
      callback();
    }
  }

  /**
   * Gets item from storage (supports both localStorage and Map).
   * @param {string} key - Storage key
   * @returns {string|null} Stored value or null
   */
  #storageGet(key) {
    if (typeof this.#storage.getItem === "function") {
      return this.#storage.getItem(key);
    }
    return this.#storage.get(key) ?? null;
  }

  /**
   * Sets item in storage (supports both localStorage and Map).
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  #storageSet(key, value) {
    if (typeof this.#storage.setItem === "function") {
      this.#storage.setItem(key, value);
    } else {
      this.#storage.set(key, value);
    }
  }

  /**
   * Removes item from storage (supports both localStorage and Map).
   * @param {string} key - Storage key
   */
  #storageRemove(key) {
    if (typeof this.#storage.removeItem === "function") {
      this.#storage.removeItem(key);
    } else {
      this.#storage.delete(key);
    }
  }
}
