/* eslint-env node */
import { services } from "@copilot-ld/librpc";

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
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory function
   */
  constructor(config, agentMind, octokitFn, logFn) {
    super(config, logFn);
    if (!agentMind) throw new Error("agentMind is required");
    if (!octokitFn) throw new Error("octokitFn is required");

    this.#mind = agentMind;
    this.#octokitFn = octokitFn;
  }

  /**
   * @inheritdoc
   * @param {import("@copilot-ld/libtype").agent.AgentRequest} req - Request message
   * @returns {Promise<import("@copilot-ld/libtype").agent.AgentResponse>} Response message
   */
  async ProcessRequest(req) {
    const octokit = this.#octokitFn(req.github_token);
    await octokit.request("GET /user");

    const response = await this.#mind.processRequest(req);

    return response;
  }
}
