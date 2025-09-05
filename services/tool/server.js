import { ServiceConfig } from "@copilot-ld/libconfig";
import { ResourceIndex } from "@copilot-ld/libresource";
import { storageFactory } from "@copilot-ld/libstorage";

import { ToolService } from "./index.js";
import { policyFactory } from "@copilot-ld/libpolicy";

const config = await ServiceConfig.create("tool", {
  endpoints: {},
});

const storage = storageFactory("resources");
const policy = policyFactory();
const resourceIndex = new ResourceIndex(storage, policy);

const service = new ToolService(config, resourceIndex);
await service.start();
