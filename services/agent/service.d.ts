/**
 * Base implementation for Agent gRPC service with typed method stubs.
 * Extends the `Service` class for shared gRPC server functionality.
 */
export class AgentBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers.
   * @returns {Promise<number>} Port number the server is listening on.
   */
  start(): Promise<number>;
  /**
   * gRPC handler for `ProcessRequest`: restores a typed request and delegates to the implementation.
   * @param {object} call - gRPC call object.
   * @returns {Promise<agent.AgentResponse>} Typed response message.
   */
  handleProcessRequest(call: object): Promise<agent.AgentResponse>;
  /**
   * Implement the `ProcessRequest` RPC.
   * @param { agent.AgentRequest } _req - Typed request message.
   * @returns {Promise<agent.AgentResponse>} Typed response message.
   */
  ProcessRequest(_req: agent.AgentRequest): Promise<agent.AgentResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { agent } from "@copilot-ld/libtype";
