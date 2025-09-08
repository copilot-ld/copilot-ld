/* eslint-env node */
import { Server, grpcFactory, authFactory } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { logFactory } from "@copilot-ld/libutil";

import { HashService } from "./index.js";

// Bootstrap the service
const config = await ServiceConfig.create("hash");

const service = new HashService(config);

// Create and start the server
const server = new Server(
  service,
  config,
  grpcFactory,
  authFactory,
  logFactory,
);

await server.start();
