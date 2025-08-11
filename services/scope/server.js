/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { VectorIndex } from "@copilot-ld/libvector";

import { ScopeService } from "./index.js";

// Start the service
const config = new ServiceConfig("scope");
const storage = storageFactory(config.storagePath("scope"), config);
const vectorIndex = new VectorIndex(storage);
const service = new ScopeService(config, vectorIndex);
await service.start();
