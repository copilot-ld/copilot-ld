/* eslint-env node */
import readline from "readline";

import { Repl } from "@copilot-ld/librepl";
import { createTerminalFormatter } from "@copilot-ld/libformat";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { agent, common } from "@copilot-ld/libtype";

import { clients } from "@copilot-ld/librpc";

// Extract generated clients
const { AgentClient } = clients;

/** @typedef {import("@copilot-ld/libtype").common.MessageV2} MessageV2 */

const config = await ServiceConfig.create("agent");
const agentClient = new AgentClient(config);

// Global state
/** @type {string|null} */
let conversationId = null;
/** @type {MessageV2[]} */
const messages = [];

/**
 * Handles user prompts by adding them to message history,
 * sending to the Agent service, and returning the response
 * @param {string} prompt - The user's input prompt
 * @returns {Promise<string>} The assistant's response content
 */
async function handlePrompt(prompt) {
  // Create user message using MessageV2 structure
  const userMessage = common.MessageV2.fromObject({
    role: "user",
    content: prompt,
  });
  messages.push(userMessage);

  try {
    // Ensure client is ready before making requests
    await agentClient.ensureReady();

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

    // Extract text content from the response message
    const responseContent = result.choices[0].message.content;
    if (typeof responseContent === "string") {
      return responseContent;
    } else if (responseContent && responseContent.text) {
      return responseContent.text;
    } else {
      return "Received empty response from agent service.";
    }
  } catch (error) {
    console.error("Error communicating with agent service:", error.message);

    // Provide helpful error messages for common issues
    if (error.message.includes("SERVICE_AUTH_SECRET")) {
      return "Error: SERVICE_AUTH_SECRET environment variable is required for gRPC authentication. Please set it in your .env file.";
    }

    if (error.message.includes("ECONNREFUSED")) {
      return "Error: Cannot connect to Agent service. Please ensure the Agent service is running.";
    }

    return "Sorry, I encountered an error processing your request.";
  }
}

// Create REPL with dependency injection
const repl = new Repl(readline, process, createTerminalFormatter(), {
  commands: {
    clear: {
      help: "Clear conversation history",
      handler: () => {
        messages.length = 0;
        conversationId = null;
        console.log("Conversation history and session cleared.");
      },
    },
    status: {
      help: "Show connection status",
      handler: () => {
        console.log(
          `Agent service configured at ${config.host}:${config.port}`,
        );
        console.log(
          `GitHub token: ${config.githubToken() ? "configured" : "not set"}`,
        );
        console.log(
          `Service auth: ${process.env.SERVICE_AUTH_SECRET ? "configured" : "not set"}`,
        );
        console.log(`Conversation ID: ${conversationId || "none"}`);
        console.log(`Messages in history: ${messages.length}`);
      },
    },
  },
  onLine: handlePrompt,
});

// Check environment before starting
if (!process.env.SERVICE_AUTH_SECRET) {
  console.error(
    "Warning: SERVICE_AUTH_SECRET is not set. The chat tool requires this for gRPC authentication.",
  );
  console.error(
    "Please set SERVICE_AUTH_SECRET in your .env file to use the chat script.",
  );
  console.error(
    "You can still use the chat tool commands, but requests will fail until authentication is configured.",
  );
}

repl.start();
