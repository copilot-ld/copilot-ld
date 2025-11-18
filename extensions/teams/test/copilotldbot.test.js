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
  // Mock AgentClient instance
  const mockAgentClient = {
    ProcessRequest: async () => ({
      choices: [{ message: { content: "Hello from Copilot!" } }],
      resource_id: "resource-xyz",
    }),
  };
  // Mock config
  const mockConfig = {
    githubToken: async () => "token",
  };
  // Mock formatter
  const mockHtmlFormatter = { format: (x) => `<p>${x}</p>` };

  // Pass all dependencies via constructor
  const bot = new CopilotLdBot(mockAgentClient, mockConfig, mockHtmlFormatter);

  const context = new MockContext("Hi Copilot!");
  let nextCalled = false;
  await bot.handleMessage(context, () => {
    nextCalled = true;
  });

  assert.strictEqual(context.sent.length, 1);
  assert.strictEqual(context.sent[0].text, "<p>Hello from Copilot!</p>");
  assert.strictEqual(bot.getResourceId("tenant1", "bot1"), "resource-xyz");
  assert.ok(nextCalled);
});
