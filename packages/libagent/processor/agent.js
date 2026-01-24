import { parseFrontMatter } from "@copilot-ld/libdoc";
import { common } from "@copilot-ld/libtype";

/**
 * Agent processor for batch processing agent configurations from .agent.md files
 */
export class AgentProcessor {
  #resourceIndex;
  #configStorage;
  #logger;

  /**
   * Creates a new AgentProcessor instance
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} configStorage - Storage for configuration files
   * @param {import("@copilot-ld/libtelemetry").Logger} logger - Logger instance for debug output
   */
  constructor(resourceIndex, configStorage, logger) {
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!configStorage) throw new Error("configStorage is required");
    if (!logger) throw new Error("logger is required");

    this.#resourceIndex = resourceIndex;
    this.#configStorage = configStorage;
    this.#logger = logger;
  }

  /**
   * Processes agent configurations from config/agents/*.agent.md files
   * @returns {Promise<void>}
   */
  async process() {
    const files = await this.#configStorage.findByPrefix("agents/");
    const agentFiles = files.filter((f) => f.endsWith(".agent.md"));

    for (const file of agentFiles) {
      const raw = await this.#configStorage.get(file);
      const { data, content } = parseFrontMatter(raw.toString("utf-8"));

      const agent = common.Agent.fromObject({
        name: data.name,
        description: data.description || "",
        temperature: data.temperature ?? 0.7,
        tools: data.tools || [],
        infer: data.infer ?? false,
        handoffs: data.handoffs || [],
        content: content.trim(),
      });

      await this.#resourceIndex.put(agent);
    }

    this.#logger.debug("AgentProcessor", "Processing complete", {
      count: agentFiles.length,
    });
  }
}
