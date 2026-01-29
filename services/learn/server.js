import { Server, createClient, createTracer } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";
import { TraceIndex } from "@copilot-ld/libtelemetry/index/trace.js";
import {
  ExperienceLearner,
  ExperienceStore,
  FeedbackIndex,
} from "@copilot-ld/liblearn";

import { LearnService } from "./index.js";

const config = await createServiceConfig("learn");

// Initialize observability
const logger = createLogger("learn");
const tracer = await createTracer("learn");

// Initialize storage backends
const feedbackStorage = createStorage("feedback");
const experienceStorage = createStorage("experience");
const traceStorage = createStorage("traces");

// Create indices and stores
const feedbackIndex = new FeedbackIndex(feedbackStorage);
const experienceStore = new ExperienceStore(experienceStorage);
const traceIndex = new TraceIndex(traceStorage);

// Create vector client for embeddings
const vectorClient = await createClient("vector", logger, tracer);

// Create the learner with all dependencies
const learner = new ExperienceLearner(
  traceIndex,
  feedbackIndex,
  vectorClient,
  experienceStore,
);

const service = new LearnService(
  config,
  feedbackIndex,
  experienceStore,
  learner,
);
const server = new Server(service, config, logger, tracer);

await server.start();
