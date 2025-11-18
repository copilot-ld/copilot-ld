/* eslint-env node */

import { countTokens, generateHash, generateUUID } from "@copilot-ld/libutil";

import * as types from "./generated/types/types.js";

// Export everything from generated types (includes both core and tool namespaces)
export * from "./generated/types/types.js";

// Core namespaces only (tools and any experimental namespaces are excluded intentionally)
const {
  common = {},
  resource = {},
  agent = {},
  llm = {},
  vector = {},
  graph = {},
  memory = {},
  tool = {},
  trace = {},
} = types;

/**
 * Ensure that the identifier has values assigned. Call before persisting.
 * @param {string} [parent] - Parent ID
 * @param {string} [subject] - Subject URI
 */
function withIdentifier(parent, subject) {
  // Initialize id if missing
  this.id = this.id || new resource.Identifier();

  const type = this.constructor.getTypeUrl("copilot-ld.dev").split("/").pop();
  if (!type)
    throw new Error("resource.withIdentifier: Resource type must not be null");

  // Get name with fallback chain
  let name = this.id.name;
  name = name
    ? // Normalize dotted names to just the last part
      name.split(".").pop()
    : // Fallback to .name property if available
      this.name && typeof this.name === "string"
      ? this.name
      : // Fallback to content hash if available
        this.content
        ? generateHash(type, this.content)
        : // Fallback to UUID
          generateUUID();

  this.id.type = type;
  this.id.name = name;

  this.id.subject = subject ? String(subject) : this.id.subject || "";

  this.id.parent = parent ? String(parent) : this.id.parent || "";

  if (this.content && typeof this.content === "string") {
    this.id.tokens = countTokens(this.content);
  }
}

common.Assistant.prototype.withIdentifier = withIdentifier;
common.Conversation.prototype.withIdentifier = withIdentifier;
common.Message.prototype.withIdentifier = withIdentifier;
tool.ToolFunction.prototype.withIdentifier = withIdentifier;

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
  if (this.parent && this.parent !== "undefined" && this.parent !== "") {
    const path = String(this.parent).split(":").pop() || "";
    if (path) tree = path.split("/");
    tree.push(`${this.type}.${this.name}`);
  } else {
    tree.push(`${this.type}.${this.name}`);
  }

  return tree.join("/");
};

/**
 * Monkey-patches for common.Message
 */
const MessageCtor = common.Message;
const MessagefromObject = MessageCtor.fromObject;

// Monkey-patch Message.fromObject to apply identifier
common.Message.fromObject = function (object) {
  const typed = MessagefromObject(object);
  typed.withIdentifier();
  return typed;
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
 * Monkey-patches for tool.ToolFunction
 */
const ToolFunctionCtor = tool.ToolFunction;
const ToolFunctionfromObject = ToolFunctionCtor.fromObject;

// Monkey-patch ToolFunction.fromObject to gracefully convert .name to .id.name
tool.ToolFunction.fromObject = function (object) {
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
  graph,
  memory,
  tool,
  trace,
};
