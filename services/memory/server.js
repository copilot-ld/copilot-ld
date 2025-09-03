#!/usr/bin/env node
/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { storageFactory } from "@copilot-ld/libstorage";
import { ResourceIndex } from "@copilot-ld/libresource";
import { Policy } from "@copilot-ld/libpolicy";
import { MemoryService } from "./index.js";

// Load configuration
const config = await ServiceConfig.create("memory");

// Set up storage for memories
const memoryStorage = storageFactory("memories");

// Set up ResourceIndex for accessing resources
const resourceStorage = storageFactory("resources");
const policy = new Policy(storageFactory("policies"));
const resourceIndex = new ResourceIndex(resourceStorage, policy);

// Create and start the Memory service
const service = new MemoryService(config, memoryStorage, resourceIndex);

await service.start();
