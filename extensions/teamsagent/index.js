import dotenv from "dotenv";
dotenv.config();

import { createServiceConfig } from "@copilot-ld/libconfig";
import createServer from "./server.js";

const config = await createServiceConfig("agent");
const server = createServer(config);

server.listen(
  process.env.teams_agent_port || process.env.TEAMS_AGENT_PORT || 3979,
  () => {
    console.log("\n------------------- Startup ---------------------------");
    console.log(
      `\nRunning at: http://localhost:${process.env.teams_agent_port || process.env.TEAMS_AGENT_PORT || 3979}`,
    );
    console.log("\nExpose publically: npm run ngrok");
    console.log("\n------------------- Listening ---------------------------");
  },
);
