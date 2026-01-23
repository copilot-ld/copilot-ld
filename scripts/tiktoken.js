#!/usr/bin/env node
import { encoding_for_model } from "tiktoken";

const usage = `Usage: make cli-window ARGS="<resource_id>" | make cli-tiktoken

Counts tokens in a memory window JSON using tiktoken (cl100k_base encoding).

Example:
  make cli-window ARGS="common.Conversation.abc123" | make cli-tiktoken`;

/**
 * Reads all stdin input as a string
 * @returns {Promise<string>} The complete stdin content
 */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Counts tokens in a string using tiktoken
 * @param {import("tiktoken").Tiktoken} encoder - Tiktoken encoder instance
 * @param {string} text - Text to count tokens for
 * @returns {number} Token count
 */
function countTokens(encoder, text) {
  if (!text) return 0;
  return encoder.encode(text).length;
}

/**
 * Counts tokens for tool calls in a message
 * @param {import("tiktoken").Tiktoken} encoder - Tiktoken encoder instance
 * @param {Array<object>} toolCalls - Array of tool call objects
 * @returns {number} Total token count for tool calls
 */
function countToolCallTokens(encoder, toolCalls) {
  if (!toolCalls || !Array.isArray(toolCalls)) return 0;

  let total = 0;
  for (const call of toolCalls) {
    if (call.function) {
      total += countTokens(encoder, call.function.name);
      total += countTokens(encoder, call.function.arguments);
    }
  }
  return total;
}

/**
 * Counts tokens in a memory window JSON structure
 * @param {object} window - Memory window object with messages array
 * @returns {{ total: number, breakdown: Array<{ role: string, tokens: number }> }} Token count and breakdown by message
 */
function countWindowTokens(window) {
  const encoder = encoding_for_model("gpt-4o");
  const breakdown = [];
  let total = 0;

  if (!window.messages || !Array.isArray(window.messages)) {
    encoder.free();
    return { total: 0, breakdown: [] };
  }

  for (const msg of window.messages) {
    let msgTokens = 0;

    // Count content tokens
    msgTokens += countTokens(encoder, msg.content);

    // Count tool call tokens
    msgTokens += countToolCallTokens(encoder, msg.tool_calls);

    // Count tool_call_id for tool responses
    msgTokens += countTokens(encoder, msg.tool_call_id);

    breakdown.push({
      role: msg.role,
      tokens: msgTokens,
    });
    total += msgTokens;
  }

  encoder.free();
  return { total, breakdown };
}

/**
 * Main entry point - reads JSON from stdin and outputs token counts
 * @returns {Promise<void>}
 */
async function main() {
  const input = await readStdin();

  if (!input.trim()) {
    console.error(usage);
    process.exit(1);
  }

  const window = JSON.parse(input);
  const { total, breakdown } = countWindowTokens(window);

  // Output summary by role
  const byRole = {};
  for (const { role, tokens } of breakdown) {
    byRole[role] = (byRole[role] || 0) + tokens;
  }

  console.log("Token count by role:");
  for (const [role, tokens] of Object.entries(byRole)) {
    console.log(`  ${role}: ${tokens}`);
  }
  console.log(`\nTotal: ${total} tokens`);
}

main();
