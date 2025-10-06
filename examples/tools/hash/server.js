/* eslint-env node */
import { Server, grpcFactory, authFactory } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { logFactory } from "@copilot-ld/libutil";

import { HashService } from "./index.js";

const config = await ServiceConfig.create("hash");
const service = new HashService(config);

const server = new Server(
  service,
  config,
  grpcFactory,
  authFactory,
  logFactory,
);

await server.start();
