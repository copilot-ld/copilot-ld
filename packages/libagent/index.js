/* eslint-env node */

/**
 * Configuration for the agent
 * @typedef {object} AgentConfig
 * @property {string} assistant - Assistant identifier to use
 */

/**
 * Callback interfaces for AgentMind dependencies
 * @typedef {object} Callbacks
 * @property {object} memory - Memory service callbacks
 * @property {(req: import("@copilot-ld/libtype").memory.AppendRequest) => Promise<import("@copilot-ld/libtype").memory.AppendResponse>} memory.append - Append to memory
 * @property {(req: import("@copilot-ld/libtype").memory.BudgetRequest) => Promise<import("@copilot-ld/libtype").memory.BudgetResponse>} memory.getBudget - Get available budget
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
 */

export { AgentMind } from "./mind.js";
export { AgentHands } from "./hands.js";
