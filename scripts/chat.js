#!/usr/bin/env node
/* eslint-env node */
import { Repl } from "@copilot-ld/librepl";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { agent, common } from "@copilot-ld/libtype";

import { clients } from "@copilot-ld/librpc";

// Extract generated clients
const { AgentClient } = clients;

/** @typedef {import("@copilot-ld/libtype").common.Message} Message */

const config = await ServiceConfig.create("agent");
const agentClient = new AgentClient(config);

// Global state
/** @type {string|null} */
let conversationId = null;
/** @type {Message[]} */
const messages = [];

/**
 * Handles user prompts by adding them to message history,
 * sending to the Agent service, and returning the response
 * @param {string} prompt - The user's input prompt
 * @returns {Promise<string>} The assistant's response content
 */
async function handlePrompt(prompt) {
  // Create user message using Message structure with proper Content object
  const userMessage = common.Message.fromObject({
    role: "user",
    content: {
      text: prompt,
      tokens: 0, // Will be calculated by the service
    },
  });
  messages.push(userMessage);

  // Create typed request using agent.AgentRequest
  const request = new agent.AgentRequest({
    messages: messages,
    github_token: await config.githubToken(),
    conversation_id: conversationId || undefined,
  });

  const result = await agentClient.ProcessRequest(request);

  if (!result || !result.choices || result.choices.length === 0) {
    throw new Error("No response from agent service");
  }

  if (result.conversation_id) {
    conversationId = result.conversation_id;
  }

  messages.push(result.choices[0].message);
  return result.choices[0].message.content.text;
}

// Create REPL with dependency injection
const repl = new Repl(createTerminalFormatter(), {
  help: `Usage: <message>`,

  commands: {
    clear: (_args, _state) => {
      messages.length = 0;
      conversationId = null;
    },
  },

  onLine: handlePrompt,
});

repl.start();
