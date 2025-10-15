/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";

import { ToolService } from "./index.js";

const config = await ServiceConfig.create("tool");
const service = new ToolService(config);
const server = new Server(service, config);

await server.start();
