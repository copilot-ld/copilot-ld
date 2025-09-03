/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { agent } from "@copilot-ld/libtype";

/**
 * Base implementation for Agent gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class AgentBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  async start() {
    const proto = await this.loadProto("agent.proto");
    const serviceDefinition = proto.Agent.service;

    const handlers = {};
    handlers.ProcessRequest = this.handleProcessRequest;

    return super.start(serviceDefinition, handlers);
  }

  /**
   * gRPC handler for `ProcessRequest`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<agent.AgentResponse>} Typed response message.
   */
  async handleProcessRequest(call) {
    const req = agent.AgentRequest.fromObject(call.request);
    return this.ProcessRequest(req);
  }

  /**
   * Implement the `ProcessRequest` RPC.
   * @param { agent.AgentRequest } _req - Typed request message.
   * @returns {Promise<agent.AgentResponse>} Typed response message.
   */
  async ProcessRequest(_req) {
    throw new Error("Not implemented");
  }
}
