const restify = require("restify");
const { configureAdapter } = require("./configureAdapter");
// const { EchoBot } = require('./echobot');
const { CopilotLdBot } = require("./copilotldbot");

/**
 * Creates and configures a Restify server for hosting a Microsoft Teams bot using Copilot-LD.
 * Sets up HTTP endpoints for chat UI, bot message processing, and streaming connections.
 * @returns {import('restify').Server} Configured Restify server instance.
 */
function createServer() {
  // Create the Restify server instance
  const server = restify.createServer();
  server.use(restify.plugins.bodyParser());

  // Configure adapters for normal and streaming requests
  const adapter = configureAdapter();
  const streamingAdapter = configureAdapter();
  // Instantiate the CopilotLdBot
  const myBot = new CopilotLdBot();

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

module.exports = createServer;
