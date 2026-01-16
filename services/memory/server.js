#!/usr/bin/env node
import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";
import { createResourceIndex } from "@copilot-ld/libresource";

import { MemoryService } from "./index.js";

const config = await createServiceConfig("memory");

// Initialize observability
const logger = createLogger("memory");
const tracer = await createTracer("memory");

const memoryStorage = createStorage("memories");
const resourceIndex = createResourceIndex("resources");

const service = new MemoryService(config, memoryStorage, resourceIndex);
const server = new Server(service, config, logger, tracer);

await server.start();
