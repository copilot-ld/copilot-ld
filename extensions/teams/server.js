import restify from "restify";
import { configureAdapter } from "./configureAdapter.js";
// import { EchoBot } from "./echobot.js";
import { CopilotLdBot } from "./copilotldbot.js";
import { clients } from "@copilot-ld/librpc";
import {
  createServiceConfig,
  createExtensionConfig,
} from "@copilot-ld/libconfig";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Creates and configures a Restify server for hosting a Microsoft Teams bot using Copilot-LD.
 * Sets up HTTP endpoints for chat UI, bot message processing, and streaming connections.
 * @returns {Promise<import('restify').Server>} Configured Restify server instance.
 */
export default async function createServer() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Create the Restify server instance
  const server = restify.createServer();
  server.use(restify.plugins.bodyParser());

  // Configure adapters for normal and streaming requests
  const adapter = configureAdapter();
  const streamingAdapter = configureAdapter();

  // Instantiate the CopilotLdBot with required dependencies
  const config = await createExtensionConfig("web");
  const agentClient = new clients.AgentClient(
    await createServiceConfig("agent"),
  );
  const myBot = new CopilotLdBot(agentClient, config);

  // Serve the chat UI HTML page at /chat
  server.get(
    "/chat",
    restify.plugins.serveStatic({
      directory: __dirname,
      file: "chat.html",
    }),
  );

  // Listen for incoming bot message requests (Bot Framework protocol)
  server.post("/api/messages", async (req, res) => {
    await adapter.process(req, res, (context) => myBot.run(context));
  });

  // Listen for WebSocket upgrade requests for streaming connections
  server.on("upgrade", async (req, socket, head) => {
    await streamingAdapter.process(req, socket, head, (context) =>
      myBot.run(context),
    );
  });

  return server;
}
