import { test } from "node:test";
import assert from "node:assert";
import { CopilotLdBot } from "../copilotldbot.js";

/**
 * Minimal mock for TurnContext used in CopilotLdBot tests.
 */
class MockContext {
  /**
   * Creates a new MockContext instance.
   * @param {string} text - The message text.
   * @param {string} [tenantId] - The tenant ID.
   * @param {string} [recipientId] - The recipient (bot) ID.
   */
  constructor(text, tenantId = "tenant1", recipientId = "bot1") {
    this.activity = {
      text,
      conversation: { tenantId },
      recipient: { id: recipientId },
    };
    this.sent = [];
  }

  /**
   * Simulates sending an activity in the bot context.
   * @param {object} msg - The message object to send.
   * @returns {Promise<void>}
   */
  async sendActivity(msg) {
    this.sent.push(msg);
  }
}

test("handleMessage sends formatted reply and sets resourceId", async () => {
  // Mock AgentClient
  const mockProcessRequest = async () => ({
    choices: [{ message: { content: "Hello from Copilot!" } }],
    resource_id: "resource-xyz",
  });
  const mockAgentClient = function () {
    return { ProcessRequest: mockProcessRequest };
  };
  // Mock config
  const mockCreateExtensionConfig = async () => ({
    githubToken: async () => "token",
  });
  const mockCreateServiceConfig = async () => ({});
  // Mock formatter
  const mockHtmlFormatter = { format: (x) => `**${x}**` };

  // Set dependencies as properties after construction
  const bot = new CopilotLdBot();
  bot.AgentClient = mockAgentClient;
  bot.createExtensionConfig = mockCreateExtensionConfig;
  bot.createServiceConfig = mockCreateServiceConfig;
  bot.htmlFormatter = mockHtmlFormatter;

  const context = new MockContext("Hi Copilot!");
  let nextCalled = false;
  await bot.handleMessage(context, () => {
    nextCalled = true;
  });

  assert.strictEqual(context.sent.length, 1);
  assert.strictEqual(context.sent[0].text, "**Hello from Copilot!**");
  assert.strictEqual(bot.getResourceId("tenant1", "bot1"), "resource-xyz");
  assert.ok(nextCalled);
});
