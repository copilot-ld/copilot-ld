/* eslint-env node */
import { Octokit } from "@octokit/core";

import { ServiceConfig } from "@copilot-ld/libconfig";
import { Policy } from "@copilot-ld/libpolicy";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Client } from "@copilot-ld/libservice";
import { storageFactory } from "@copilot-ld/libstorage";

import { AgentService } from "./index.js";

// Start the service
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

const clients = {
  history: new Client(await ServiceConfig.create("history")),
  llm: new Client(await ServiceConfig.create("llm")),
  vector: new Client(await ServiceConfig.create("vector")),
};

// Set up ResourceIndex for accessing resources
const resourceStorage = storageFactory("resources");
const policy = new Policy(storageFactory("policies"));
const resourceIndex = new ResourceIndex(resourceStorage, policy);

const service = new AgentService(
  agentConfig,
  clients,
  resourceIndex,
  (auth) => new Octokit({ auth }),
);
await service.start();
