/* eslint-env node */
import { Store } from "n3";
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { GraphIndex } from "@copilot-ld/libgraph";
import { createStorage } from "@copilot-ld/libstorage";

import { GraphService } from "./index.js";

const config = await ServiceConfig.create("graph");

const graphStorage = createStorage("graphs");
const n3Store = new Store();
const graphIndex = new GraphIndex(graphStorage, n3Store, "graphs.jsonl");

const service = new GraphService(config, graphIndex);
const server = new Server(service, config);

await server.start();
