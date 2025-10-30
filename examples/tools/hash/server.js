/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { createServiceConfig } from "@copilot-ld/libconfig";

import { HashService } from "./index.js";

// Bootstrap the service
const config = await createServiceConfig("hash");
const service = new HashService(config);

// Create and start the server
const server = new Server(service, config);
await server.start();
