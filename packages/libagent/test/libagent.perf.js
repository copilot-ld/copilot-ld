/* eslint-env node */
import { test, describe } from "node:test";

import { AgentMind } from "../mind.js";
import { common, resource } from "@copilot-ld/libtype";
import { createPerformanceTest } from "@copilot-ld/libperf";

describe("LibAgent Performance Tests", () => {
  /**
   * Generate mock tool identifiers
   * @param {number} count - Number of tools to generate
   * @returns {object[]} Mock tool identifiers
   */
  function generateMockTools(count) {
    const tools = [];

    for (let i = 0; i < count; i++) {
      const identifier = resource.Identifier.fromObject({
        name: `tool-${i}`,
        type: "tool.ToolFunction",
        tokens: 150,
      });
      tools.push(identifier);
    }

    return tools;
  }

  /**
   * Create mock dependencies for AgentMind
   * @param {number} toolCount - Number of tools
   * @returns {object} Mock dependencies
   */
  function createDependencies(toolCount) {
    const tools = generateMockTools(toolCount);

    const assistant = new common.Assistant({
      role: "system",
      content: "You are a helpful assistant for testing",
    });
    assistant.withIdentifier();

    const config = {
      budget: {
        tokens: 100000,
        allocation: {
          tools: 0.2,
          history: 0.6,
          results: 0.2,
        },
      },
      assistant: "test-assistant",
      permanent_tools: [],
      temperature: 0.7,
      threshold: 0.3,
      limit: 10,
    };

    const mockCallbacks = {
      memory: {
        append: () => Promise.resolve({}),
        get: () =>
          Promise.resolve({
            tools: [],
            context: [],
            history: [],
          }),
      },
      llm: {
        createCompletions: () =>
          Promise.resolve({
            choices: [
              {
                message: common.Message.fromObject({
                  role: "assistant",
                  content: "Response",
                }),
              },
            ],
          }),
      },
      tool: {
        call: () =>
          Promise.resolve(
            common.Message.fromObject({
              role: "tool",
              content: "Tool result",
            }),
          ),
      },
    };

    const mockResourceIndex = {
      get: () => Promise.resolve([]),
      put: () => Promise.resolve(),
    };

    return {
      config,
      mockCallbacks,
      mockResourceIndex,
      assistant,
      tools,
    };
  }

  test(
    "AgentMind.calculateBudget by tool count",
    createPerformanceTest({
      count: [25, 50, 100, 200],
      setupFn: (toolCount) => {
        const deps = createDependencies(toolCount);
        const agentMind = new AgentMind(
          deps.assistant,
          deps.tools,
          deps.config,
          deps.mockCallbacks,
          deps.mockResourceIndex,
        );
        const tasks = [];
        return {
          agentMind,
          assistant: deps.assistant,
          tools: deps.tools,
          tasks,
        };
      },
      testFn: ({ agentMind, assistant, tools, tasks }) =>
        agentMind.calculateBudget(assistant, tools, tasks),
      constraints: {
        maxDuration: 10,
        maxMemory: 500,
        scaling: "linear",
        tolerance: 1.5,
      },
    }),
  );

  test(
    "AgentMind.calculateBudget memory stability",
    createPerformanceTest({
      count: 10000,
      setupFn: (iterations) => {
        const { config, mockCallbacks, mockResourceIndex, assistant, tools } =
          createDependencies(50);
        const mind = new AgentMind(config, mockCallbacks, mockResourceIndex, {
          executeToolLoop: () => Promise.resolve({}),
        });
        const tasks = [];
        return { mind, assistant, tools, tasks, iterations };
      },
      testFn: async ({ mind, assistant, tools, tasks, iterations }) => {
        for (let i = 0; i < iterations; i++) {
          mind.calculateBudget(assistant, tools, tasks);
        }
      },
      constraints: {
        maxMemory: 1000,
      },
    }),
  );
});
