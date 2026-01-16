import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";
import { TraceIndex } from "@copilot-ld/libtelemetry/index/trace.js";

import { TraceService } from "./index.js";

const config = await createServiceConfig("trace");

// Initialize storage for traces
const traceStorage = createStorage("traces");

// Create trace index
const traceIndex = new TraceIndex(traceStorage);

const service = new TraceService(config, traceIndex);
const server = new Server(service, config);
await server.start();
