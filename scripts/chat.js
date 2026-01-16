#!/usr/bin/env node
import { createServiceConfig } from "@copilot-ld/libconfig";
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

const config = await createServiceConfig("agent");
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
 * @param {import("stream").Writable} outputStream - Stream to write results to
 */
async function handlePrompt(prompt, state, outputStream) {
  try {
    // Create user message - content is just a string
    const userMessage = common.Message.fromObject({
      role: "user",
      content: prompt,
    });

    // Create typed request using agent.AgentRequest
    const request = agent.AgentRequest.fromObject({
      messages: [userMessage],
      llm_token: await config.llmToken(),
      resource_id: state.resource_id,
      model: config.model,
    });

    const stream = agentClient.ProcessStream(request);

    for await (const response of stream) {
      if (response.resource_id) {
        state.resource_id = response.resource_id;
      }
      if (response.messages?.length > 0) {
        const text = response.messages.map((msg) => msg.content).join("\n");
        outputStream.write(text);
      }
    }
  } catch (err) {
    logger.exception("ProcessStream", err);
    throw err;
  }
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
    return logger.debug("ProcessStream", "Stream ended", {
      resource_id: state.resource_id,
    });
  },
});

repl.start();
