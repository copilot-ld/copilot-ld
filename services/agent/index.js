/* eslint-env node */
import { services } from "@copilot-ld/librpc";
import { agent } from "@copilot-ld/libtype";

const { AgentBase } = services;

/**
 * Main orchestration service for agent requests
 */
export class AgentService extends AgentBase {
  #mind;
  #octokitFn;

  /**
   * Creates a new Agent service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfig} config - Service configuration object
   * @param {import("@copilot-ld/libagent").AgentMind} agentMind - AgentMind instance for request orchestration
   * @param {(token: string) => import("@octokit/rest").Octokit} octokitFn - Factory function to create Octokit instances
   */
  constructor(config, agentMind, octokitFn) {
    super(config);
    if (!agentMind) throw new Error("agentMind is required");
    if (!octokitFn) throw new Error("octokitFn is required");

    this.#mind = agentMind;
    this.#octokitFn = octokitFn;
  }

  /**
   * @inheritdoc
   * @param {agent.AgentRequest} req - The agent request
   * @param {(response: agent.AgentResponse) => void} write - Callback to write response messages
   */
  async ProcessStream(req, write) {
    const octokit = this.#octokitFn(req.github_token);
    await octokit.request("GET /user");

    const onProgress = (resource_id, messages) => {
      write({ resource_id, messages });
    };

    await this.#mind.process(req, onProgress);
  }

  /**
   * @inheritdoc
   * @param {agent.AgentRequest} req - The agent request
   * @returns {Promise<agent.AgentResponse>} The agent response
   */
  async ProcessUnary(req) {
    const octokit = this.#octokitFn(req.github_token);
    await octokit.request("GET /user");

    /** @type {agent.AgentResponse} */
    let finalResponse;

    const onProgress = (resource_id, messages) => {
      finalResponse = { resource_id, messages };
    };

    await this.#mind.process(req, onProgress);

    return finalResponse;
  }
}
