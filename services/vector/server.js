/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorIndex } from "@copilot-ld/libvector";
import { createStorage } from "@copilot-ld/libstorage";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";

import { LlmClient } from "../../generated/services/llm/client.js";
import { VectorService } from "./index.js";

const config = await ServiceConfig.create("vector");

// Initialize LLM client
const llmConfig = await ServiceConfig.create("llm");
const llmClient = new LlmClient(llmConfig);

// Initialize resource index
const resourceStorage = createStorage("resources");
const policyStorage = createStorage("policies");
const policy = new Policy(policyStorage);
const resourceIndex = new ResourceIndex(resourceStorage, policy);

// Initialize vector indices
const vectorStorage = createStorage("vectors");
const contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");

const service = new VectorService(
  config,
  contentIndex,
  descriptorIndex,
  llmClient,
  resourceIndex,
);
const server = new Server(service, config);

await server.start();
