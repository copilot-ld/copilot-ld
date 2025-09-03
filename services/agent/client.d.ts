/**
 * Typed client for the Agent gRPC service with automatic type conversion.
 * Extends the `Client` class for shared gRPC client functionality.
 */
export class AgentClient extends Client {
  /**
   * Call the `ProcessRequest` RPC with request/response type conversion.
   * @param { agent.AgentRequest } req - Typed request message.
   * @returns {Promise<agent.AgentResponse>} Typed response message.
   */
  ProcessRequest(req: agent.AgentRequest): Promise<agent.AgentResponse>;
}
import { Client } from "@copilot-ld/libservice";
import { agent } from "@copilot-ld/libtype";
