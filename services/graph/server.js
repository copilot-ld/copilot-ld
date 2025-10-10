/* eslint-env node */
import { Store } from "n3";
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { GraphIndex } from "@copilot-ld/libgraph";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";
import { createStorage } from "@copilot-ld/libstorage";

import { GraphService } from "./index.js";

const config = await ServiceConfig.create("graph");

const graphStorage = createStorage("graphs");
const resourceStorage = createStorage("resources");
const policy = new Policy(createStorage("policies"));
const n3Store = new Store();
const graphIndex = new GraphIndex(graphStorage, n3Store, "graphs.jsonl");
const resourceIndex = new ResourceIndex(resourceStorage, policy);

const service = new GraphService(config, graphIndex, resourceIndex);
const server = new Server(service, config);

await server.start();
