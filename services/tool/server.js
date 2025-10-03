/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { downloadFactory } from "@copilot-ld/libutil";

import { ToolService } from "./index.js";

// Ensure generated code is available and symlinks are set up
const downloader = downloadFactory(storageFactory);
await downloader.download();

// Bootstrap the service
const config = await ServiceConfig.create("tool", {
  endpoints: {},
});

const service = new ToolService(config);

// Create and start the server
const server = new Server(service, config);

await server.start();
