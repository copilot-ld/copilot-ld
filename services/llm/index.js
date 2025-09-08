/* eslint-env node */
import { common } from "@copilot-ld/libtype";

import { LlmBase } from "../../generated/services/llm/service.js";

/**
 * LLM service for completions and embeddings
 */
export class LlmService extends LlmBase {
  #llmFactory;

  /**
   * Creates a new LLM service instance
   * @param {object} config - Service configuration object
   * @param {(token: string, model?: string, fetchFn?: Function, tokenizerFn?: Function) => object} llmFactory - Factory function to create LLM instances
   * @param {(namespace: string) => import("@copilot-ld/libutil").LoggerInterface} [logFn] - Optional log factory
   */
  constructor(config, llmFactory, logFn) {
    super(config, logFn);
    this.#llmFactory = llmFactory;
  }

  /** @inheritdoc */
  async CreateCompletions(req) {
    const llm = this.#llmFactory(req.github_token, this.config.model);

    // Convert MessageV2 objects to simple message format for the LLM
    // TODO: This is not where fallbacks should be handled
    // TODO: We need better and more flexible rendering of representations
    const pendingToolCallIds = [];
    const messages = req.messages.map((m, idx) => {
      const content = m.content ? String(m.content) : String(m.descriptor);
      const out = { role: m.role || "system", content };
      // Queue tool call ids from assistant messages
      if (
        m.role === "assistant" &&
        Array.isArray(m.tool_calls) &&
        m.tool_calls.length > 0
      ) {
        for (const tc of m.tool_calls) pendingToolCallIds.push(tc.id);
        out.tool_calls = m.tool_calls.map((tc) => ({
          id: tc.id,
          type: tc.type || "function",
          function: {
            name:
              (tc.function?.id?.name && tc.function.id.name.split(".").pop()) ||
              tc.function?.name ||
              "unknown",
            arguments: tc.function?.arguments,
          },
        }));
      }
      if (m.role === "tool") {
        // Reconstruct tool_call_id if missing by consuming from queue
        const explicit = m.tool_call_id || m.toolCallId;
        const reconstructed = explicit || pendingToolCallIds.shift();
        out.tool_call_id = reconstructed || `auto_tool_call_${idx}`;
      }
      return out;
    });

    // TODO: Again, we need more flexible rendering of representations
    const tools = req.tools?.map((t) => {
      const rawIdName = t.function.id?.name || "";
      const simpleName = rawIdName.includes(".")
        ? rawIdName.split(".").pop()
        : rawIdName;
      const tool = {
        type: t.type,
        function: {
          name: simpleName || t.function.name || "unknown",
          description:
            t.function.descriptor?.purpose ||
            String(t.function.descriptor) ||
            "",
          parameters: t.function.parameters || {},
        },
      };

      // Ensure parameters is a plain object, not a complex type
      if (
        tool.function.parameters &&
        typeof tool.function.parameters.toObject === "function"
      ) {
        tool.function.parameters = tool.function.parameters.toObject();
      }

      // Ensure required fields are specified for better LLM function calling
      if (tool.function.parameters && tool.function.parameters.properties) {
        if (!tool.function.parameters.required) {
          // For hash functions, input is required
          if (tool.function.name.includes("hash")) {
            tool.function.parameters.required = ["input"];
          }
          // For other tools, make all properties required by default
          else {
            tool.function.parameters.required = Object.keys(
              tool.function.parameters.properties,
            );
          }
        }

        // Improve parameter descriptions
        if (tool.function.parameters.properties.input) {
          tool.function.parameters.properties.input.description =
            "The text input to process";
        }
      }

      return tool;
    });

    // Debug logging to see the actual tool format
    if (req.tools && req.tools.length > 0) {
      this.debug("Raw tools received from agent:", {
        count: req.tools.length,
        firstTool: JSON.stringify(req.tools[0], null, 2),
      });
    }

    if (tools && tools.length > 0) {
      this.debug("Sending tools to API:", {
        count: tools.length,
        toolNames: tools.map((t) => t.function.name),
        sampleTool: JSON.stringify(tools[0], null, 2),
      });
    }

    // Log completion details
    this.debug("Creating completion for messages", {
      messages: messages.length,
      tools: tools?.length || 0,
      temperature: req.temperature,
      model: this.config.model,
    });

    // Final sanitation: ensure each tool.parameters has required array listing every property if missing
    if (tools) {
      for (const tool of tools) {
        const p = tool.function.parameters;
        if (p && p.properties) {
          if (!Array.isArray(p.required) || p.required.length === 0) {
            p.required = Object.keys(p.properties);
          }
        }
      }
    }

    const params = { messages, tools, temperature: req.temperature };

    let data;
    try {
      data = await llm.createCompletions(params);
    } catch (err) {
      // If failure likely due to tool schema, retry once without tools
      this.debug("CreateCompletions failed, retrying without tools", {
        error: err.message,
      });
      // Detect zero-limit condition and permanently drop tools for this attempt
      const zeroLimit = /limit of 0/.test(err.message);
      data = await llm.createCompletions({
        messages,
        temperature: req.temperature,
      });
      // Attach a synthetic assistant note so downstream can explain lack of tools
      data.choices = data.choices || [];
      data.choices.push({
        index: data.choices.length,
        message: new common.MessageV2({
          role: "system",
          content: zeroLimit
            ? "Provider reported zero prompt token limit for tools; responded without tool calling."
            : "Tool execution unavailable: falling back to direct response.",
        }),
        finish_reason: "stop",
      });
    }

    // Ensure all response data uses proper typed constructors
    return {
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices: data.choices.map((choice) =>
        choice instanceof common.Choice ? choice : new common.Choice(choice),
      ),
      usage: data.usage
        ? data.usage instanceof common.Usage
          ? data.usage
          : new common.Usage(data.usage)
        : undefined,
    };
  }

  /** @inheritdoc */
  async CreateEmbeddings(req) {
    this.debug("Creating embeddings", {
      chunks: req.chunks?.length || 0,
    });

    const llm = this.#llmFactory(req.github_token, this.config.model);
    const data = await llm.createEmbeddings(req.chunks);

    // Ensure embedding data uses proper typed constructors
    return {
      data: data.map((embedding) =>
        embedding instanceof common.Embedding
          ? embedding
          : new common.Embedding(embedding),
      ),
    };
  }
}

// Export the service class (no bootstrap code here)
export { LlmClient } from "../../generated/services/llm/client.js";
