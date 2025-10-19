/* eslint-env node */
import { generateUUID } from "@copilot-ld/libutil";
import { memory, common, tool } from "@copilot-ld/libtype";

/**
 * Main planning class that handles conversation setup, tool execution loops,
 * message format conversion, and token budget management
 */
export class AgentMind {
  #config;
  #callbacks;
  #resourceIndex;
  #agentHands;

  /**
   * Creates a new AgentMind instance
   * @param {import("./index.js").AgentConfig} config - Agent configuration
   * @param {import("./index.js").Callbacks} callbacks - Service callback functions
   * @param {object} resourceIndex - Resource index for data access
   * @param {import("./hands.js").AgentHands} agentHands - AgentHands instance for tool execution
   */
  constructor(config, callbacks, resourceIndex, agentHands) {
    if (!config) throw new Error("config is required");
    if (!callbacks) throw new Error("callbacks is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!agentHands) throw new Error("agentHands is required");

    this.#config = config;
    this.#callbacks = callbacks;
    this.#resourceIndex = resourceIndex;
    this.#agentHands = agentHands;
  }

  /**
   * Finds the most recent user message in a conversation
   * @param {import("@copilot-ld/libtype").common.Message[]} messages - Array of conversation messages
   * @returns {import("@copilot-ld/libtype").common.Message|null} Latest user message or null if none found
   * @private
   */
  #getLatestUserMessage(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return null;
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i];
      }
    }
    return null;
  }

  /**
   * Processes an agent request with full orchestration
   * @param {object} req - Agent request object
   * @returns {Promise<object>} Agent response object
   */
  async processRequest(req) {
    const { assistant, permanentTools, conversation, message, tasks } =
      await this.setupConversation(req);

    if (message?.id) {
      // Append message to memory
      await this.#callbacks.memory.append(
        memory.AppendRequest.fromObject({
          for: conversation.id.toString(),
          identifiers: [message.id],
        }),
      );

      const budget = this.calculateBudget(assistant, permanentTools, tasks);

      const { messages, rememberedTools } = await this.getMemoryWindow(
        conversation,
        assistant,
        tasks,
        budget,
      );

      // Combine permanent and remembered tools, de-duplicating by identifier
      const tools = [
        ...permanentTools,
        ...rememberedTools.filter(
          (rt) => !permanentTools.find((pt) => pt.id?.name === rt.id?.name),
        ),
      ];

      // Special parameters to pass down to tools and LLM calls
      const maxTokens = Math.round(
        budget * this.#config.budget?.allocation?.results,
      );
      const githubToken = req.github_token;

      // Use AgentHands for tool execution
      const completions = await this.#agentHands.executeToolLoop(
        messages,
        tools,
        maxTokens,
        githubToken,
      );

      // Save the response
      if (completions?.choices?.length > 0) {
        completions.choices[0].message.withIdentifier(conversation.id);
        this.#resourceIndex.put(completions.choices[0].message);
        await this.#callbacks.memory.append(
          memory.AppendRequest.fromObject({
            for: conversation.id.toString(),
            identifiers: [completions.choices[0].message.id],
          }),
        );
      }

      return {
        ...completions,
        conversation_id: conversation.id.toString(),
      };
    }

    return { conversation_id: conversation.id.toString() };
  }

  /**
   * Sets up conversation and loads assistant configuration
   * @param {object} req - Request message
   * @returns {Promise<import("./index.js").Conversation>} Setup results
   */
  async setupConversation(req) {
    const actor = "common.System.root";
    let conversation;

    // Step 1: Initiate the conversation
    if (req.conversation_id) {
      [conversation] = await this.#resourceIndex.get(actor, [
        req.conversation_id,
      ]);
    } else {
      conversation = common.Conversation.fromObject({
        id: {
          name: generateUUID(),
        },
      });
      this.#resourceIndex.put(conversation);
    }

    const message = this.#getLatestUserMessage(req.messages);

    if (!message) {
      throw new Error("No user message found in request");
    }
    message.withIdentifier(conversation.id);
    this.#resourceIndex.put(message);

    // Step 2: Load assistant and tasks, subtract from token budget
    const [assistant] = await this.#resourceIndex.get(actor, [
      `common.Assistant.${this.#config.assistant}`,
    ]);

    if (!assistant) {
      throw new Error(`Assistant not found: ${this.#config.assistant}`);
    }

    // Load permanent tools from config
    const permanentToolNames = this.#config.permanent_tools || [];
    const functionIds = permanentToolNames.map(
      (name) => `tool.ToolFunction.${name}`,
    );
    const functions = await this.#resourceIndex.get(
      "common.System.root",
      functionIds,
    );

    const permanentTools = functions.map((func) => {
      return tool.ToolDefinition.fromObject({
        type: "function",
        function: func,
      });
    });

    // TODO: Load task tree
    const tasks = [];

    return { conversation, message, assistant, tasks, permanentTools };
  }

  /**
   * Converts a memory window to messages array for LLM completion
   * @param {object} assistant - The assistant configuration
   * @param {object[]} tasks - Array of tasks
   * @param {object} window - Memory window from memory service
   * @returns {Promise<object[]>} Array of Message objects for LLM
   */
  async buildMessages(assistant, tasks, window) {
    if (!assistant) throw new Error("assistant is required");

    const messages = [];
    const actor = "common.System.root";

    // Add assistant
    messages.push(assistant);

    // Add tasks if available
    if (tasks && tasks.length > 0) {
      messages.push(...tasks);
    }

    // Add tools if available
    const tools = await this.#resourceIndex.get(actor, window?.tools);
    messages.push(...tools);

    // Add context if available
    const context = await this.#resourceIndex.get(actor, window?.context);
    messages.push(...context);

    // Add conversation history in chronological order
    const history = await this.#resourceIndex.get(actor, window?.history);
    messages.push(...history);

    return messages;
  }

  /**
   * Converts tool function resources to tool definition objects for LLM
   * @param {object[]} identifiers - Array of ToolFunction resources
   * @returns {Promise<object[]>} Array of Tool objects for LLM
   */
  async buildTools(identifiers) {
    const actor = "common.System.root";
    const functions = await this.#resourceIndex.get(actor, identifiers);

    return functions.map((func) => {
      return tool.ToolDefinition.fromObject({
        type: "function",
        function: func,
      });
    });
  }

  /**
   * Calculates adjusted token budget based on resources used
   * @param {object} assistant - Assistant resource
   * @param {object[]} permanentTools - Permanent tools
   * @param {object[]} tasks - Task resources
   * @returns {number} Adjusted token budget
   */
  calculateBudget(assistant, permanentTools, tasks) {
    let budget = this.#config.budget?.tokens;

    // Subtract tokens used by assistant configuration
    budget = Math.max(0, budget - assistant.content.tokens);

    // Subtract tokens used by permanent tools
    // Tools only have a token count on their descriptor as the "content"
    // is the function definition
    for (const tool of permanentTools) {
      budget = Math.max(0, budget - (tool.descriptor?.tokens || 0));
    }

    // Subtract tokens used by tasks
    for (const task of tasks) {
      budget = Math.max(0, budget - (task.descriptor?.tokens || 0));
    }

    return budget;
  }

  /**
   * Creates memory window without performing vector search
   * @param {object} conversation - Conversation object
   * @param {object} assistant - Assistant configuration
   * @param {object[]} tasks - Tasks array
   * @param {number} budget - Token budget
   * @returns {Promise<import("./index.js").MemoryWindowResult>} Memory results
   */
  async getMemoryWindow(conversation, assistant, tasks, budget) {
    const allocation = this.#config.budget?.allocation;

    const window = await this.#callbacks.memory.get(
      memory.GetRequest.fromObject({
        for: String(conversation.id),
        budget,
        allocation: allocation
          ? memory.GetRequest.Allocation.fromObject({
              tools: allocation.tools,
              history: allocation.history,
            })
          : undefined,
      }),
    );

    // Convert window to messages and tools
    const messages = await this.buildMessages(assistant, tasks, window);

    let rememberedTools = [];
    if (window?.tools.length > 0) {
      rememberedTools = await this.buildTools(window.tools);
    }

    return { messages, rememberedTools };
  }
}
