/**
 * Base class for Agent service with proto-specific method stubs
 * Extends the Service class for common gRPC functionality
 */
export class AgentBase extends Service {
  /**
   * Start the gRPC server with service-specific handlers
   * @returns {Promise<number>} Port number the server is listening on
   */
  start(): Promise<number>;
  /**
   * Handler for ProcessRequest that creates typed data and calls the implementation
   * @param {object} call - gRPC call object
   * @returns {Promise<agent.AgentResponse>} AgentResponse
   */
  handleProcessRequest(call: object): Promise<agent.AgentResponse>;
  /**
   * ProcessRequest RPC method
   * @param { agent.AgentRequest } req - Request message
   * @returns {Promise<agent.AgentResponse>} Response message
   */
  ProcessRequest(req: agent.AgentRequest): Promise<agent.AgentResponse>;
}
import { Service } from "@copilot-ld/libservice";
import { agent } from "@copilot-ld/libtype";
