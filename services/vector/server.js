/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorIndex } from "@copilot-ld/libvector";
import { storageFactory } from "@copilot-ld/libstorage";

import { VectorService } from "./index.js";

// Start the service
const config = await ServiceConfig.create("vector", {
  threshold: 0.3,
  limit: 0,
});

const vectorStorage = storageFactory("vectors");
const contentIndex = new VectorIndex(vectorStorage, "content.json");
const descriptorIndex = new VectorIndex(vectorStorage, "descriptors.json");

const service = new VectorService(config, contentIndex, descriptorIndex);
await service.start();
