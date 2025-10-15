#!/usr/bin/env node
/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { createStorage } from "@copilot-ld/libstorage";

import { MemoryService } from "./index.js";

const config = await ServiceConfig.create("memory");
const memoryStorage = createStorage("memories");

const service = new MemoryService(config, memoryStorage);
const server = new Server(service, config);

await server.start();
