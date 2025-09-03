/* eslint-env node */
import { common } from "@copilot-ld/libtype";
import { generateSessionId, getLatestUserMessage } from "@copilot-ld/libutil";

import { AgentBase } from "./service.js";

/**
 * Converts a memory window to a simple messages array for LLM completion
 * @param {import("@copilot-ld/libtype").common.Assistant} assistant - The assistant
 * @param {import("@copilot-ld/libtype").task.Task[]} tasks - Array of tasks
 * @param {import("@copilot-ld/libtype").memory.Window} window - Memory window from memory service
 * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - Resource index for retrieving actual messages
 * @returns {Promise<import("@copilot-ld/libtype").common.MessageV2[]>} Array of MessageV2 objects for LLM
 */
async function toMessages(assistant, tasks, window, resourceIndex) {
  const messages = [];
  const actor = "cld:common.System.root";

  // Add assistant
  messages.push(assistant);

  // Add tasks if available
  if (tasks && tasks.length > 0) {
    messages.push(...tasks);
  }

  // Add tools if available
  if (window?.tools?.length > 0) {
    const tools = await resourceIndex.get(actor, window.tools);
    messages.push(...tools);
  }

  // Add context if available
  if (window?.context?.length > 0) {
    const context = await resourceIndex.get(actor, window.context);
    messages.push(...context);
  }

  // Add conversation history in chronological order
  if (window?.history?.length > 0) {
    const history = await resourceIndex.get(actor, window.history);
    messages.push(...history);
  }

  return messages;
}

/**
 * Main orchestration service for agent requests
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 */
class AgentService extends AgentBase {
  #memoryClient;
  #llmClient;
  #vectorClient;
  #resourceIndex;
  #octokitFactory;

  /**
   * Creates a new Agent service instance
   * @param {object} config - Service configuration object
   * @param {import("../memory/client.js").MemoryClient} memoryClient - Memory service client
   * @param {import("../llm/client.js").LlmClient} llmClient - LLM service client
   * @param {import("../vector/client.js").VectorClient} vectorClient - Vector service client
   * @param {import("@copilot-ld/libresource").ResourceIndexInterface} resourceIndex - ResourceIndex instance for data access
   * @param {(token: string) => object} octokitFactory - Factory function to create Octokit instances
   * @param {() => {grpc: object, protoLoader: object}} [grpcFn] - Optional gRPC factory function
   * @param {(serviceName: string) => object} [authFn] - Optional auth factory function
   * @param {(namespace: string) => object} [logFn] - Optional log factory function
   */
  constructor(
    config,
    memoryClient,
    llmClient,
    vectorClient,
    resourceIndex,
    octokitFactory,
    grpcFn,
    authFn,
    logFn,
  ) {
    super(config, grpcFn, authFn, logFn);
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!llmClient) throw new Error("llmClient is required");
    if (!vectorClient) throw new Error("vectorClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!octokitFactory) throw new Error("octokitFactory is required");

    this.#memoryClient = memoryClient;
    this.#llmClient = llmClient;
    this.#vectorClient = vectorClient;
    this.#resourceIndex = resourceIndex;
    this.#octokitFactory = octokitFactory;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").agent.AgentResponse>} Response message
   */
  async ProcessRequest(req) {
    this.debug("Processing request", {
      conversation: req.conversation_id,
      messages: req.messages?.length || 0,
    });

    // Ensure all clients are ready before processing
    await Promise.all([
      this.#memoryClient.ensureReady(),
      this.#llmClient.ensureReady(),
      this.#vectorClient.ensureReady(),
    ]);

    const octokit = this.#octokitFactory(req.github_token);
    await octokit.request("GET /user");

    const actor = "cld:common.System.root";
    let conversation;
    let completions = {};

    // Step 1: Initiate the conversation
    if (req.conversation_id) {
      [conversation] = await this.#resourceIndex.get(actor, [
        req.conversation_id,
      ]);
    } else {
      conversation = common.Conversation.fromObject({
        id: {
          name: generateSessionId(),
        },
      });
      this.#resourceIndex.put(conversation);
    }

    const message = getLatestUserMessage(req.messages);
    message.withIdentifier(conversation.id);
    this.#resourceIndex.put(message);

    if (message?.content) {
      // Step 2: Load assistant and tasks, subtract from token budget
      const [assistant] = await this.#resourceIndex.get(actor, [
        this.config.assistant,
      ]);

      // TODO: Load task tree
      let tasks = [];

      let budget = this.config.budget?.tokens;
      const allocation = this.config.budget?.allocation;
      budget = Math.max(0, budget - assistant.content.tokens);

      this.debug("Adjusted budget", {
        before: this.config.budget.tokens,
        after: budget,
      });

      // Step 3: Search for similarities and append them to memory
      const embeddings = await this.#llmClient.CreateEmbeddings({
        chunks: [message.content],
        github_token: req.github_token,
      });

      const vector = embeddings.data[0].embedding;

      const { identifiers } = await this.#vectorClient.QueryItems({
        index: "content",
        vector,
        filter: {
          threshold: this.config.threshold,
          limit: this.config.limit,
        },
      });

      this.debug("Similar resources", { identifiers: identifiers.length });

      this.#memoryClient.Append({
        for: conversation.id,
        identifiers,
      });

      // Step 4: Get the memory window
      const window = await this.#memoryClient.GetWindow({
        for: conversation.id,
        vector,
        budget,
        allocation: allocation
          ? {
              tools: Math.round(budget * allocation.tools),
              history: Math.round(budget * allocation.history),
              context: Math.round(budget * allocation.context),
            }
          : undefined,
      });

      // Step 5: Get LLM completion
      completions = await this.#llmClient.CreateCompletions({
        messages: await toMessages(
          assistant,
          tasks,
          window,
          this.#resourceIndex,
        ),
        temperature: this.config.temperature,
        github_token: req.github_token,
      });

      // Step 6: Save the response
      if (completions?.choices?.length > 0) {
        this.debug("Completion received", {
          choices: completions.choices.length,
        });
        completions.choices[0].message.withIdentifier(conversation.id);
        this.#resourceIndex.put(completions.choices[0].message);
      }
    }

    this.debug("Request complete", {
      conversation: conversation.id,
      choices: completions?.choices?.length || 0,
      tokens: completions?.usage?.total_tokens || "unknown",
    });

    // Return properly constructed AgentResponse with typed objects
    return {
      ...completions,
      conversation_id: conversation.id,
    };
  }
}

/**
 * @deprecated This service will be replaced by Assistant, Task, Conversation, and Context services in the new architecture
 */
export { AgentService };
export { AgentClient } from "./client.js";
