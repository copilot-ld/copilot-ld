/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { VectorIndex } from "@copilot-ld/libvector";

import { ScopeService } from "./index.js";

// Start the service
const config = new ServiceConfig("scope");
const storage = config.storage(config.storagePath("scope"));
const vectorIndex = new VectorIndex(storage);
const service = new ScopeService(config, vectorIndex);
await service.start();
