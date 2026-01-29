import { services } from "@copilot-ld/librpc";
import { feedback, common } from "@copilot-ld/libtype";

const { FeedbackBase } = services;

/**
 * Feedback service for feedback collection and experience management
 */
export class FeedbackService extends FeedbackBase {
  #feedbackIndex;
  #experienceStore;
  #learner;

  /**
   * Creates a new Feedback service instance
   * @param {import("@copilot-ld/libconfig").ServiceConfigInterface} config - Service configuration
   * @param {import("@copilot-ld/libfeedback").FeedbackIndex} feedbackIndex - Index for feedback records
   * @param {import("@copilot-ld/libfeedback").ExperienceStore} experienceStore - Storage for learned experience
   * @param {import("@copilot-ld/libfeedback").ExperienceLearner} learner - Experience learner instance
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
   * @param {import("@copilot-ld/libtype").feedback.FeedbackRecord} req - Feedback record
   * @returns {Promise<import("@copilot-ld/libtype").common.Empty>} Empty response
   */
  async RecordFeedback(req) {
    const record = feedback.FeedbackRecord.fromObject({
      ...req,
      timestamp: Date.now(),
    });

    await this.#feedbackIndex.put(record);

    return common.Empty.fromObject({});
  }

  /**
   * Queries feedback records with optional filters
   * @param {import("@copilot-ld/libtype").feedback.QueryRequest} req - Query request
   * @returns {Promise<import("@copilot-ld/libtype").feedback.FeedbackResponse>} Feedback response with records
   */
  async QueryFeedback(req) {
    const result = await this.#feedbackIndex.query(req);

    return feedback.FeedbackResponse.fromObject({ records: result.records });
  }

  /**
   * Gets the current learned experience
   * @param {import("@copilot-ld/libtype").feedback.ExperienceRequest} _req - Experience request (unused)
   * @returns {Promise<import("@copilot-ld/libtype").feedback.ExperienceResponse>} Experience response
   */
  async GetExperience(_req) {
    const experience = await this.#experienceStore.get("current");

    return feedback.ExperienceResponse.fromObject(experience || {});
  }

  /**
   * Triggers experience update by running the learner
   * @param {import("@copilot-ld/libtype").feedback.ExperienceUpdate} _req - Update request (unused)
   * @returns {Promise<import("@copilot-ld/libtype").common.Empty>} Empty response
   */
  async UpdateExperience(_req) {
    await this.#learner.learn();

    return common.Empty.fromObject({});
  }
}
