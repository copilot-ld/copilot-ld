/* eslint-env node */
import { Octokit } from "@octokit/core";

import { Server, clients } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { createResourceIndex } from "@copilot-ld/libresource";

import { AgentService } from "./index.js";

const { MemoryClient, LlmClient, ToolClient } = clients;

const agentConfig = await ServiceConfig.create("agent");

const memoryClient = new MemoryClient(await ServiceConfig.create("memory"));
const llmClient = new LlmClient(await ServiceConfig.create("llm"));
const toolClient = new ToolClient(await ServiceConfig.create("tool"));

const resourceIndex = createResourceIndex();

const service = new AgentService(
  agentConfig,
  memoryClient,
  llmClient,
  toolClient,
  resourceIndex,
  (auth) => new Octokit({ auth }),
);

const server = new Server(service, agentConfig);

await server.start();
