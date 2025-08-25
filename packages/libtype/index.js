/* eslint-env node */

// Re-export selected message constructors from the generated single-file types
import * as types from "./types.js";
import { generateHash } from "@copilot-ld/libutil";

/** @typedef {import("./types.js").common.Message} common.Message */
/** @typedef {import("./types.js").common.Prompt} common.Prompt */
/** @typedef {import("./types.js").common.Similarity} common.Similarity */

const common = types.common || {};
const agent = types.agent || {};
const history = types.history || {};
const llm = types.llm || {};
const text = types.text || {};
const vector = types.vector || {};

/**
 * Checks if the prompt is empty (no messages or context)
 * @returns {boolean} True if prompt has no content
 */
common.Prompt.prototype.isEmpty = function () {
  return (
    Array.isArray(this.messages) &&
    this.messages.length === 0 &&
    Array.isArray(this.current_similarities) &&
    this.current_similarities.length === 0 &&
    Array.isArray(this.previous_similarities) &&
    this.previous_similarities.length === 0
  );
};

/**
 * Converts prompt to ordered messages array for LLM consumption
 * @returns {common.Message[]} Array of properly ordered Message objects
 */
common.Prompt.prototype.toMessages = function () {
  const messages = [];

  // Process system instructions
  const systemInstructions = Array.isArray(this.system_instructions)
    ? this.system_instructions
    : [];
  systemInstructions.forEach((instruction) => {
    messages.push(new common.Message({ role: "system", content: instruction }));
  });

  // Process current similarities
  if (
    Array.isArray(this.current_similarities) &&
    this.current_similarities.length > 0
  ) {
    const contextText = this.current_similarities
      .map((s) => s.text)
      .join("\n\n");
    messages.push(
      new common.Message({
        role: "system",
        content: `Current context:\n${contextText}`,
      }),
    );
  }

  // Process previous similarities
  if (
    Array.isArray(this.previous_similarities) &&
    this.previous_similarities.length > 0
  ) {
    const contextText = this.previous_similarities
      .map((s) => s.text)
      .join("\n\n");
    messages.push(
      new common.Message({
        role: "system",
        content: `Previous context:\n${contextText}`,
      }),
    );
  }

  // Process regular messages
  if (Array.isArray(this.messages)) {
    messages.push(...this.messages);
  }

  return messages;
};

/**
 * Reconstructs a Prompt object from an array of Message objects
 * @param {common.Message[]} messages - Array of Message objects to parse
 * @returns {common.Prompt} New Prompt object populated from parsed messages
 * @throws {Error} When message parsing fails
 */
common.Prompt.prototype.fromMessages = function (messages) {
  const systemInstructions = [];
  const currentSimilarities = [];
  const previousSimilarities = [];
  const regularMessages = [];

  // Handle invalid input
  if (!Array.isArray(messages)) {
    return new common.Prompt({
      system_instructions: systemInstructions,
      current_similarities: currentSimilarities,
      previous_similarities: previousSimilarities,
      messages: regularMessages,
    });
  }

  // Process each message by role and content
  messages.forEach((message) => {
    if (message.role === "system") {
      const content = message.content || "";

      // Process current similarities
      if (content.startsWith("Current context:\n")) {
        const contextText = content.substring("Current context:\n".length);
        const similarities = contextText
          .split("\n\n")
          .map((text) => new common.Similarity({ text: text.trim() }))
          .filter((sim) => sim.text);
        currentSimilarities.push(...similarities);
      }
      // Process previous similarities
      else if (content.startsWith("Previous context:\n")) {
        const contextText = content.substring("Previous context:\n".length);
        const similarities = contextText
          .split("\n\n")
          .map((text) => new common.Similarity({ text: text.trim() }))
          .filter((sim) => sim.text);
        previousSimilarities.push(...similarities);
      }
      // Process system instructions
      else {
        systemInstructions.push(content);
      }
    }
    // Process regular messages
    else {
      regularMessages.push(message);
    }
  });

  return new common.Prompt({
    system_instructions: systemInstructions,
    current_similarities: currentSimilarities,
    previous_similarities: previousSimilarities,
    messages: regularMessages,
  });
};

/**
 * Simple token counting approximation (1 token ≈ 4 characters)
 * This is a temporary implementation until we have access to proper tokenizer
 * @param {object} obj - Object to count tokens for
 * @returns {number} Approximate token count
 */
function countTokens(obj) {
  const str = JSON.stringify(obj);
  return Math.ceil(str.length / 4);
}

// URN namespace constant
const URN_NAMESPACE = "cld";

/**
 * Assign metadata to objects that have a meta property.
 * Call this before persisting the object.
 * @param {string} [withParent] - Parent ID (URN)
 */
function withMeta(withParent) {
  let path;
  let tree = [];
  let hash;

  // Always extract namespace and type from the constructor
  const type = this.constructor.getTypeUrl("copilot-ld.dev").split("/").pop();

  // Extract metadata from existing URN
  if (this.meta?.id) {
    [, path] = this.meta.id.split(":");
    tree = path.split("/");
    [, , hash] = tree[tree.length - 1].split(".");

    if (!hash) {
      throw new Error("Invalid meta.id format, missing hash");
    }
  }

  // Generate new metadata
  if (!hash) {
    switch (type) {
      case "common.MessageV2":
        hash = generateHash(type, this.content);
        break;

      default:
        if (!this.meta?.name) {
          throw new Error("Resource must have a name for metadata generation");
        }
        hash = generateHash(type, this.meta.name);
        break;
    }
  }

  // Extract metadata from provided parent URN
  if (withParent) {
    [, path] = withParent.split(":");
    tree = path.split("/");
    // Push this instance onto the tree
    tree.push(`${type}.${hash}`);
  }

  // If no meta.id or parent was provided, create a new root tree
  if (tree.length == 0) {
    tree.push(`${type}.${hash}`);
  }

  if (!this.meta) {
    this.meta = new common.Resource();
  }

  this.meta.id = `${URN_NAMESPACE}:${tree.join("/")}`;
  this.meta.type = type;
  this.meta.tokens = this.meta.tokens || countTokens(this);
}

common.MessageV2.prototype.withMeta = withMeta;

// Compiles a resource description
common.Resource.prototype.toDescription = function () {
  const sections = [];

  if (this.purpose) sections.push(`**Purpose:** ${this.purpose}`);

  if (this.instructions)
    sections.push(`**Instructions:** ${this.instructions}`);

  if (this.applicability)
    sections.push(`**Applicability:** ${this.applicability}`);

  if (this.evaluation) sections.push(`**Evaluation:** ${this.evaluation}`);

  return sections.join("\n\n");
};

export {
  // Export namespaces only
  common,
  agent,
  history,
  llm,
  text,
  vector,
};
