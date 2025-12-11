import { describe, test, beforeEach } from "node:test";
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

/**
 * Creates a mock config object
 * @returns {object} Mock config
 */
function createMockConfig() {
  return {
    githubToken: async () => "token",
  };
}

/**
 * Creates a mock tenant config repository
 * @param {object} overrides - Properties to override
 * @returns {object} Mock tenant config repository
 */
function createMockTenantConfigRepository(overrides = {}) {
  return {
    get: async () => ({
      host: "localhost",
      port: 3979,
      encryptedSecret: { ciphertext: "encrypted" },
    }),
    save: async () => {},
    delete: async () => {},
    ...overrides,
  };
}

/**
 * Creates a mock tenant secret encryption service
 * @param {object} overrides - Properties to override
 * @returns {object} Mock encryption service
 */
function createMockTenantSecretEncryption(overrides = {}) {
  return {
    encrypt: () => ({ ciphertext: "encrypted" }),
    decrypt: () => "decrypted-secret",
    ...overrides,
  };
}

describe("CopilotLdBot", () => {
  let mockConfig;
  let mockTenantConfigRepository;
  let mockTenantSecretEncryption;

  beforeEach(() => {
    mockConfig = createMockConfig();
    mockTenantConfigRepository = createMockTenantConfigRepository();
    mockTenantSecretEncryption = createMockTenantSecretEncryption();

    // Mock global fetch for the Teams Agent call
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        reply: {
          messages: [{ role: "assistant", content: "Hello from Copilot!" }],
          resource_id: "resource-xyz",
        },
      }),
    });
  });

  test("given a configured CopilotLdBot, when handleMessage is called, then it sends a reply and sets resourceId", async () => {
    // Given: a CopilotLdBot with mocked dependencies and a context
    const bot = new CopilotLdBot(
      mockConfig,
      mockTenantConfigRepository,
      mockTenantSecretEncryption,
    );
    const context = new MockContext("Hi Copilot!");
    let nextCalled = false;

    // When: handleMessage is called
    await bot.handleMessage(context, () => {
      nextCalled = true;
    });

    // Then: the reply is sent, resourceId is set, and next is called
    assert.strictEqual(context.sent.length, 1);
    assert.strictEqual(context.sent[0].text, "Hello from Copilot!");
    assert.strictEqual(bot.getResourceId("tenant1", "bot1"), "resource-xyz");
    assert.ok(nextCalled);
  });
});
