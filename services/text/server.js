/* eslint-env node */
import { ChunkIndex } from "@copilot-ld/libchunk";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { TextService } from "./index.js";

// Start the service
const config = new ServiceConfig("text");
const storage = config.storage(config.storagePath("chunks"));
const service = new TextService(config, new ChunkIndex(storage));
await service.start();
