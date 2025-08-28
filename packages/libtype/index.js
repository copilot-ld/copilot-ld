/* eslint-env node */

// Re-export selected message constructors from the generated single-file types
import * as types from "./types.js";
import { countTokens } from "@copilot-ld/libcopilot";
import { generateHash } from "@copilot-ld/libutil";

/** @typedef {import("./types.js").common.Message} common.Message */
/** @typedef {import("./types.js").common.Prompt} common.Prompt */
/** @typedef {import("./types.js").common.Similarity} common.Similarity */

const common = types.common || {};
const resource = types.resource || {};
const agent = types.agent || {};
const history = types.history || {};
const llm = types.llm || {};
const text = types.text || {};
const vector = types.vector || {};

/**
 * Ensure that the identifier has values assigned. Call before persisting.
 * @param {string} [parent] - Parent URI
 */
function withIdentifier(parent) {
  if (!this?.id) this.id = new resource.Identifier();
  const type = this.constructor.getTypeUrl("copilot-ld.dev").split("/").pop();

  if (!type) throw new Error("Resource type must not be null");

  let name;
  if (this.id?.name) {
    name = this.id.name.split(".").pop();
  } else {
    const content = String(this?.content);
    if (content === null || content === "null")
      throw new Error(`Resource content must not be null`);
    name = generateHash(type, content);
  }
  this.id.type = type;
  this.id.name = `${type}.${name}`;
  this.id.parent = parent || this.id?.parent;
}

/**
 * Ensure tokens are counted for each resource representation.
 */
function withTokens() {
  const representations = ["content", "descriptor"];
  representations.forEach((r) => {
    if (this?.[r]) {
      this[r].tokens = countTokens(String(this[r]));
    }
  });
}

common.Assistant.prototype.withIdentifier = withIdentifier;
common.MessageV2.prototype.withIdentifier = withIdentifier;

common.Assistant.prototype.withTokens = withTokens;
common.MessageV2.prototype.withTokens = withTokens;

resource.Identifier.prototype.toString = function () {
  // Tree of resources, including this one
  let tree = [];

  if (!this.type) throw new Error("Resource type must not be null");
  if (!this.name) throw new Error("Resource name must not be null");

  // Extract the tree of resources
  if (this.parent) {
    const [, path] = this.parent.split(":");
    tree = path.split("/");
    // Push this resource onto the tree
    tree.push(this.name);
  }

  // If there is no tree, create a new one
  if (tree.length == 0) {
    tree.push(this.name);
  }

  return `cld:${tree.join("/")}`;
};

// Compiles a resource descriptor description
resource.Descriptor.prototype.toString = function () {
  const sections = [];

  if (this.purpose?.length > 0) sections.push(`## Purpose\n\n${this.purpose}`);

  if (this.instructions?.length > 0)
    sections.push(`## Instructions\n\n${this.instructions}`);

  if (this.applicability?.length > 0)
    sections.push(`## Applicability\n\n${this.applicability}`);

  if (this.evaluation?.length > 0)
    sections.push(`## Evaluation\n\n${this.evaluation}`);

  return sections.join("\n\n");
};

resource.Content.prototype.toString = function () {
  if (this?.jsonld) {
    return this.jsonld;
  }
  return this.text || "";
};

resource.Descriptor.prototype.only = function () {
  const { id, name, type, tokens, magnitude } = this;
  return new resource.Descriptor({ id, name, type, tokens, magnitude });
};

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

export {
  // Export namespaces only
  common,
  resource,
  agent,
  history,
  llm,
  text,
  vector,
};
