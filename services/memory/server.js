#!/usr/bin/env node
/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";

import { MemoryService } from "./index.js";

const config = await ServiceConfig.create("memory");

const memoryStorage = storageFactory("memories");
const resourceStorage = storageFactory("resources");
const policy = new Policy(storageFactory("policies"));
const resourceIndex = new ResourceIndex(resourceStorage, policy);

const service = new MemoryService(config, memoryStorage, resourceIndex);
const server = new Server(service, config);

await server.start();
