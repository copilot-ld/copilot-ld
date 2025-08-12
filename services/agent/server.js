/* eslint-env node */
import { Octokit } from "@octokit/core";

import { ServiceConfig } from "@copilot-ld/libconfig";
import { Client } from "@copilot-ld/libservice";

import { AgentService } from "./index.js";

// Start the service
const service = new AgentService(
  new ServiceConfig("agent", {
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
  }),
  {
    history: new Client(new ServiceConfig("history")),
    llm: new Client(new ServiceConfig("llm")),
    scope: new Client(new ServiceConfig("scope")),
    vector: new Client(new ServiceConfig("vector")),
    text: new Client(new ServiceConfig("text")),
  },
  (auth) => new Octokit({ auth }),
);
await service.start();
