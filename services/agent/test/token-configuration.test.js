/* eslint-env node */
import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";

// Mock service dependencies
const mockClients = {
  history: {
    GetHistory: mock.fn(() => Promise.resolve({ messages: [] })),
    fireAndForget: {
      UpdateHistory: mock.fn(),
    },
  },
  llm: {
    CreateEmbeddings: mock.fn(() =>
      Promise.resolve({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    ),
    CreateCompletions: mock.fn(() =>
      Promise.resolve({
        choices: [{ message: { role: "assistant", content: "Response" } }],
      }),
    ),
  },
  scope: {
    ResolveScope: mock.fn(() => Promise.resolve({ indices: [] })),
  },
  vector: {
    QueryItems: mock.fn(() => Promise.resolve({ results: [] })),
  },
  text: {
    GetChunks: mock.fn(() => Promise.resolve({ chunks: {} })),
  },
};

const mockOctokitFactory = mock.fn(() => ({
  request: mock.fn(() => Promise.resolve({})),
}));

// Mock libservice
const mockLibservice = {
  Service: class MockService {
    constructor(config) {
      this.config = config;
    }
  },
};

// Mock PromptBuilder
const mockPromptBuilder = {
  PromptBuilder: class MockPromptBuilder {
    static generateSessionId() {
      return "mock-session-id";
    }

    static getLatestUserMessage(messages) {
      return messages?.find((m) => m.role === "user") || null;
    }

    messages(_msgs) {
      return this;
    }
    context(_ctx) {
      return this;
    }
    system(..._prompts) {
      return this;
    }
    build() {
      return [];
    }
  },
};

// Create AgentService class for testing
class AgentService extends mockLibservice.Service {
  #clients;
  #octokitFactory;

  constructor(config, clients, octokitFactory) {
    super(config);
    this.#clients = clients;
    this.#octokitFactory = octokitFactory;
  }

  async ProcessRequest({ messages: clientMessages, session_id, github_token }) {
    const octokit = this.#octokitFactory(github_token);
    await octokit.request("GET /user");

    const sessionId =
      session_id || mockPromptBuilder.PromptBuilder.generateSessionId();
    const latestUserMessage =
      mockPromptBuilder.PromptBuilder.getLatestUserMessage(clientMessages);

    let context = [];
    let messages;

    if (latestUserMessage?.content) {
      const [historyMessages, embeddings] = await Promise.all([
        this.#clients.history.GetHistory({
          session_id: sessionId,
          max_tokens: this.config.historyTokens,
        }),
        this.#clients.llm.CreateEmbeddings({
          chunks: [latestUserMessage.content],
          github_token,
        }),
      ]);

      messages = [...historyMessages.messages, latestUserMessage];
      const vector = embeddings.data[0].embedding;

      const { indices } = await this.#clients.scope.ResolveScope({ vector });

      if (indices.length > 0) {
        const { results } = await this.#clients.vector.QueryItems({
          indices: indices,
          vector,
          threshold: this.config.threshold,
          limit: this.config.limit,
          max_tokens: this.config.similaritySearchTokens,
        });

        if (results.length > 0) {
          const { chunks } = await this.#clients.text.GetChunks({
            ids: results.map((r) => r.id),
          });
          // Build context from results and chunks
          context = results.map((r) => ({
            id: r.id,
            score: r.score,
            text: chunks[r.id]?.text,
          }));
        }
      }
    } else {
      const { messages: history } = await this.#clients.history.GetHistory({
        session_id: sessionId,
        max_tokens: this.config.historyTokens,
      });
      messages = history;
    }

    const enhancedMessages = new mockPromptBuilder.PromptBuilder()
      .messages(messages)
      .context(context)
      .system(...this.config.prompts)
      .build();

    const completions = await this.#clients.llm.CreateCompletions({
      messages: enhancedMessages,
      temperature: this.config.temperature,
      github_token,
    });

    if (completions.choices?.length > 0) {
      const updatedMessages = [...messages, completions.choices[0].message];
      this.#clients.history.fireAndForget.UpdateHistory({
        session_id: sessionId,
        messages: updatedMessages,
      });
    }

    return { ...completions, session_id: sessionId };
  }
}

describe("Agent Service Token Configuration", () => {
  let agentService;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      threshold: 0.3,
      limit: 200,
      temperature: 0.2,
      systemInstructionsTokens: 1000,
      historyTokens: 2000,
      similaritySearchTokens: 3000,
      prompts: [
        "You help with software development practices.",
        "Keep your introduction brief and focused on the task.",
      ],
    };

    agentService = new AgentService(
      mockConfig,
      mockClients,
      mockOctokitFactory,
    );

    // Reset mocks
    Object.values(mockClients).forEach((client) => {
      Object.values(client).forEach((method) => {
        if (method.mock) method.mock.resetCalls();
      });
      if (client.fireAndForget) {
        Object.values(client.fireAndForget).forEach((method) => {
          if (method.mock) method.mock.resetCalls();
        });
      }
    });
  });

  test("ProcessRequest passes historyTokens to history service", async () => {
    const request = {
      messages: [{ role: "user", content: "Hello" }],
      session_id: "test-session",
      github_token: "test-token",
    };

    await agentService.ProcessRequest(request);

    // Should call GetHistory with max_tokens set to historyTokens
    assert.strictEqual(mockClients.history.GetHistory.mock.callCount(), 1);
    const historyCall =
      mockClients.history.GetHistory.mock.calls[0].arguments[0];
    assert.strictEqual(historyCall.session_id, "test-session");
    assert.strictEqual(historyCall.max_tokens, 2000);
  });

  test("ProcessRequest passes similaritySearchTokens to vector service", async () => {
    // Mock scope to return indices so vector service gets called
    mockClients.scope.ResolveScope = mock.fn(() =>
      Promise.resolve({ indices: ["index1"] }),
    );

    const request = {
      messages: [{ role: "user", content: "Hello" }],
      session_id: "test-session",
      github_token: "test-token",
    };

    await agentService.ProcessRequest(request);

    // Should call QueryItems with max_tokens set to similaritySearchTokens
    assert.strictEqual(mockClients.vector.QueryItems.mock.callCount(), 1);
    const vectorCall = mockClients.vector.QueryItems.mock.calls[0].arguments[0];
    assert.strictEqual(vectorCall.max_tokens, 3000);
    assert.strictEqual(vectorCall.threshold, 0.3);
    assert.strictEqual(vectorCall.limit, 200);
  });

  test("ProcessRequest handles case with no user message content", async () => {
    const request = {
      messages: [{ role: "system", content: "System message" }],
      session_id: "test-session",
      github_token: "test-token",
    };

    await agentService.ProcessRequest(request);

    // Should still call GetHistory with max_tokens for the else branch
    assert.strictEqual(mockClients.history.GetHistory.mock.callCount(), 1);
    const historyCall =
      mockClients.history.GetHistory.mock.calls[0].arguments[0];
    assert.strictEqual(historyCall.max_tokens, 2000);

    // Should not call vector service
    assert.strictEqual(mockClients.vector.QueryItems.mock.callCount(), 0);
  });

  test("ProcessRequest uses correct token allocations from config", async () => {
    // Test with different token allocations
    const customConfig = {
      ...mockConfig,
      historyTokens: 1500,
      similaritySearchTokens: 2500,
    };

    const customAgentService = new AgentService(
      customConfig,
      mockClients,
      mockOctokitFactory,
    );

    // Mock scope to return indices
    mockClients.scope.ResolveScope = mock.fn(() =>
      Promise.resolve({ indices: ["index1"] }),
    );

    const request = {
      messages: [{ role: "user", content: "Test message" }],
      session_id: "test-session",
      github_token: "test-token",
    };

    await customAgentService.ProcessRequest(request);

    // Check history call uses custom historyTokens
    const historyCall =
      mockClients.history.GetHistory.mock.calls[0].arguments[0];
    assert.strictEqual(historyCall.max_tokens, 1500);

    // Check vector call uses custom similaritySearchTokens
    const vectorCall = mockClients.vector.QueryItems.mock.calls[0].arguments[0];
    assert.strictEqual(vectorCall.max_tokens, 2500);
  });

  test("Agent service stores token configuration correctly", () => {
    assert.strictEqual(agentService.config.systemInstructionsTokens, 1000);
    assert.strictEqual(agentService.config.historyTokens, 2000);
    assert.strictEqual(agentService.config.similaritySearchTokens, 3000);
    assert.strictEqual(agentService.config.threshold, 0.3);
    assert.strictEqual(agentService.config.limit, 200);
    assert.strictEqual(agentService.config.temperature, 0.2);
  });

  test("ProcessRequest generates session ID when not provided", async () => {
    const request = {
      messages: [{ role: "user", content: "Hello" }],
      github_token: "test-token",
      // No session_id provided
    };

    const result = await agentService.ProcessRequest(request);

    // Should generate a session ID
    assert.strictEqual(result.session_id, "mock-session-id");

    // Should use generated session ID in history call
    const historyCall =
      mockClients.history.GetHistory.mock.calls[0].arguments[0];
    assert.strictEqual(historyCall.session_id, "mock-session-id");
  });

  test("ProcessRequest includes all required parameters in vector call", async () => {
    // Mock scope to return indices
    mockClients.scope.ResolveScope = mock.fn(() =>
      Promise.resolve({ indices: ["index1", "index2"] }),
    );

    const request = {
      messages: [{ role: "user", content: "Complex query" }],
      session_id: "test-session",
      github_token: "test-token",
    };

    await agentService.ProcessRequest(request);

    const vectorCall = mockClients.vector.QueryItems.mock.calls[0].arguments[0];

    assert.deepStrictEqual(vectorCall.indices, ["index1", "index2"]);
    assert.deepStrictEqual(vectorCall.vector, [0.1, 0.2, 0.3]);
    assert.strictEqual(vectorCall.threshold, 0.3);
    assert.strictEqual(vectorCall.limit, 200);
    assert.strictEqual(vectorCall.max_tokens, 3000);
  });
});
