import {
  createServiceConfig,
  createExtensionConfig,
} from "@copilot-ld/libconfig";
import createServer from "./server.js";

const agentConfig = await createServiceConfig("agent");
const extensionConfig = await createExtensionConfig("teamsagent");
const server = createServer(agentConfig, extensionConfig);

server.listen(extensionConfig.port, () => {
  console.log("\n------------------- Startup ---------------------------");
  console.log(`\nRunning at: http://localhost:${extensionConfig.port}`);
  console.log("\nExpose publically: npm run ngrok");
  console.log("\n------------------- Listening ---------------------------");
});
