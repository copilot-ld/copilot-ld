import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { HashService } from "./index.js";

const config = await createServiceConfig("hash");

// Initialize observability
const logger = await createLogger("hash");
const tracer = await createTracer("hash");

const service = new HashService(config);
const server = new Server(service, config, logger, tracer);

await server.start();
