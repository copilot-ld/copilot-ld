import { common, tool } from "@copilot-ld/libtype";
import { getModelBudget } from "./models.js";

// Re-export model utilities
export { getModelBudget } from "./models.js";

/**
 * Memory window builder for managing conversation history with budget constraints
 * Builds complete message arrays including assistant, tools, and conversation history
 */
export class MemoryWindow {
  #resourceId;
  #resourceIndex;
  #memoryIndex;
  #experienceInjector;

  /**
   * Creates a new MemoryWindow instance for a specific resource
   * @param {string} resourceId - The resource ID (conversation ID)
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - Resource index for loading resources
   * @param {import("./index/memory.js").MemoryIndex} memoryIndex - Memory index instance for this specific resource
   * @param {import("@copilot-ld/liblearn").ExperienceInjector} [experienceInjector] - Optional experience injector for learned tool experience
   */
  constructor(
    resourceId,
    resourceIndex,
    memoryIndex,
    experienceInjector = null,
  ) {
    if (!resourceId) throw new Error("resourceId is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!memoryIndex) throw new Error("memoryIndex is required");

    this.#resourceId = resourceId;
    this.#resourceIndex = resourceIndex;
    this.#memoryIndex = memoryIndex;
    this.#experienceInjector = experienceInjector;
  }

  /**
   * Builds a complete memory window with messages and tools
   * @param {string} model - Model name to determine budget
   * @param {number} maxTokens - Tokens reserved for LLM output
   * @returns {Promise<{messages: object[], tools: object[]}>} Complete window with messages and tools
   */
  async build(model, maxTokens) {
    if (!model) {
      throw new Error("model is required");
    }
    if (!maxTokens || maxTokens <= 0) {
      throw new Error("maxTokens is required and must be positive");
    }

    const total = getModelBudget(model);
    const actor = "common.System.root";

    // Load conversation to get agent_id
    const [conversation] = await this.#resourceIndex.get(
      [this.#resourceId],
      actor,
    );
    if (!conversation) {
      throw new Error(`Conversation not found: ${this.#resourceId}`);
    }

    // Load agent
    const [agent] = await this.#resourceIndex.get(
      [conversation.agent_id],
      actor,
    );
    if (!agent) {
      throw new Error(`Agent not found: ${conversation.agent_id}`);
    }

    // Load tools from agent configuration
    const toolNames = agent.tools || [];
    const functionIds = toolNames.map((name) => `tool.ToolFunction.${name}`);
    const functions = await this.#resourceIndex.get(functionIds, actor);

    // Calculate overhead (agent + tools tokens)
    const overhead = this.#calculateOverhead(agent, functions);

    // History budget = total - overhead - reserved output tokens
    const historyBudget = Math.max(0, total - overhead - maxTokens);

    // Wrap functions in OpenAI-compatible tool call objects
    const tools = functions.map((f) => this.#normalizeToolFunction(f));

    // Get conversation history within budget
    const identifiers = await this.#filterByBudget(historyBudget);

    // Load full message objects from identifiers
    const history = await this.#resourceIndex.get(identifiers, actor);

    // Build complete messages array
    const messages = await this.#buildMessages(agent, history, toolNames);

    return { messages, tools };
  }

  /**
   * Calculate token overhead from agent and tool definitions
   * @param {object} agent - Agent resource
   * @param {Array} functions - Tool function definitions
   * @returns {number} Total overhead tokens
   */
  #calculateOverhead(agent, functions) {
    let overhead = agent.id?.tokens || 0;
    for (const f of functions) {
      overhead += f.id?.tokens || 0;
    }
    return overhead;
  }

  /**
   * Normalize a tool function for OpenAI compatibility
   * @param {object} f - Tool function definition
   * @returns {object} Normalized tool call object
   */
  #normalizeToolFunction(f) {
    // OpenAI requires parameters.properties and parameters.required even if empty
    // Protobuf3 omits empty fields, so we must ensure they exist
    const params = f.parameters || {};
    const normalizedFunction = {
      ...f,
      parameters: {
        type: params.type || "object",
        properties: params.properties || {},
        required: params.required || [],
      },
    };
    return tool.ToolCall.fromObject({
      type: "function",
      function: normalizedFunction,
    });
  }

  /**
   * Build the complete messages array with optional experience injection
   * @param {object} agent - Agent resource for system message
   * @param {Array} history - Conversation history messages
   * @param {string[]} toolNames - Available tool names
   * @returns {Promise<Array>} Complete messages array
   */
  async #buildMessages(agent, history, toolNames) {
    const messages = [
      common.Message.fromObject({
        role: "system",
        ...agent,
      }),
    ];

    // Inject learned experience after agent system message if available
    if (this.#experienceInjector) {
      const experienceContext = await this.#buildExperienceContext(
        history,
        toolNames,
      );
      if (experienceContext) {
        messages.push(
          common.Message.fromObject({
            role: "system",
            content: experienceContext,
          }),
        );
      }
    }

    // Add conversation history
    messages.push(...history);

    return messages;
  }

  /**
   * Build experience context from the latest user message
   * @param {Array} history - Conversation history
   * @param {string[]} toolNames - Available tool names
   * @returns {Promise<string|null>} Experience context string or null if unavailable
   */
  async #buildExperienceContext(history, toolNames) {
    // Find latest user message
    const userMessage = history.findLast((m) => m.role === "user");
    if (!userMessage?.content) return null;

    return this.#experienceInjector.generateContext(
      userMessage.content,
      toolNames,
    );
  }

  /**
   * Filters memory identifiers by token budget
   * @param {number} budget - Token budget
   * @returns {Promise<import("@copilot-ld/libtype").resource.Identifier[]>} Filtered identifiers
   * @private
   */
  async #filterByBudget(budget) {
    const allIdentifiers = await this.#memoryIndex.queryItems();

    let totalTokens = 0;
    const filtered = [];

    // Process newest first, then break when budget is reached
    for (let i = allIdentifiers.length - 1; i >= 0; i--) {
      const identifier = allIdentifiers[i];
      if (identifier.tokens === undefined || identifier.tokens === null) {
        throw new Error(
          `Identifier missing tokens field: ${JSON.stringify(identifier)}`,
        );
      }

      if (totalTokens + identifier.tokens <= budget) {
        filtered.unshift(identifier);
        totalTokens += identifier.tokens;
      } else {
        break;
      }
    }

    // Ensure tool call integrity: tool messages must be preceded by assistant message
    while (filtered.length > 0 && filtered[0].type === "tool.ToolCallMessage") {
      filtered.shift();
    }

    return filtered;
  }

  /**
   * Appends identifiers to memory in a single operation
   * @param {import("@copilot-ld/libtype").resource.Identifier[]} identifiers - Array of identifiers to append
   * @returns {Promise<void>}
   */
  async append(identifiers) {
    if (!identifiers || identifiers.length === 0) return;
    await this.#memoryIndex.add(identifiers);
  }
}
