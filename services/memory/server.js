#!/usr/bin/env node
/* eslint-env node */
import { Server } from "@copilot-ld/librpc";
import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";
import { downloadFactory } from "@copilot-ld/libutil";

import { MemoryService } from "./index.js";

// Ensure generated code is available and symlinks are set up
const downloader = downloadFactory(storageFactory);
await downloader.download();

// Bootstrap the service
const config = await ServiceConfig.create("memory");

// Set up storage for memories
const memoryStorage = storageFactory("memories");

// Set up ResourceIndex for accessing resources
const resourceStorage = storageFactory("resources");
const policy = new Policy(storageFactory("policies"));
const resourceIndex = new ResourceIndex(resourceStorage, policy);

const service = new MemoryService(config, memoryStorage, resourceIndex);

// Create and start the server
const server = new Server(service, config);

await server.start();
