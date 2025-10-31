/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";
import { BufferedIndex } from "@copilot-ld/libindex";
import { createStorage } from "@copilot-ld/libstorage";

import { TraceService } from "./index.js";
import { createOTLPExporter } from "./exporter.js";

const config = await createServiceConfig("trace");

// Initialize storage for traces
const traceStorage = createStorage("traces");

// Get current date for trace file naming (YYYY-MM-DD format)
const now = new Date();
const dateStr = now.toISOString().split("T")[0];

// Create buffered index with configurable flush interval and buffer size
const traceIndex = new BufferedIndex(traceStorage, `${dateStr}.jsonl`, config);

// Create OTLP exporter (may be null if not configured)
const exporter = createOTLPExporter(config);

const service = new TraceService(config, traceIndex, exporter);
const server = new Server(service, config);
await server.start();
