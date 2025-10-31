/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { LlmService } from "./index.js";

const config = await createServiceConfig("llm");

// Initialize observability
const logger = await createLogger("llm");
const tracer = await createTracer("llm");

const service = new LlmService(config);
const server = new Server(service, config, logger, tracer);

await server.start();
