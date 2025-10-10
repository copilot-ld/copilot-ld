/* eslint-env node */
import { Store } from "n3";
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { TripleIndex } from "@copilot-ld/libtriple";
import { createStorage } from "@copilot-ld/libstorage";

import { GraphService } from "./index.js";

const config = await ServiceConfig.create("graph");

const tripleStorage = createStorage("triples");
const n3Store = new Store();
const tripleIndex = new TripleIndex(tripleStorage, n3Store, "triples.jsonl");

const service = new GraphService(config, tripleIndex);
const server = new Server(service, config);

await server.start();
