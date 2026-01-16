import { Server, createClient } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { LlmService } from "./index.js";

const config = await createServiceConfig("llm");

// Initialize observability
const logger = createLogger("llm");
const tracer = await createTracer("llm");

// Create memory client for fetching windows
const memoryClient = await createClient("memory", logger, tracer);

const service = new LlmService(config, memoryClient);
const server = new Server(service, config, logger, tracer);

await server.start();
