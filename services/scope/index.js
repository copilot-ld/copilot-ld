/* eslint-env node */
import { resolveScope } from "@copilot-ld/libscope";
import { Service } from "@copilot-ld/libservice";

import { ScopeServiceInterface } from "./types.js";

/**
 * Scope resolution service using vector similarity
 * @implements {ScopeServiceInterface}
 */
class ScopeService extends Service {
  #index;

  /**
   * Creates a new Scope service instance
   * @param {object} config - Service configuration object
   * @param {object} index - Vector index for scope resolution
   */
  constructor(config, index) {
    super(config);
    this.#index = index;
  }

  /**
   * Resolves scope indices based on vector similarity
   * @param {object} request - Request object containing vector data
   * @param {number[]} request.vector - Input vector for scope resolution
   * @returns {Promise<object>} Response containing resolved scope indices
   */
  async ResolveScope({ vector }) {
    const indices = await resolveScope(vector, this.#index);
    return { indices };
  }
}

export { ScopeService, ScopeServiceInterface };
