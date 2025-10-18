/* eslint-env node */
import { Server, clients } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorIndex } from "@copilot-ld/libvector";
import { createStorage } from "@copilot-ld/libstorage";
import { createResourceIndex } from "@copilot-ld/libresource";

import { VectorService } from "./index.js";

const { LlmClient } = clients;

const config = await ServiceConfig.create("vector");

// Initialize LLM client
const llmClient = new LlmClient(await ServiceConfig.create("llm"));

// Initialize resource index
const resourceIndex = createResourceIndex();

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
