/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";

import { HashService } from "./index.js";

const config = await ServiceConfig.create("hash");
const service = new HashService(config);
await service.start();
