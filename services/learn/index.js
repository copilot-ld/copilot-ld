import { services } from "@copilot-ld/librpc";
import { learn, common } from "@copilot-ld/libtype";

const { LearnBase } = services;

/**
 * Learn service for feedback collection and experience management
 */
export class LearnService extends LearnBase {
  #feedbackIndex;
  #experienceStore;
  #learner;

  /**
   * Creates a new Learn service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration
   * @param {import("@copilot-ld/liblearn").FeedbackIndex} feedbackIndex - Index for feedback records
   * @param {import("@copilot-ld/liblearn").ExperienceStore} experienceStore - Storage for learned experience
   * @param {import("@copilot-ld/liblearn").ExperienceLearner} learner - Experience learner instance
   */
  constructor(config, feedbackIndex, experienceStore, learner) {
    super(config);
    if (!feedbackIndex) throw new Error("feedbackIndex is required");
    if (!experienceStore) throw new Error("experienceStore is required");
    if (!learner) throw new Error("learner is required");

    this.#feedbackIndex = feedbackIndex;
    this.#experienceStore = experienceStore;
    this.#learner = learner;
  }

  /**
   * Records a feedback signal for a conversation message
   * @param {import("@copilot-ld/libtype").learn.FeedbackRecord} req - Feedback record
   * @returns {Promise<import("@copilot-ld/libtype").common.Empty>} Empty response
   */
  async RecordFeedback(req) {
    this.debug("RecordFeedback", "Recording feedback", {
      conversation_id: req.conversation_id,
      signal: req.signal,
    });

    const record = learn.FeedbackRecord.fromObject({
      ...req,
      timestamp: Date.now(),
    });

    await this.#feedbackIndex.put(record);

    return common.Empty.fromObject({});
  }

  /**
   * Queries feedback records with optional filters
   * @param {import("@copilot-ld/libtype").learn.QueryRequest} req - Query request
   * @returns {Promise<import("@copilot-ld/libtype").learn.FeedbackResponse>} Feedback response with records
   */
  async QueryFeedback(req) {
    this.debug("QueryFeedback", "Querying feedback", {
      filter: req.filter,
      limit: req.limit,
    });

    const result = await this.#feedbackIndex.query(req);

    return learn.FeedbackResponse.fromObject({ records: result.records });
  }

  /**
   * Gets the current learned experience
   * @param {import("@copilot-ld/libtype").learn.ExperienceRequest} req - Experience request
   * @returns {Promise<import("@copilot-ld/libtype").learn.ExperienceResponse>} Experience response
   */
  async GetExperience(req) {
    this.debug("GetExperience", "Getting experience", {
      candidate_tools: req.candidate_tools?.length,
    });

    const experience = await this.#experienceStore.get("current");

    return learn.ExperienceResponse.fromObject(experience || {});
  }

  /**
   * Triggers experience update by running the learner
   * @param {import("@copilot-ld/libtype").learn.ExperienceUpdate} _req - Update request (unused)
   * @returns {Promise<import("@copilot-ld/libtype").common.Empty>} Empty response
   */
  async UpdateExperience(_req) {
    this.debug("UpdateExperience", "Triggering experience update");

    await this.#learner.learn();

    return common.Empty.fromObject({});
  }
}
