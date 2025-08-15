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
const vectorIndex = new VectorIndex(vectorStorage);

const service = new VectorService(config, vectorIndex);
await service.start();
