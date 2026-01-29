#!/usr/bin/env node
import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { createTracer, createClient } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";
import { createResourceIndex } from "@copilot-ld/libresource";

import { MemoryService } from "./index.js";

const config = await createServiceConfig("memory");

// Initialize observability
const logger = createLogger("memory");
const tracer = await createTracer("memory");

const memoryStorage = createStorage("memories");
const resourceIndex = createResourceIndex("resources");

// Create experience injector (optional - graceful degradation if not available)
let experienceInjector = null;
try {
  const { ExperienceInjector, ExperienceStore } =
    await import("@copilot-ld/liblearn");
  const experienceStorage = createStorage("experience");
  const experienceStore = new ExperienceStore(experienceStorage);
  const vectorClient = await createClient("vector", logger, tracer);
  experienceInjector = new ExperienceInjector(experienceStore, vectorClient);
  logger.info("Experience injection enabled");
} catch (err) {
  logger.warn("Experience injection disabled: " + err.message);
}

const service = new MemoryService(
  config,
  memoryStorage,
  resourceIndex,
  experienceInjector,
);
const server = new Server(service, config, logger, tracer);

await server.start();
