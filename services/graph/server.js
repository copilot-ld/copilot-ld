/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createGraphIndex } from "@copilot-ld/libgraph";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";

import { GraphService } from "./index.js";

const config = await createServiceConfig("graph");

// Initialize observability
const logger = await createLogger("graph");
const tracer = await createTracer("graph");

const graphIndex = createGraphIndex("graphs");

const service = new GraphService(config, graphIndex);
const server = new Server(service, config, logger, tracer);

await server.start();
