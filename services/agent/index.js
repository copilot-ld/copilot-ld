/* eslint-env node */
import { AgentMind } from "@copilot-ld/libagent";
import { services } from "@copilot-ld/librpc";

const { AgentBase } = services;

/**
 * Main orchestration service for agent requests
 */
class AgentService extends AgentBase {
  #mind;
  #octokitFn;

  /**
   * Creates a new Agent service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {object} memoryClient - Memory service client
   * @param {object} llmClient - LLM service client
   * @param {object} toolClient - Tool service client
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance for data access
   * @param {(token: string) => import("@octokit/rest").Octokit} octokitFn - Factory function to create Octokit instances
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
   */
  constructor(
    config,
    memoryClient,
    llmClient,
    toolClient,
    resourceIndex,
    octokitFn,
    logFn,
  ) {
    super(config, logFn);
    if (!memoryClient) throw new Error("memoryClient is required");
    if (!llmClient) throw new Error("llmClient is required");
    if (!toolClient) throw new Error("toolClient is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!octokitFn) throw new Error("octokitFn is required");

    this.#octokitFn = octokitFn;

    // Create service callback adapters for the AgentMind
    const callbacks = {
      memory: {
        append: async (req) => await memoryClient.Append(req),
        get: async (req) => await memoryClient.Get(req),
      },
      llm: {
        createCompletions: async (req) =>
          await llmClient.CreateCompletions(req),
      },
      tool: {
        call: async (req) => await toolClient.Call(req),
      },
    };

    // Initialize the AgentMind with dependencies
    this.#mind = new AgentMind(config, callbacks, resourceIndex);
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

    // Validate GitHub token at service level
    const octokit = this.#octokitFn(req.github_token);
    await octokit.request("GET /user");

    // Delegate to AgentMind for business logic
    const response = await this.#mind.processRequest(req);

    this.debug("Request processed", {
      conversation: response.conversation_id,
      choices: response.choices?.length || 0,
    });

    return response;
  }
}

export { AgentService };
