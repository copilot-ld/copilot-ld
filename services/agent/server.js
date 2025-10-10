/* eslint-env node */
import { Octokit } from "@octokit/core";

import { Server, clients } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { createPolicy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { createStorage } from "@copilot-ld/libstorage";

import { AgentService } from "./index.js";

const { MemoryClient, LlmClient, VectorClient, ToolClient } = clients;

const agentConfig = await ServiceConfig.create("agent", {
  threshold: 0.3,
  limit: 200,
  temperature: 0.2,
  systemInstructionsTokens: 2000,
  historyTokens: 10000,
  similaritySearchTokens: 75000,
  prompts: [
    "You help with software development practices.",
    "Keep your introduction brief and focused on the task.",
    "Format your responses in Markdown, using code blocks when relevant.",
  ],
});

const memoryClient = new MemoryClient(await ServiceConfig.create("memory"));
const llmClient = new LlmClient(await ServiceConfig.create("llm"));
const vectorClient = new VectorClient(await ServiceConfig.create("vector"));
const toolClient = new ToolClient(await ServiceConfig.create("tool"));

const resourceStorage = createStorage("resources");
const policy = createPolicy();
const resourceIndex = new ResourceIndex(resourceStorage, policy);

const service = new AgentService(
  agentConfig,
  memoryClient,
  llmClient,
  vectorClient,
  toolClient,
  resourceIndex,
  (auth) => new Octokit({ auth }),
);

const server = new Server(service, agentConfig);

await server.start();
