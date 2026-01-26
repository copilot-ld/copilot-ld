#!/usr/bin/env node
import { createLlmApi } from "@copilot-ld/libllm";
import { createScriptConfig } from "@copilot-ld/libconfig";

const TIMEOUT_MS = 30000;

/**
 * Wraps a promise with a timeout.
 * @param {Promise} promise - The promise to wrap.
 * @param {number} ms - Timeout in milliseconds.
 * @param {string} label - Label for timeout error message.
 * @returns {Promise} - Resolves with promise result or rejects on timeout.
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

/**
 * Test available LLM models by sending a simple greeting message with tool support.
 * Outputs working models and provides a summary of successful vs total models.
 */
async function main() {
  try {
    const config = await createScriptConfig("hello");
    const token = await config.llmToken();
    const baseUrl = config.llmBaseUrl();
    const embeddingBaseUrl = config.embeddingBaseUrl();
    const llm = createLlmApi(token, undefined, baseUrl, embeddingBaseUrl);
    const models = await llm.listModels();
    const successfulModels = [];

    for (const model of models) {
      try {
        const testLlm = createLlmApi(token, model.id, baseUrl, embeddingBaseUrl);
        const window = {
          messages: [{ role: "user", content: "Hello" }],
          tools: [
            {
              type: "function",
              function: {
                name: "get_greeting",
                description: "Returns a simple greeting message",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Name to greet" },
                  },
                },
              },
            },
          ],
        };

        const response = await withTimeout(
          testLlm.createCompletions(window),
          TIMEOUT_MS,
          model.id,
        );
        if (response.choices && response.choices.length > 0) {
          console.log(`✅ ${model.id}`);
          successfulModels.push(model.id);
        }
      } catch (error) {
        console.log(`❌ ${model.id}: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(
      `\nWorking models: ${successfulModels.length}/${models.length}`,
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
