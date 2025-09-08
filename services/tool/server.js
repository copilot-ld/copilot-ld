/* eslint-env node */
import { Server, grpcFactory, authFactory } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { logFactory } from "@copilot-ld/libutil";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";
import { policyFactory } from "@copilot-ld/libpolicy";

import { ToolService } from "./index.js";

// Bootstrap the service
const config = await ServiceConfig.create("tool", {
  endpoints: {},
});

const storage = storageFactory("resources");
const policy = policyFactory();
const resourceIndex = new ResourceIndex(storage, policy);

const service = new ToolService(config, resourceIndex);

// Create and start the server
const server = new Server(
  service,
  config,
  grpcFactory,
  authFactory,
  logFactory,
);

await server.start();
