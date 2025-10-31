#!/usr/bin/env node
/* eslint-env node */
import { createLlm } from "@copilot-ld/libcopilot";
import { createScriptConfig } from "@copilot-ld/libconfig";
import { common, tool } from "@copilot-ld/libtype";

/**
 * Test available LLM models by sending a simple greeting message with tool support.
 * Outputs working models and provides a summary of successful vs total models.
 */
async function main() {
  try {
    const config = await createScriptConfig("hello");
    const token = await config.githubToken();
    const llm = createLlm(token);
    const models = await llm.listModels();
    const successfulModels = [];

    for (const model of models) {
      try {
        const testLlm = createLlm(token, model.id);
        const messages = [
          common.Message.fromObject({
            role: "user",
            content: "Hello",
          }),
        ];

        const tools = [
          tool.ToolDefinition.fromObject({
            type: "function",
            function: {
              name: "get_greeting",
              descriptor: {
                purpose: "Returns a simple greeting message",
              },
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Name to greet" },
                },
              },
            },
          }),
        ];

        const response = await testLlm.createCompletions(messages, tools);
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
