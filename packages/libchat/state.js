/**
 * Shared state management for chat components.
 * Provides conversation state persistence and synchronization across component instances.
 */

/**
 * In-memory conversation store shared across all component instances.
 * @type {Map<string, {messages: Array, metadata: object}>}
 */
const conversations = new Map();

/**
 * Get or create a conversation state.
 * @param {string} id - Conversation resource ID
 * @returns {{messages: Array, metadata: object}} Conversation state object
 */
export function getConversation(id) {
  if (!id) {
    return { messages: [], metadata: {} };
  }
  if (!conversations.has(id)) {
    conversations.set(id, { messages: [], metadata: {} });
  }
  return conversations.get(id);
}

/**
 * Update a conversation with new messages.
 * @param {string} id - Conversation resource ID
 * @param {Array} messages - Updated messages array
 */
export function updateConversation(id, messages) {
  if (!id) return;
  const conv = getConversation(id);
  conv.messages = messages;
  conversations.set(id, conv);
}

/**
 * Clear a conversation.
 * @param {string} id - Conversation resource ID
 */
export function clearConversation(id) {
  if (!id) return;
  conversations.delete(id);
}

/**
 * Load conversation from localStorage.
 * @returns {{resourceId: string|null, messages: Array}} Conversation data
 */
export function loadFromStorage() {
  const resourceId = localStorage.getItem("agent_resource_id");
  const messagesJson = localStorage.getItem("agent_messages");
  const messages = resourceId && messagesJson ? JSON.parse(messagesJson) : [];
  return { resourceId, messages };
}

/**
 * Save conversation to localStorage.
 * @param {string|null} resourceId - Conversation resource ID
 * @param {Array} messages - Messages to save
 */
export function saveToStorage(resourceId, messages) {
  if (resourceId) {
    localStorage.setItem("agent_resource_id", resourceId);
    localStorage.setItem("agent_messages", JSON.stringify(messages));
  } else {
    localStorage.removeItem("agent_resource_id");
    localStorage.removeItem("agent_messages");
  }
}

/**
 * Load UI state from localStorage.
 * @param {string} key - State key (e.g., 'collapsed', 'expanded')
 * @returns {boolean} UI state value
 */
export function loadUIState(key) {
  return localStorage.getItem(`agent_${key}`) === "true";
}

/**
 * Save UI state to localStorage.
 * @param {string} key - State key (e.g., 'collapsed', 'expanded')
 * @param {boolean} value - State value
 */
export function saveUIState(key, value) {
  localStorage.setItem(`agent_${key}`, value.toString());
}
