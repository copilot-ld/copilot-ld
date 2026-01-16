#!/usr/bin/env node
import { createServiceConfig } from "@copilot-ld/libconfig";
import { createClient, createTracer } from "@copilot-ld/librpc";
import { createLogger } from "@copilot-ld/libtelemetry";
import { agent, common } from "@copilot-ld/libtype";

const config = await createServiceConfig("agent");
const logger = createLogger("cli");
const tracer = await createTracer("cli");
const agentClient = await createClient("agent", logger, tracer);

// Read all stdin
let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) {
  input += chunk;
}

const request = agent.AgentRequest.fromObject({
  messages: [common.Message.fromObject({ role: "user", content: input })],
  llm_token: await config.llmToken(),
  model: config.model,
});

const response = await agentClient.ProcessUnary(request);

process.stdout.write("\n");
if (response.messages?.length > 0) {
  const text = response.messages.map((msg) => msg.content).join("\n");
  process.stdout.write(text + "\n\n");
}

logger.debug("ProcessUnary", "Response received", {
  resource_id: response.resource_id,
});
