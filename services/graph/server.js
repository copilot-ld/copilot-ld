/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { TripleIndex } from "@copilot-ld/libtriple";
import { createStorage } from "@copilot-ld/libstorage";
import { Store } from "n3";

import { GraphService } from "./index.js";

const config = await ServiceConfig.create("graph");

const tripleStorage = createStorage("triples");
const store = new Store();
const tripleIndex = new TripleIndex(tripleStorage, store, "index.jsonl");

const service = new GraphService(config, tripleIndex);
const server = new Server(service, config);

await server.start();
