/* eslint-env node */

// Export everything from generated types (includes both core and tool namespaces)
export * from "./generated/types/types.js";

import * as types from "./generated/types/types.js";
import { countTokens } from "@copilot-ld/libutil";
import { generateHash, generateUUID } from "@copilot-ld/libutil";

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
  }

  const type = this.constructor.getTypeUrl("copilot-ld.dev").split("/").pop();
  if (!type)
    throw new Error("resource.withIdentifier: Resource type must not be null");

  let name;
  if (this.id?.name) {
    // Ensure normalization on just the last part of a dotted name
    name = this.id.name.split(".").pop();
  } else if (this?.name && typeof this.name === "string") {
    // Some resources have a .name property, use that if no id.name is set
    name = this.name;
  } else {
    name = this?.content
      ? generateHash(type, String(this.content))
      : generateUUID();
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
  if (!this?.type)
    throw new Error(
      "resource.Identifier.toString: Resource type must not be null: " +
        JSON.stringify(this),
    );
  if (!this?.name)
    throw new Error(
      "resource.Identifier.toString: Resource name must not be null",
    );

  // Check for string, as conversions can have happened earlier
  // TODO: Do we still need this?
  if (this.parent == "undefined") this.parent = undefined;

  // Extract the tree from parent
  let tree = [];
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
const MessageV2Ctor = common.MessageV2;
const MessageV2fromObject = MessageV2Ctor.fromObject;

// Monkey-patch MessageV2.fromObject to gracefully convert content to an object
common.MessageV2.fromObject = function (object) {
  if (typeof object.content === "string") {
    const content = { text: object.content };
    object = { ...object, content };
  }
  const typed = MessageV2fromObject(object);
  typed.withIdentifier();
  return typed;
};

// Patch .verify to handle convert string content to object
const MessageV2verify = MessageV2Ctor.verify;
common.MessageV2.verify = function (message) {
  if (message && typeof message.content === "string") {
    const content = { text: message.content };
    message = { ...message, content };
  }
  return MessageV2verify(message);
};

/**
 * Monkey-patches for common.Assistant
 */
const AssistantCtor = common.Assistant;
const AssistantfromObject = AssistantCtor.fromObject;

// Monkey-patch Assistant.fromObject to apply a default role if not set
common.Assistant.fromObject = function (object) {
  object.role = object?.role || "system";

  const typed = AssistantfromObject(object);
  typed.withIdentifier();
  return typed;
};

/**
 * Monkey-patches for common.ToolFunction
 */
const ToolFunctionCtor = common.ToolFunction;
const ToolFunctionfromObject = ToolFunctionCtor.fromObject;

// Monkey-patch ToolFunction.fromObject to gracefully convert .name to .id.name
common.ToolFunction.fromObject = function (object) {
  // If the object has a name property, construct the identifier from it
  if (object?.name) {
    if (object?.id) {
      object.id.name = object.name;
    } else {
      object.id = { name: object.name };
    }
  } else if (object?.id?.name) {
    object.name = object.id.name;
  }

  const typed = ToolFunctionfromObject(object);
  typed.withIdentifier();
  return typed;
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
