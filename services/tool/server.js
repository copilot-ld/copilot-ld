import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { ToolService } from "./index.js";

const config = await createServiceConfig("tool");

// Initialize observability
const logger = createLogger("tool");
const tracer = await createTracer("tool");

const service = new ToolService(config, logger, tracer);
const server = new Server(service, config, logger, tracer);

await server.start();
