/* eslint-env node */

/**
 * Configuration for the agent
 * @typedef {object} AgentConfig
 * @property {number} budget - Token budget for request processing
 * @property {object} allocation - Budget allocation configuration
 * @property {number} allocation.tools - Ratio for tool memory allocation (0-1)
 * @property {number} allocation.resources - Ratio for resource memory allocation (0-1)
 * @property {number} allocation.results - Ratio for tool results allocation (0-1)
 * @property {string} assistant - Assistant identifier to use
 * @property {string[]} permanent_tools - Array of permanent tool names
 * @property {number} temperature - LLM temperature setting
 * @property {number} threshold - Similarity threshold for queries
 * @property {number} limit - Maximum number of query results
 */

/**
 * Callback interfaces for AgentMind dependencies
 * @typedef {object} Callbacks
 * @property {object} memory - Memory service callbacks
 * @property {(req: import("@copilot-ld/libtype").memory.AppendRequest) => Promise<import("@copilot-ld/libtype").memory.AppendResponse>} memory.append - Append to memory
 * @property {(req: import("@copilot-ld/libtype").memory.GetRequest) => Promise<import("@copilot-ld/libtype").memory.GetResponse>} memory.get - Get memory window
 * @property {object} llm - LLM service callbacks
 * @property {(req: import("@copilot-ld/libtype").llm.CompletionsRequest) => Promise<import("@copilot-ld/libtype").llm.CompletionsResponse>} llm.createCompletions - Create completions
 * @property {object} tool - Tool service callbacks
 * @property {(req: import("@copilot-ld/libtype").tool.CallRequest) => Promise<import("@copilot-ld/libtype").common.Message>} tool.call - Execute tool call
 */

/**
 * Conversation result
 * @typedef {object} Conversation
 * @property {object} conversation - Conversation object
 * @property {object} message - User message object
 * @property {object} assistant - Assistant configuration
 * @property {object[]} tasks - Task array
 * @property {object[]} permanentTools - Permanent tool definitions
 */

/**
 * Memory window result
 * @typedef {object} MemoryWindowResult
 * @property {object[]} messages - Array of messages for LLM
 * @property {object[]} rememberedTools - Tools from memory
 */

/**
 * Tool execution result
 * @typedef {object} ToolExecutionResult
 * @property {object} message - Tool result message
 * @property {boolean} success - Whether execution succeeded
 * @property {string} error - Error message if execution failed
 */

export { AgentMind } from "./mind.js";
export { AgentHands } from "./hands.js";
