/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { Copilot } from "@copilot-ld/libcopilot";
import { storageFactory } from "@copilot-ld/libstorage";
import { downloadFactory } from "@copilot-ld/libutil";

import { LlmService } from "./index.js";

// Ensure generated code is available and symlinks are set up
const downloader = downloadFactory(storageFactory);
await downloader.download();

// Bootstrap the service
const config = await ServiceConfig.create("llm", {
  model: "gpt-4o",
});

const service = new LlmService(
  config,
  (token, model) => new Copilot(token, model),
);

// Create and start the server
const server = new Server(service, config);

await server.start();
