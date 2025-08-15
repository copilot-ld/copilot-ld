/* eslint-env node */
import { ChunkIndex } from "@copilot-ld/libchunk";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";

import { TextService } from "./index.js";

// Start the service
const config = await ServiceConfig.create("text");
const storage = storageFactory("chunks");
const service = new TextService(config, new ChunkIndex(storage));
await service.start();
