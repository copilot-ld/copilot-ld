/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { createGraphIndex } from "@copilot-ld/libgraph";
import { createResourceIndex } from "@copilot-ld/libresource";

import { GraphService } from "./index.js";

const config = await ServiceConfig.create("graph");
const graphIndex = createGraphIndex();
const resourceIndex = createResourceIndex();

const service = new GraphService(config, graphIndex, resourceIndex);
const server = new Server(service, config);

await server.start();
