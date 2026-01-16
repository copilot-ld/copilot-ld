import { common, tool } from "@copilot-ld/libtype";

/**
 * Creates a mock resource index with common test data
 * @param {object} options - Setup options
 * @returns {object} Mock resource index
 */
export function createMockResourceIndex(options = {}) {
  const resources = new Map();

  const index = {
    resources,

    async get(identifiers, _actor) {
      if (!identifiers || identifiers.length === 0) return [];
      return identifiers
        .map((id) => {
          const key = typeof id === "string" ? id : id.toString?.() || id.name;
          return resources.get(key);
        })
        .filter(Boolean);
    },

    put(resource) {
      const key = resource.id?.toString?.() || resource.id?.name;
      if (key) resources.set(key, resource);
    },

    async has(id) {
      const key = typeof id === "string" ? id : id.toString?.();
      return resources.has(key);
    },

    /**
     * Sets up default test resources
     * @param {object} setupOptions - Setup options
     * @param {string[]} [setupOptions.tools] - Tool names for assistant
     * @param {string} [setupOptions.conversationId] - Conversation ID
     * @param {string} [setupOptions.assistantId] - Assistant ID
     * @param {number} [setupOptions.temperature] - Assistant temperature
     */
    setupDefaults(setupOptions = {}) {
      const {
        tools = [],
        conversationId = "test-conversation",
        assistantId = "test-assistant",
        temperature = 0.3,
      } = setupOptions;

      resources.set(
        conversationId,
        common.Conversation.fromObject({
          id: { name: conversationId },
          assistant_id: `common.Assistant.${assistantId}`,
        }),
      );

      resources.set(
        `common.Assistant.${assistantId}`,
        common.Assistant.fromObject({
          id: { name: assistantId, tokens: 50 },
          tools,
          content: "You are a test assistant.",
          temperature,
        }),
      );

      for (const name of tools) {
        resources.set(
          `tool.ToolFunction.${name}`,
          tool.ToolFunction.fromObject({
            id: { name, tokens: 20 },
            name,
            description: `${name} tool`,
          }),
        );
      }
    },

    /**
     * Adds a message resource
     * @param {object} msg - Message to add
     */
    addMessage(msg) {
      const id =
        msg.id?.type && msg.id?.toString
          ? msg.id.toString()
          : msg.id?.name || String(msg.id);
      resources.set(id, msg);
    },
  };

  if (options.tools || options.conversationId || options.assistantId) {
    index.setupDefaults(options);
  }

  return index;
}
