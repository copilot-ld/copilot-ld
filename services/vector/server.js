/* eslint-env node */
import { Server, grpcFactory, authFactory } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { logFactory } from "@copilot-ld/libutil";
import { VectorIndex } from "@copilot-ld/libvector";
import { storageFactory } from "@copilot-ld/libstorage";

import { VectorService } from "./index.js";

// Bootstrap the service
const config = await ServiceConfig.create("vector", {
  threshold: 0.3,
  limit: 0,
});

const vectorStorage = storageFactory("vectors");
const contentIndex = new VectorIndex(vectorStorage, "content.jsonl");
const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.jsonl");

const service = new VectorService(config, contentIndex, descriptorIndex);

// Create and start the server
const server = new Server(
  service,
  config,
  grpcFactory,
  authFactory,
  logFactory,
);

await server.start();
