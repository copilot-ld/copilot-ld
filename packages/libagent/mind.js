import { generateUUID } from "@copilot-ld/libsecret";
import { memory, common } from "@copilot-ld/libtype";

/**
 * Main planning class that handles conversation setup and orchestration
 */
export class AgentMind {
  #config;
  #callbacks;
  #resourceIndex;
  #hands;

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
    this.#hands = agentHands;
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
   * @param {(resource_id: string, messages: object[]) => void} [onProgress] - Optional callback for streaming progress
   * @returns {Promise<void>}
   */
  async process(req, onProgress) {
    const { conversation, message } = await this.setupConversation(req);

    // The resource we're dealing with is the conversation itself
    const resource_id = String(conversation.id);

    if (message?.id) {
      // Append message to memory with token count for filtering
      await this.#callbacks.memory.append(
        memory.AppendRequest.fromObject({
          resource_id,
          identifiers: [message.id],
        }),
      );

      const llmToken = req.llm_token;
      const model = req.model || this.#config.model;

      /**
       * Saves a resource to the index and memory, and streams to client
       * @param {import("@copilot-ld/libtype").common.Message} message - Message to save
       */
      const saveMessage = async (message) => {
        message.withIdentifier(conversation.id);

        // Persist to storage
        this.#resourceIndex.put(message);

        // Append to memory
        await this.#callbacks.memory.append(
          memory.AppendRequest.fromObject({
            resource_id,
            identifiers: [message.id],
          }),
        );

        // Stream to the client, but skip tool results
        if (onProgress && message.id?.type !== "tool.ToolCallMessage") {
          onProgress(resource_id, [message]);
        }
      };

      // Use AgentHands for tool execution
      await this.#hands.executeToolLoop(resource_id, saveMessage, {
        llmToken,
        model,
      });
    }
  }

  /**
   * Sets up conversation with assistant reference
   * @param {object} req - Request message
   * @returns {Promise<{conversation: object, message: object}>} Setup results
   */
  async setupConversation(req) {
    const actor = "common.System.root";
    let conversation;

    // Step 1: Initiate the conversation
    if (req.resource_id) {
      [conversation] = await this.#resourceIndex.get([req.resource_id], actor);
    }

    // Create new conversation if none exists or none was found
    if (!conversation) {
      const agentName = req.agent || this.#config.agent;
      conversation = common.Conversation.fromObject({
        id: {
          name: generateUUID(),
        },
        agent_id: `common.Agent.${agentName}`,
      });
      this.#resourceIndex.put(conversation);
    }

    const message = this.#getLatestUserMessage(req.messages);

    if (!message) {
      throw new Error("No user message found in request");
    }
    message.withIdentifier(conversation.id);
    this.#resourceIndex.put(message);

    return { conversation, message };
  }
}
