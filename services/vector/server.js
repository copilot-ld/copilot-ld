/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorIndex } from "@copilot-ld/libvector";
import { storageFactory } from "@copilot-ld/libstorage";
import { downloadFactory } from "@copilot-ld/libutil";

import { VectorService } from "./index.js";

// Ensure generated code is available and symlinks are set up
const downloader = downloadFactory(storageFactory);
await downloader.download();

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
const server = new Server(service, config);

await server.start();
