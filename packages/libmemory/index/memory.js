/* eslint-env node */
import { IndexBase } from "@copilot-ld/libindex";

/**
 * Memory index for managing conversation memory using JSONL storage
 * Extends IndexBase to provide memory-specific operations with deduplication
 * Each instance manages memory for a single resource/conversation
 * @implements {import("@copilot-ld/libindex").IndexInterface}
 */
export class MemoryIndex extends IndexBase {
  /**
   * Adds identifiers to memory
   * @param {import("@copilot-ld/libtype").resource.Identifier} identifier - Identifier to add
   * @returns {Promise<void>}
   */
  async add(identifier) {
    const item = {
      id: String(identifier),
      identifier,
    };

    await super.add(item);
  }
}
