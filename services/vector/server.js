/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { initializeVectorIndices } from "@copilot-ld/libvector";

import { VectorService } from "./index.js";

// Start the service
const config = new ServiceConfig("vector", {
  threshold: 0.3,
  limit: 0,
});
const vectorIndices = await initializeVectorIndices(
  config.dataPath("vectors"),
  config,
);
const service = new VectorService(config, vectorIndices);
await service.start();
