/* eslint-env node */
import { Server, createGrpc, createAuth } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { createLogger } from "@copilot-ld/libutil";

import { HashService } from "./index.js";

const config = await ServiceConfig.create("hash");
const service = new HashService(config);

const server = new Server(
  service,
  config,
  createGrpc,
  createAuth,
  createLogger,
);

await server.start();
