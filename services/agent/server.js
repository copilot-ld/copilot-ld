/* eslint-env node */
import { Octokit } from "@octokit/core";

import { Server, createClient } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createResourceIndex } from "@copilot-ld/libresource";
import { AgentMind, AgentHands } from "@copilot-ld/libagent";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { AgentService } from "./index.js";

const agentConfig = await createServiceConfig("agent");

// Initialize observability
const logger = createLogger("agent");
const tracer = await createTracer("agent");

const memoryClient = await createClient("memory", logger, tracer);
const llmClient = await createClient("llm", logger, tracer);
const toolClient = await createClient("tool", logger, tracer);

const resourceIndex = createResourceIndex("resources");

// Create callbacks for AgentHands and AgentMind
const callbacks = {
  memory: {
    append: memoryClient.AppendMemory.bind(memoryClient),
    get: memoryClient.GetWindow.bind(memoryClient),
  },
  llm: {
    createCompletions: llmClient.CreateCompletions.bind(llmClient),
  },
  tool: {
    call: toolClient.CallTool.bind(toolClient),
  },
};

const agentHands = new AgentHands(agentConfig, callbacks, resourceIndex);
const agentMind = new AgentMind(
  agentConfig,
  callbacks,
  resourceIndex,
  agentHands,
);

const service = new AgentService(
  agentConfig,
  agentMind,
  (auth) => new Octokit({ auth }),
);

const server = new Server(service, agentConfig, logger, tracer);

await server.start();
