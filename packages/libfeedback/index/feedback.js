import { IndexBase } from "@copilot-ld/libindex";
import { learn } from "@copilot-ld/libtype";

/**
 * Index for feedback records with query support
 * @augments IndexBase
 */
export class FeedbackIndex extends IndexBase {
  /**
   * Creates a new FeedbackIndex
   * @param {import("@copilot-ld/libstorage").StorageInterface} storage - Storage backend
   */
  constructor(storage) {
    super(storage, "feedback.jsonl");
  }

  /**
   * Loads data from storage and reconstructs FeedbackRecord objects
   * @returns {Promise<void>}
   */
  async loadData() {
    await super.loadData();

    // Reconstruct feedback objects from plain JSON
    for (const item of this.index.values()) {
      if (item.record && typeof item.record === "object") {
        item.record = learn.FeedbackRecord.fromObject(item.record);
      }
    }
  }

  /**
   * Adds a feedback record to the index
   * @param {import("@copilot-ld/libtype").learn.FeedbackRecord} record - Feedback record
   * @returns {Promise<void>}
   */
  async put(record) {
    if (!record) throw new Error("record is required");
    if (!record.conversation_id) throw new Error("conversation_id is required");

    const item = {
      id: `${record.conversation_id}:${record.message_id || record.timestamp}`,
      record,
    };

    await super.add(item);
  }

  /**
   * Queries feedback records with optional filters
   * @param {object} req - Query request
   * @param {object} [req.filter] - Filter options
   * @param {string} [req.filter.conversation_id] - Filter by conversation
   * @param {number} [req.filter.after_timestamp] - Filter by timestamp
   * @param {number} [req.limit] - Maximum records to return
   * @returns {Promise<{records: Array}>} Query result with records array
   */
  async query(req = {}) {
    if (!this.loaded) await this.loadData();

    const { filter = {}, limit } = req;
    const { conversation_id, after_timestamp } = filter;

    const records = [];

    for (const item of this.index.values()) {
      const record = item.record;
      if (!record) continue;

      // Apply conversation filter
      if (conversation_id && record.conversation_id !== conversation_id) {
        continue;
      }

      // Apply timestamp filter
      if (after_timestamp && record.timestamp < after_timestamp) {
        continue;
      }

      records.push(record);
    }

    // Sort by timestamp descending (newest first)
    records.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const limited = limit && limit > 0 ? records.slice(0, limit) : records;

    return { records: limited };
  }
}
