/* eslint-env node */

// Export everything from generated types (includes both core and tool namespaces)
export * from "../../generated/types/types.js";

// Re-export selected message constructors from the consolidated generated types
// NOTE: generated artifacts now live under top-level generated/ directory
import * as types from "../../generated/types/types.js";
import { countTokens } from "@copilot-ld/libcopilot";
import { generateHash } from "@copilot-ld/libutil";

// Core namespaces only (tools and any experimental namespaces are excluded intentionally)
const {
  common = {},
  resource = {},
  agent = {},
  llm = {},
  vector = {},
  memory = {},
  tool = {},
} = types;

/**
 * Ensure that the identifier has values assigned. Call before persisting.
 * @param {string} [parent] - Parent URI
 */
function withIdentifier(parent) {
  if (!this?.id) {
    this.id = new resource.Identifier();
  } else {
    // Re-cast to ensure proper prototype
    this.id = resource.Identifier.fromObject(this.id);
  }

  const type = this.constructor.getTypeUrl("copilot-ld.dev").split("/").pop();

  if (!type) throw new Error("Resource type must not be null");

  let name;
  if (this.id?.name) {
    // Ensure normalization on just the last part of a dotted name
    name = this.id.name.split(".").pop();
  } else {
    const content = String(this?.content);
    if (content === null || content === "null")
      throw new Error(`Resource content must not be null`);
    name = generateHash(type, content);
  }
  this.id.type = type;
  this.id.name = name;

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
common.ToolFunction.prototype.withIdentifier = withIdentifier;

common.Assistant.prototype.withTokens = withTokens;
common.Conversation.prototype.withTokens = withTokens;
common.MessageV2.prototype.withTokens = withTokens;
common.ToolFunction.prototype.withTokens = withTokens;

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
    tree.push(`${this.type}.${this.name}`);
  }

  // If there is no tree, create a new one
  if (tree.length == 0) {
    tree.push(`${this.type}.${this.name}`);
  }

  return `cld:${tree.join("/")}`;
};

// Compiles a resource descriptor description
resource.Descriptor.prototype.toString = function () {
  const sections = [];

  if (this.summary?.length > 0) sections.push(this.summary);
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

/**
 * Monkey-patches for common.MessageV2
 */
const originalMessageV2Constructor = common.MessageV2;

// Monkey-patch MessageV2.fromObject to gracefully convert content to an object
const originalMessageV2fromObject = originalMessageV2Constructor.fromObject;
common.MessageV2.fromObject = function (object) {
  if (typeof object.content === "string") {
    const content = { text: object.content };
    object = { ...object, content };
  }
  return originalMessageV2fromObject(object);
};

// Patch .verify to handle convert string content to object
const originalMessageV2verify = originalMessageV2Constructor.verify;
common.MessageV2.verify = function (message) {
  if (message && typeof message.content === "string") {
    const content = { text: message.content };
    message = { ...message, content };
  }
  return originalMessageV2verify(message);
};

/**
 * Monkey-patches for common.ToolFunction
 */
const originalToolFunctionConstructor = common.ToolFunction;

// Monkey-patch ToolFunction.fromObject to gracefully convert .name to .id.name
const originalToolFunctionfromObject =
  originalToolFunctionConstructor.fromObject;
common.ToolFunction.fromObject = function (object) {
  // Name at the root take precedence over id.name as it assigned by the LLM
  if (object?.name) {
    if (object?.id) {
      object.id.name = object.name;
    } else {
      object.id = { name: object.name };
    }
    delete object.name;
  }
  return originalToolFunctionfromObject(object);
};

export {
  // Export all namespaces with any applied patches
  common,
  resource,
  agent,
  llm,
  vector,
  memory,
  tool,
};
