/* eslint-env node */
import { Server, createClient } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { VectorIndex } from "@copilot-ld/libvector";
import { createStorage } from "@copilot-ld/libstorage";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { VectorService } from "./index.js";

const config = await createServiceConfig("vector");

// Initialize observability
const logger = await createLogger("vector");
const tracer = await createTracer("vector");

// Initialize LLM client
const llmClient = await createClient("llm", logger, tracer);

// Initialize vector indices
const vectorStorage = createStorage("vectors");
const contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");

const service = new VectorService(
  config,
  contentIndex,
  descriptorIndex,
  llmClient,
);
const server = new Server(service, config, logger, tracer);

await server.start();
