import {
  createServiceConfig,
  createExtensionConfig,
} from "@copilot-ld/libconfig";

import createServer from "./server.js";

const agentConfig = await createServiceConfig("agent");
const extensionConfig = await createExtensionConfig("teamsapp");
const server = createServer(agentConfig, extensionConfig);

server.listen(extensionConfig.port, () => {
  console.log("\n------------------- Startup ---------------------------");
  console.log(`\nRunning at: http://localhost:${extensionConfig.port}`);
  console.log("\nExpose publicly: npm run ngrok");
  console.log("\nBot Framework Emulator: https://aka.ms/botframework-emulator");
  console.log("\n------------------- Listening ---------------------------");
});
