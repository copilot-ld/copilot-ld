#!/usr/bin/env node
/* eslint-env node */
import { createScriptConfig } from "@copilot-ld/libconfig";
import { Repl } from "@copilot-ld/librepl";
import { createClient, createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";
import { agent, common } from "@copilot-ld/libtype";
import { createStorage } from "@copilot-ld/libstorage";

const usage = `**Usage:** <message>

Send conversational messages to the Agent service for processing.
The agent maintains conversation context across multiple turns.

**Examples:**

    echo "Tell me about the company" | npm -s run cli:chat
    printf "What is microservices?\\nWhat are the benefits?\\n" | npm -s run cli:chat`;

const config = await createScriptConfig("cli");
const logger = createLogger("cli");
const tracer = await createTracer("cli");
const agentClient = await createClient("agent", logger, tracer);

// Create storage for persisting REPL state
const storage = createStorage("cli");

/**
 * Handles user prompts by adding them to message history,
 * sending to the Agent service, and returning the response
 * @param {string} prompt - The user's input prompt
 * @param {object} state - The REPL state object
 * @returns {Promise<string>} The assistant's response content
 */
async function handlePrompt(prompt, state) {
  // Create user message - content is just a string
  const userMessage = common.Message.fromObject({
    role: "user",
    content: prompt,
  });

  // Create typed request using agent.AgentRequest
  const request = new agent.AgentRequest({
    messages: [userMessage],
    github_token: await config.githubToken(),
    resource_id: state.resource_id,
  });

  const result = await agentClient.ProcessRequest(request);

  if (!result || !result.choices || result.choices.length === 0) {
    throw new Error("No response from agent service");
  }

  if (result.resource_id) {
    state.resource_id = result.resource_id;
  }

  return result.choices[0].message.content;
}

// Create REPL with dependency injection
const repl = new Repl({
  usage,
  storage,
  state: {
    resource_id: null,
  },
  onLine: handlePrompt,
  afterLine: (state) => {
    return logger.debug("ProcessRequest", "Response received", {
      resource_id: state.resource_id,
    });
  },
});

repl.start();
