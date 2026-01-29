import { calculateDotProduct } from "@copilot-ld/libvector";

/**
 * Analyzes traces and feedback to generate context injection rules for tool selection
 */
export class ExperienceLearner {
  #traceIndex;
  #feedbackIndex;
  #vectorClient;
  #experienceStore;

  /**
   * Creates a new ExperienceLearner instance
   * @param {object} traceIndex - Trace index for span queries
   * @param {object} feedbackIndex - Feedback index for signal queries
   * @param {object} vectorClient - Vector service gRPC client
   * @param {import("./store.js").ExperienceStore} experienceStore - Experience store
   */
  constructor(traceIndex, feedbackIndex, vectorClient, experienceStore) {
    if (!traceIndex) throw new Error("traceIndex is required");
    if (!feedbackIndex) throw new Error("feedbackIndex is required");
    if (!vectorClient) throw new Error("vectorClient is required");
    if (!experienceStore) throw new Error("experienceStore is required");

    this.#traceIndex = traceIndex;
    this.#feedbackIndex = feedbackIndex;
    this.#vectorClient = vectorClient;
    this.#experienceStore = experienceStore;
  }

  /**
   * Main learning loop - run as batch job
   * @returns {Promise<void>} Resolves when learning is complete
   */
  async learn() {
    // 1. Load recent feedback with linked traces
    const episodes = await this.#collectEpisodes();

    // 2. Extract tool call patterns with outcomes
    const toolCallPatterns = this.#extractToolCallPatterns(episodes);

    // 3. Learn tool-specific experience
    const toolExperience = this.#learnToolExperience(toolCallPatterns);

    // 4. Select few-shot examples (positive examples, diverse)
    const examples = await this.#selectFewShotExamples(episodes);

    // 5. Derive learned rules
    const rules = this.#deriveLearnedRules(toolCallPatterns);

    // 6. Store updated experience
    await this.#experienceStore.put("current", {
      tool_experience: toolExperience,
      examples,
      rules,
      updated_at: Date.now(),
    });
  }

  /**
   * Collect episodes: (query, tool_calls, feedback) tuples from recent feedback
   * @returns {Promise<Array>} Array of episode objects
   */
  async #collectEpisodes() {
    const feedback = await this.#feedbackIndex.query({
      filter: {
        after_timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      },
    });

    const episodes = [];

    for (const record of feedback.records) {
      // Get full trace for this conversation
      const spans = await this.#traceIndex.queryItems(null, {
        trace_id: record.trace_id,
      });

      // Parse failures silently skip—intentional for batch resilience
      const episode = this.#parseEpisode(spans, record);
      if (episode) episodes.push(episode);
    }

    return episodes;
  }

  /**
   * Parse trace spans into structured episode
   * @param {Array} spans - Trace spans from the trace index
   * @param {object} feedback - Feedback record with signal
   * @returns {object|null} Parsed episode or null if invalid
   */
  #parseEpisode(spans, feedback) {
    const toolCalls = spans
      .filter((s) => s.name === "tool.CallTool")
      .map((s) => ({
        tool_name: s.attributes?.function_name,
        parameters: s.attributes?.arguments,
        duration_ns:
          BigInt(s.end_time_unix_nano) - BigInt(s.start_time_unix_nano),
        success: s.status?.code !== "ERROR",
      }));

    // Find the user query from agent span
    const agentSpan = spans.find((s) => s.name === "agent.ProcessRequest");
    const query = agentSpan?.attributes?.["request.content"];

    if (!query || toolCalls.length === 0) return null;

    return {
      query,
      tool_calls: toolCalls,
      feedback: feedback.signal,
      trace_id: feedback.trace_id,
    };
  }

  /**
   * Extract patterns: which tools called for which query types
   * @param {Array} episodes - Array of parsed episodes
   * @returns {Map} Map of tool name to positive/negative examples
   */
  #extractToolCallPatterns(episodes) {
    const patterns = new Map(); // tool_name -> { positive: [], negative: [] }

    for (const episode of episodes) {
      for (const call of episode.tool_calls) {
        if (!patterns.has(call.tool_name)) {
          patterns.set(call.tool_name, { positive: [], negative: [] });
        }

        const bucket =
          episode.feedback === "SIGNAL_POSITIVE" ? "positive" : "negative";
        patterns.get(call.tool_name)[bucket].push({
          query: episode.query,
          parameters: call.parameters,
          success: call.success,
        });
      }
    }

    return patterns;
  }

  /**
   * Learn refined experience for each tool based on success/failure patterns
   * @param {Map} patterns - Tool patterns map from extractToolCallPatterns
   * @returns {Array} Array of tool experience objects
   */
  #learnToolExperience(patterns) {
    const experience = [];

    for (const [toolName, data] of patterns) {
      const totalPositive = data.positive.length;
      const totalNegative = data.negative.length;
      const total = totalPositive + totalNegative;

      if (total < 5) continue; // Need sufficient data

      const successRate = totalPositive / total;

      // Analyze failure patterns using simple heuristics
      const failurePatterns = this.#analyzeFailures(data.negative);

      experience.push({
        tool_name: toolName,
        success_rate: successRate,
        failure_patterns: failurePatterns,
        refined_applicability: this.#generateRefinedApplicability(
          toolName,
          data.positive,
          data.negative,
        ),
      });
    }

    return experience;
  }

  /**
   * Analyze common patterns in failed tool calls
   * @param {Array} negativeExamples - Array of negative feedback examples
   * @returns {Array} Array of failure pattern strings
   */
  #analyzeFailures(negativeExamples) {
    const patterns = [];

    // Group by parameter patterns and find commonalities
    const paramCounts = new Map();
    for (const example of negativeExamples) {
      try {
        const params = JSON.parse(example.parameters || "{}");
        for (const [key, value] of Object.entries(params)) {
          const paramKey = `${key}=${JSON.stringify(value)}`;
          paramCounts.set(paramKey, (paramCounts.get(paramKey) || 0) + 1);
        }
      } catch {
        // Skip malformed parameters
      }
    }

    // Parameters that appear in >50% of failures are suspicious
    const threshold = negativeExamples.length * 0.5;
    for (const [param, count] of paramCounts) {
      if (count >= threshold && count >= 3) {
        patterns.push(
          `Avoid: ${param} (appeared in ${count}/${negativeExamples.length} failures)`,
        );
      }
    }

    return patterns;
  }

  /**
   * Generate refined applicability text based on learned patterns
   * @param {string} toolName - Name of the tool
   * @param {Array} positive - Positive feedback examples
   * @param {Array} negative - Negative feedback examples
   * @returns {string} Refined applicability description
   */
  #generateRefinedApplicability(toolName, positive, negative) {
    return [
      `Success patterns (${positive.length} examples): queries typically involve direct information retrieval`,
      `Failure patterns (${negative.length} examples): avoid when query requires multi-step reasoning`,
    ].join("\n");
  }

  /**
   * Select diverse, high-quality few-shot examples from positive episodes
   * @param {Array} episodes - Array of all episodes
   * @returns {Promise<Array>} Array of few-shot example objects
   */
  async #selectFewShotExamples(episodes) {
    // Filter to positive examples only
    const positiveEpisodes = episodes.filter(
      (e) => e.feedback === "SIGNAL_POSITIVE",
    );

    if (positiveEpisodes.length === 0) return [];

    // Embed queries for diversity selection via vector service
    const queries = positiveEpisodes.map((e) => e.query);
    const embedResponse = await this.#vectorClient.Embed({ texts: queries });
    const embeddings = embedResponse.embeddings.map((e) => e.embedding);

    // Select diverse examples using maximal marginal relevance
    const selected = this.#selectDiverse(positiveEpisodes, embeddings, 20);

    return selected.map((episode, idx) => ({
      query_pattern: this.#abstractQuery(episode.query),
      tool_name: episode.tool_calls[0]?.tool_name,
      parameters_json: episode.tool_calls[0]?.parameters,
      outcome_summary: "User indicated satisfaction",
      embedding: embeddings[idx],
    }));
  }

  /**
   * Select diverse examples using greedy MMR-like selection algorithm
   * @param {Array} episodes - Candidate episodes to select from
   * @param {Array} embeddings - Corresponding embedding vectors
   * @param {number} k - Maximum number of examples to select
   * @returns {Array} Selected diverse episodes
   */
  #selectDiverse(episodes, embeddings, k) {
    if (episodes.length <= k) return episodes;

    const selected = [0]; // Start with first
    const remaining = new Set(episodes.map((_, i) => i).slice(1));

    while (selected.length < k && remaining.size > 0) {
      let bestIdx = -1;
      let bestScore = -Infinity;

      for (const idx of remaining) {
        // Compute minimum similarity to already selected
        let minSim = Infinity;
        for (const selIdx of selected) {
          const sim = calculateDotProduct(embeddings[idx], embeddings[selIdx]);
          minSim = Math.min(minSim, sim);
        }
        // We want high diversity (low similarity to existing)
        const score = -minSim;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }

      if (bestIdx >= 0) {
        selected.push(bestIdx);
        remaining.delete(bestIdx);
      }
    }

    return selected.map((i) => episodes[i]);
  }

  /**
   * Abstract a query into a pattern description by truncating if needed
   * @param {string} query - Original query string
   * @returns {string} Abstracted query pattern
   */
  #abstractQuery(query) {
    if (query.length > 100) {
      return query.slice(0, 100) + "...";
    }
    return query;
  }

  /**
   * Derive learned rules from aggregate patterns comparing tool success rates
   * @param {Map} patterns - Tool patterns map from extractToolCallPatterns
   * @returns {Array} Array of learned rule objects
   */
  #deriveLearnedRules(patterns) {
    const rules = [];
    const toolNames = Array.from(patterns.keys());

    for (let i = 0; i < toolNames.length; i++) {
      for (let j = i + 1; j < toolNames.length; j++) {
        const tool1 = toolNames[i];
        const tool2 = toolNames[j];
        const data1 = patterns.get(tool1);
        const data2 = patterns.get(tool2);

        const rate1 =
          data1.positive.length /
          (data1.positive.length + data1.negative.length || 1);
        const rate2 =
          data2.positive.length /
          (data2.positive.length + data2.negative.length || 1);

        // If one tool significantly outperforms another, create a rule
        if (Math.abs(rate1 - rate2) > 0.2) {
          const better = rate1 > rate2 ? tool1 : tool2;
          const betterRate = Math.max(rate1, rate2);

          rules.push({
            condition: `When both ${tool1} and ${tool2} could apply`,
            action: `Prefer ${better} (${(betterRate * 100).toFixed(0)}% success rate)`,
            confidence: Math.abs(rate1 - rate2),
            supporting_examples: data1.positive.length + data2.positive.length,
          });
        }
      }
    }

    return rules.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }
}
