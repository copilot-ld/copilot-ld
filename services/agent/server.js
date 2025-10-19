/* eslint-env node */
import { Octokit } from "@octokit/core";

import { Server, clients } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { createResourceIndex } from "@copilot-ld/libresource";
import { AgentMind, AgentHands } from "@copilot-ld/libagent";

import { AgentService } from "./index.js";

const { MemoryClient, LlmClient, ToolClient } = clients;

const agentConfig = await ServiceConfig.create("agent");

const memoryClient = new MemoryClient(await ServiceConfig.create("memory"));
const llmClient = new LlmClient(await ServiceConfig.create("llm"));
const toolClient = new ToolClient(await ServiceConfig.create("tool"));

const resourceIndex = createResourceIndex();

// Create callbacks for AgentHands and AgentMind
const callbacks = {
  memory: {
    append: memoryClient.Append.bind(memoryClient),
    get: memoryClient.Get.bind(memoryClient),
  },
  llm: {
    createCompletions: llmClient.CreateCompletions.bind(llmClient),
  },
  tool: {
    call: toolClient.Call.bind(toolClient),
  },
};

const agentHands = new AgentHands(agentConfig, callbacks);
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

const server = new Server(service, agentConfig);

await server.start();
