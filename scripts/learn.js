#!/usr/bin/env node
import { createTracer, createClient } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";
import { createStorage } from "@copilot-ld/libstorage";
import { TraceIndex } from "@copilot-ld/libtelemetry/index/trace.js";
import {
  ExperienceLearner,
  ExperienceStore,
  FeedbackIndex,
} from "@copilot-ld/liblearn";

const logger = createLogger("cli");
const tracer = await createTracer("cli");

// Initialize storage backends
const feedbackStorage = createStorage("feedback");
const experienceStorage = createStorage("experience");
const traceStorage = createStorage("traces");

// Create indices and stores
const feedbackIndex = new FeedbackIndex(feedbackStorage);
const experienceStore = new ExperienceStore(experienceStorage);
const traceIndex = new TraceIndex(traceStorage);

// Create vector client via gRPC
const vectorClient = await createClient("vector", logger, tracer);

// Create learner with all dependencies injected
const learner = new ExperienceLearner(
  traceIndex,
  feedbackIndex,
  vectorClient,
  experienceStore,
);

console.log("Starting experience learning batch job...");
await learner.learn();
console.log("Experience updated successfully");
