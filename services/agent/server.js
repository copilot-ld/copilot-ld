/* eslint-env node */
import { Octokit } from "@octokit/core";

import { ServiceConfig } from "@copilot-ld/libconfig";
import { Client } from "@copilot-ld/libservice";

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
  text: new Client(await ServiceConfig.create("text")),
};

const service = new AgentService(
  agentConfig,
  clients,
  (auth) => new Octokit({ auth }),
);
await service.start();
