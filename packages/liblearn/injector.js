import { calculateDotProduct } from "@copilot-ld/libvector";

/**
 * Injects learned experience into agent context for improved tool selection
 */
export class ExperienceInjector {
  #experienceStore;
  #vectorClient;

  /**
   * Creates a new ExperienceInjector instance
   * @param {import("./store/experience.js").ExperienceStore} experienceStore - Experience store
   * @param {object} vectorClient - Vector service gRPC client
   */
  constructor(experienceStore, vectorClient) {
    if (!experienceStore) throw new Error("experienceStore is required");
    if (!vectorClient) throw new Error("vectorClient is required");

    this.#experienceStore = experienceStore;
    this.#vectorClient = vectorClient;
  }

  /**
   * Generate experience context to inject before tool selection
   * @param {string} userQuery - Current user query
   * @param {string[]} availableTools - Tools the agent can call
   * @returns {Promise<string>} Experience context to inject
   */
  async generateContext(userQuery, availableTools) {
    const experience = await this.#experienceStore.get("current");
    if (!experience) return "";

    const sections = [];

    // 1. Tool-specific experience
    const relevantExperience = (experience.tool_experience || [])
      .filter((e) => availableTools.includes(e.tool_name))
      .filter((e) => e.failure_patterns.length > 0 || e.success_rate < 0.7);

    if (relevantExperience.length > 0) {
      sections.push(this.#formatToolExperience(relevantExperience));
    }

    // 2. Few-shot examples (select most similar to current query)
    const relevantExamples = await this.#selectRelevantExamples(
      userQuery,
      experience.examples || [],
      3, // Top 3 most similar
    );

    if (relevantExamples.length > 0) {
      sections.push(this.#formatExamples(relevantExamples));
    }

    // 3. Learned rules
    const applicableRules = (experience.rules || [])
      .filter((r) => r.confidence > 0.3)
      .slice(0, 5);

    if (applicableRules.length > 0) {
      sections.push(this.#formatRules(applicableRules));
    }

    if (sections.length === 0) return "";

    return [
      "<learned_experience>",
      "The following is derived from historical feedback on similar queries:",
      "",
      ...sections,
      "</learned_experience>",
    ].join("\n");
  }

  /**
   * Format tool-specific experience into markdown
   * @param {Array} experience - Tool experience records
   * @returns {string} Formatted markdown string
   */
  #formatToolExperience(experience) {
    const lines = ["## Tool Experience", ""];

    for (const e of experience) {
      lines.push(
        `### ${e.tool_name} (${(e.success_rate * 100).toFixed(0)}% historical success)`,
      );
      if (e.failure_patterns.length > 0) {
        lines.push("Common mistakes to avoid:");
        for (const pattern of e.failure_patterns) {
          lines.push(`- ${pattern}`);
        }
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Format few-shot examples into markdown
   * @param {Array} examples - Few-shot example records
   * @returns {string} Formatted markdown string
   */
  #formatExamples(examples) {
    const lines = ["## Successful Examples for Similar Queries", ""];

    for (const ex of examples) {
      lines.push(`Query type: "${ex.query_pattern}"`);
      lines.push(`Tool used: ${ex.tool_name}`);
      lines.push(`Parameters: ${ex.parameters_json}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Format learned rules into markdown
   * @param {Array} rules - Learned rule records
   * @returns {string} Formatted markdown string
   */
  #formatRules(rules) {
    const lines = ["## Learned Rules", ""];

    for (const rule of rules) {
      lines.push(`- ${rule.condition}: ${rule.action}`);
    }

    return lines.join("\n");
  }

  /**
   * Select examples most relevant to current query using vector similarity
   * @param {string} query - Current user query
   * @param {Array} examples - All stored examples with embeddings
   * @param {number} k - Number of examples to select
   * @returns {Promise<Array>} Top k most similar examples
   */
  async #selectRelevantExamples(query, examples, k) {
    if (examples.length === 0) return [];

    // Embed current query
    const response = await this.#vectorClient.Embed({ texts: [query] });
    const queryEmbedding = response.embeddings[0].embedding;

    // Score examples by similarity
    const scored = examples
      .filter((ex) => ex.embedding)
      .map((ex) => ({
        example: ex,
        similarity: calculateDotProduct(queryEmbedding, ex.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, k).map((s) => s.example);
  }
}
