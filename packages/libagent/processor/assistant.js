import yaml from "js-yaml";

import { common } from "@copilot-ld/libtype";

/**
 * Assistant processor for batch processing assistant configurations
 */
export class AssistantProcessor {
  #resourceIndex;
  #configStorage;
  #logger;

  /**
   * Creates a new AssistantProcessor instance
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance
   * @param {import("@copilot-ld/libstorage").StorageInterface} configStorage - Storage for configuration files
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
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
   * Processes assistant configurations from assistants.yml
   * @returns {Promise<void>}
   */
  async process() {
    const data = await this.#configStorage.get("assistants.yml");
    const objects = yaml.load(data);

    for (const config of objects) {
      const assistant = common.Assistant.fromObject({
        ...config,
      });
      await this.#resourceIndex.put(assistant);
    }

    this.#logger.debug("Processor", "Processing complete", {
      count: objects.length,
    });
  }
}
