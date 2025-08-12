/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

// Test the integrated prompt management flow
import { PromptAssembler, PromptStorage } from "@copilot-ld/libprompt";
import { LocalStorage } from "@copilot-ld/libstorage";
import { Message, Similarity } from "@copilot-ld/libtype";

describe("Prompt Management Integration", () => {
  test("demonstrates complete prompt flow", async () => {
    // Create a mock storage backend
    const mockFs = {
      mkdir: async () => {},
      writeFile: async () => {},
      readFile: async () => {
        throw new Error("Not found"); // Simulates new session
      },
    };

    const storage = new LocalStorage("/tmp/test", mockFs);
    const promptStorage = new PromptStorage(storage);

    // 1. Get existing prompt (empty for new session)
    const existingPrompt = await promptStorage.get("test-session");
    assert(existingPrompt.isEmpty(), "New session should have empty prompt");

    // 2. Create a new user message
    const newUserMessage = new Message({
      role: "user",
      content: "How do I deploy with Docker?",
    });

    // 3. Simulate similarity search results
    const currentSimilarities = [
      new Similarity({
        id: "chunk-1",
        score: 0.95,
        tokens: 150,
        scope: "docker",
        text: "Docker containers provide isolated environments for applications...",
      }),
      new Similarity({
        id: "chunk-2",
        score: 0.87,
        tokens: 120,
        scope: "deployment",
        text: "To deploy an application, you need to consider security, scaling...",
      }),
    ];

    // 4. Build request prompt using PromptAssembler
    const systemInstructions = [
      "You are a helpful assistant that provides accurate technical guidance",
      "Focus on practical, actionable advice",
    ];

    const requestPrompt = PromptAssembler.buildRequest(
      existingPrompt,
      newUserMessage,
      currentSimilarities,
      systemInstructions,
    );

    // 5. Verify the prompt structure
    assert.strictEqual(requestPrompt.system_instructions.length, 2);
    assert.strictEqual(requestPrompt.current_similarities.length, 2);
    assert.strictEqual(requestPrompt.previous_similarities.length, 0);
    assert.strictEqual(requestPrompt.messages.length, 1);
    assert.strictEqual(requestPrompt.isEmpty(), false);

    // 6. Convert to messages for LLM consumption
    const llmMessages = requestPrompt.toMessages();

    // Should have: 2 system instructions + 1 current context + 1 user message = 4 messages
    assert.strictEqual(llmMessages.length, 4);
    assert.strictEqual(llmMessages[0].role, "system");
    assert.strictEqual(
      llmMessages[0].content,
      "You are a helpful assistant that provides accurate technical guidance",
    );
    assert.strictEqual(llmMessages[1].role, "system");
    assert.strictEqual(
      llmMessages[1].content,
      "Focus on practical, actionable advice",
    );
    assert.strictEqual(llmMessages[2].role, "system");
    assert(llmMessages[2].content.includes("Current context"));
    assert(
      llmMessages[2].content.includes("Docker containers provide isolated"),
    );
    assert.strictEqual(llmMessages[3].role, "user");
    assert.strictEqual(llmMessages[3].content, "How do I deploy with Docker?");

    // 7. Simulate LLM response and update prompt
    const assistantMessage = new Message({
      role: "assistant",
      content:
        "To deploy with Docker, follow these steps: 1. Create a Dockerfile...",
    });

    const updatedPrompt = PromptAssembler.updateWithResponse(
      requestPrompt,
      assistantMessage,
    );

    // 8. Verify prompt update
    assert.strictEqual(updatedPrompt.system_instructions.length, 2);
    assert.strictEqual(updatedPrompt.current_similarities.length, 0); // Moved to previous
    assert.strictEqual(updatedPrompt.previous_similarities.length, 2); // Current moved here
    assert.strictEqual(updatedPrompt.messages.length, 2); // User + assistant

    // Verify similarities moved correctly
    assert.strictEqual(updatedPrompt.previous_similarities[0].id, "chunk-1");
    assert.strictEqual(updatedPrompt.previous_similarities[1].id, "chunk-2");

    // 9. Test second turn of conversation
    const secondUserMessage = new Message({
      role: "user",
      content: "What about security considerations?",
    });
    const newCurrentSimilarities = [
      new Similarity({
        id: "chunk-3",
        score: 0.92,
        tokens: 180,
        scope: "security",
        text: "Docker security best practices include using non-root users...",
      }),
    ];

    const secondRequestPrompt = PromptAssembler.buildRequest(
      updatedPrompt,
      secondUserMessage,
      newCurrentSimilarities,
      systemInstructions,
    );

    // 10. Verify conversation context is maintained
    assert.strictEqual(secondRequestPrompt.messages.length, 3); // User + assistant + new user
    assert.strictEqual(secondRequestPrompt.current_similarities.length, 1); // New search
    assert.strictEqual(secondRequestPrompt.previous_similarities.length, 2); // Previous context

    const secondLlmMessages = secondRequestPrompt.toMessages();

    // Should emphasize current over previous context
    const currentContextMessage = secondLlmMessages.find((m) =>
      m.content.includes("Current context"),
    );
    const previousContextMessage = secondLlmMessages.find((m) =>
      m.content.includes("Previous context"),
    );

    assert(currentContextMessage, "Should have current context");
    assert(
      currentContextMessage.content.includes("Docker security best practices"),
    );
    assert(previousContextMessage, "Should have previous context");
    assert(
      previousContextMessage.content.includes(
        "Docker containers provide isolated",
      ),
    );
  });

  test("prompt storage persistence", async () => {
    const storedData = JSON.stringify({
      system_instructions: ["Test instruction"],
      messages: [{ role: "user", content: "test" }],
      current_similarities: [],
      previous_similarities: [],
    });

    // Mock file system that returns our test data
    const mockFs = {
      mkdir: async () => {},
      writeFile: async () => {},
      readFile: async () => Buffer.from(storedData),
    };

    const storage = new LocalStorage("/tmp/test", mockFs);
    const promptStorage = new PromptStorage(storage);

    const prompt = await promptStorage.get("test-session");

    assert.strictEqual(prompt.system_instructions.length, 1);
    assert.strictEqual(prompt.messages.length, 1);
    assert.strictEqual(prompt.messages[0].content, "test");
  });
});
