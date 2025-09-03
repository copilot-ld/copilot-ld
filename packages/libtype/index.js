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
const llm = types.llm || {};
const vector = types.vector || {};
const memory = types.memory || {};

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

  if (!this.id.parent || parent) {
    // Parent can be passed as resource.Identifier, ensure string conversion.
    // Handle undefined/null parent values properly to avoid literal "undefined"
    this.id.parent =
      (parent != null ? String(parent) : "") || this.id?.parent || "";
  }
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
common.Conversation.prototype.withIdentifier = withIdentifier;
common.MessageV2.prototype.withIdentifier = withIdentifier;

common.Assistant.prototype.withTokens = withTokens;
common.Conversation.prototype.withTokens = withTokens;
common.MessageV2.prototype.withTokens = withTokens;

resource.Identifier.prototype.toString = function () {
  // Tree of resources, including this one
  let tree = [];

  if (!this.type) throw new Error("Resource type must not be null");
  if (!this.name) throw new Error("Resource name must not be null");

  // Check for string, as conversions can have happened earlier
  if (this.parent == "undefined") this.parent = undefined;

  // Extract the tree from parent
  if (this.parent !== undefined && this.parent !== null && this.parent !== "") {
    const path = String(this.parent).split(":").pop() || "";
    if (path) tree = path.split("/");
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

// Monkey-patch MessageV2.fromObject to gracefully convert content to an object
const originalMessageV2fromObject = common.MessageV2.fromObject;
common.MessageV2.fromObject = function (object) {
  if (typeof object.content === "string") {
    const content = { text: object.content };
    object = { ...object, content };
  }
  return originalMessageV2fromObject(object);
};

export {
  // Export namespaces only
  common,
  resource,
  agent,
  llm,
  vector,
  memory,
};
