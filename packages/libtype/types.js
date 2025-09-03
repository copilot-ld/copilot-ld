/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const resource = ($root.resource = (() => {
  /**
   * Namespace resource.
   * @exports resource
   * @namespace
   */
  const resource = {};

  resource.Identifier = (function () {
    /**
     * Properties of an Identifier.
     * @memberof resource
     * @interface IIdentifier
     * @property {string|null} [type] Identifier type
     * @property {string|null} [name] Identifier name
     * @property {string|null} [parent] Identifier parent
     * @property {number|null} [tokens] Identifier tokens
     * @property {number|null} [score] Identifier score
     */

    /**
     * Constructs a new Identifier.
     * @memberof resource
     * @classdesc Represents an Identifier.
     * @implements IIdentifier
     * @constructor
     * @param {resource.IIdentifier=} [properties] Properties to set
     */
    function Identifier(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Identifier type.
     * @member {string} type
     * @memberof resource.Identifier
     * @instance
     */
    Identifier.prototype.type = "";

    /**
     * Identifier name.
     * @member {string} name
     * @memberof resource.Identifier
     * @instance
     */
    Identifier.prototype.name = "";

    /**
     * Identifier parent.
     * @member {string} parent
     * @memberof resource.Identifier
     * @instance
     */
    Identifier.prototype.parent = "";

    /**
     * Identifier tokens.
     * @member {number|null|undefined} tokens
     * @memberof resource.Identifier
     * @instance
     */
    Identifier.prototype.tokens = null;

    /**
     * Identifier score.
     * @member {number|null|undefined} score
     * @memberof resource.Identifier
     * @instance
     */
    Identifier.prototype.score = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Identifier _tokens.
     * @member {"tokens"|undefined} _tokens
     * @memberof resource.Identifier
     * @instance
     */
    Object.defineProperty(Identifier.prototype, "_tokens", {
      get: $util.oneOfGetter(($oneOfFields = ["tokens"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Identifier _score.
     * @member {"score"|undefined} _score
     * @memberof resource.Identifier
     * @instance
     */
    Object.defineProperty(Identifier.prototype, "_score", {
      get: $util.oneOfGetter(($oneOfFields = ["score"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified Identifier message. Does not implicitly {@link resource.Identifier.verify|verify} messages.
     * @function encode
     * @memberof resource.Identifier
     * @static
     * @param {resource.Identifier} message Identifier message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Identifier.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.type);
      if (message.name != null && Object.hasOwnProperty.call(message, "name"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
      if (
        message.parent != null &&
        Object.hasOwnProperty.call(message, "parent")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.parent);
      if (
        message.tokens != null &&
        Object.hasOwnProperty.call(message, "tokens")
      )
        writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.tokens);
      if (message.score != null && Object.hasOwnProperty.call(message, "score"))
        writer.uint32(/* id 5, wireType 1 =*/ 41).double(message.score);
      return writer;
    };

    /**
     * Decodes an Identifier message from the specified reader or buffer.
     * @function decode
     * @memberof resource.Identifier
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {resource.Identifier} Identifier
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Identifier.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.resource.Identifier();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.type = reader.string();
            break;
          }
          case 2: {
            message.name = reader.string();
            break;
          }
          case 3: {
            message.parent = reader.string();
            break;
          }
          case 4: {
            message.tokens = reader.int32();
            break;
          }
          case 5: {
            message.score = reader.double();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an Identifier message.
     * @function verify
     * @memberof resource.Identifier
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Identifier.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isString(message.type)) return "type: string expected";
      if (message.name != null && message.hasOwnProperty("name"))
        if (!$util.isString(message.name)) return "name: string expected";
      if (message.parent != null && message.hasOwnProperty("parent"))
        if (!$util.isString(message.parent)) return "parent: string expected";
      if (message.tokens != null && message.hasOwnProperty("tokens")) {
        properties._tokens = 1;
        if (!$util.isInteger(message.tokens)) return "tokens: integer expected";
      }
      if (message.score != null && message.hasOwnProperty("score")) {
        properties._score = 1;
        if (typeof message.score !== "number") return "score: number expected";
      }
      return null;
    };

    /**
     * Creates an Identifier message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof resource.Identifier
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {resource.Identifier} Identifier
     */
    Identifier.fromObject = function fromObject(object) {
      if (object instanceof $root.resource.Identifier) return object;
      let message = new $root.resource.Identifier();
      if (object.type != null) message.type = String(object.type);
      if (object.name != null) message.name = String(object.name);
      if (object.parent != null) message.parent = String(object.parent);
      if (object.tokens != null) message.tokens = object.tokens | 0;
      if (object.score != null) message.score = Number(object.score);
      return message;
    };

    /**
     * Creates a plain object from an Identifier message. Also converts values to other types if specified.
     * @function toObject
     * @memberof resource.Identifier
     * @static
     * @param {resource.Identifier} message Identifier
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Identifier.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.type = "";
        object.name = "";
        object.parent = "";
      }
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = message.type;
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.parent != null && message.hasOwnProperty("parent"))
        object.parent = message.parent;
      if (message.tokens != null && message.hasOwnProperty("tokens")) {
        object.tokens = message.tokens;
        if (options.oneofs) object._tokens = "tokens";
      }
      if (message.score != null && message.hasOwnProperty("score")) {
        object.score =
          options.json && !isFinite(message.score)
            ? String(message.score)
            : message.score;
        if (options.oneofs) object._score = "score";
      }
      return object;
    };

    /**
     * Converts this Identifier to JSON.
     * @function toJSON
     * @memberof resource.Identifier
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Identifier.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Identifier
     * @function getTypeUrl
     * @memberof resource.Identifier
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Identifier.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/resource.Identifier";
    };

    return Identifier;
  })();

  resource.Descriptor = (function () {
    /**
     * Properties of a Descriptor.
     * @memberof resource
     * @interface IDescriptor
     * @property {number|null} [tokens] Descriptor tokens
     * @property {string|null} [purpose] Descriptor purpose
     * @property {string|null} [instructions] Descriptor instructions
     * @property {string|null} [applicability] Descriptor applicability
     * @property {string|null} [evaluation] Descriptor evaluation
     */

    /**
     * Constructs a new Descriptor.
     * @memberof resource
     * @classdesc Resource descriptor representation
     * @implements IDescriptor
     * @constructor
     * @param {resource.IDescriptor=} [properties] Properties to set
     */
    function Descriptor(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Descriptor tokens.
     * @member {number} tokens
     * @memberof resource.Descriptor
     * @instance
     */
    Descriptor.prototype.tokens = 0;

    /**
     * Descriptor purpose.
     * @member {string} purpose
     * @memberof resource.Descriptor
     * @instance
     */
    Descriptor.prototype.purpose = "";

    /**
     * Descriptor instructions.
     * @member {string} instructions
     * @memberof resource.Descriptor
     * @instance
     */
    Descriptor.prototype.instructions = "";

    /**
     * Descriptor applicability.
     * @member {string} applicability
     * @memberof resource.Descriptor
     * @instance
     */
    Descriptor.prototype.applicability = "";

    /**
     * Descriptor evaluation.
     * @member {string} evaluation
     * @memberof resource.Descriptor
     * @instance
     */
    Descriptor.prototype.evaluation = "";

    /**
     * Encodes the specified Descriptor message. Does not implicitly {@link resource.Descriptor.verify|verify} messages.
     * @function encode
     * @memberof resource.Descriptor
     * @static
     * @param {resource.Descriptor} message Descriptor message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Descriptor.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.tokens != null &&
        Object.hasOwnProperty.call(message, "tokens")
      )
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.tokens);
      if (
        message.purpose != null &&
        Object.hasOwnProperty.call(message, "purpose")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.purpose);
      if (
        message.instructions != null &&
        Object.hasOwnProperty.call(message, "instructions")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.instructions);
      if (
        message.applicability != null &&
        Object.hasOwnProperty.call(message, "applicability")
      )
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.applicability);
      if (
        message.evaluation != null &&
        Object.hasOwnProperty.call(message, "evaluation")
      )
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.evaluation);
      return writer;
    };

    /**
     * Decodes a Descriptor message from the specified reader or buffer.
     * @function decode
     * @memberof resource.Descriptor
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {resource.Descriptor} Descriptor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Descriptor.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.resource.Descriptor();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.tokens = reader.int32();
            break;
          }
          case 2: {
            message.purpose = reader.string();
            break;
          }
          case 3: {
            message.instructions = reader.string();
            break;
          }
          case 4: {
            message.applicability = reader.string();
            break;
          }
          case 5: {
            message.evaluation = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Descriptor message.
     * @function verify
     * @memberof resource.Descriptor
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Descriptor.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        if (!$util.isInteger(message.tokens)) return "tokens: integer expected";
      if (message.purpose != null && message.hasOwnProperty("purpose"))
        if (!$util.isString(message.purpose)) return "purpose: string expected";
      if (
        message.instructions != null &&
        message.hasOwnProperty("instructions")
      )
        if (!$util.isString(message.instructions))
          return "instructions: string expected";
      if (
        message.applicability != null &&
        message.hasOwnProperty("applicability")
      )
        if (!$util.isString(message.applicability))
          return "applicability: string expected";
      if (message.evaluation != null && message.hasOwnProperty("evaluation"))
        if (!$util.isString(message.evaluation))
          return "evaluation: string expected";
      return null;
    };

    /**
     * Creates a Descriptor message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof resource.Descriptor
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {resource.Descriptor} Descriptor
     */
    Descriptor.fromObject = function fromObject(object) {
      if (object instanceof $root.resource.Descriptor) return object;
      let message = new $root.resource.Descriptor();
      if (object.tokens != null) message.tokens = object.tokens | 0;
      if (object.purpose != null) message.purpose = String(object.purpose);
      if (object.instructions != null)
        message.instructions = String(object.instructions);
      if (object.applicability != null)
        message.applicability = String(object.applicability);
      if (object.evaluation != null)
        message.evaluation = String(object.evaluation);
      return message;
    };

    /**
     * Creates a plain object from a Descriptor message. Also converts values to other types if specified.
     * @function toObject
     * @memberof resource.Descriptor
     * @static
     * @param {resource.Descriptor} message Descriptor
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Descriptor.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.tokens = 0;
        object.purpose = "";
        object.instructions = "";
        object.applicability = "";
        object.evaluation = "";
      }
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        object.tokens = message.tokens;
      if (message.purpose != null && message.hasOwnProperty("purpose"))
        object.purpose = message.purpose;
      if (
        message.instructions != null &&
        message.hasOwnProperty("instructions")
      )
        object.instructions = message.instructions;
      if (
        message.applicability != null &&
        message.hasOwnProperty("applicability")
      )
        object.applicability = message.applicability;
      if (message.evaluation != null && message.hasOwnProperty("evaluation"))
        object.evaluation = message.evaluation;
      return object;
    };

    /**
     * Converts this Descriptor to JSON.
     * @function toJSON
     * @memberof resource.Descriptor
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Descriptor.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Descriptor
     * @function getTypeUrl
     * @memberof resource.Descriptor
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Descriptor.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/resource.Descriptor";
    };

    return Descriptor;
  })();

  resource.Content = (function () {
    /**
     * Properties of a Content.
     * @memberof resource
     * @interface IContent
     * @property {number|null} [tokens] Content tokens
     * @property {string|null} [text] Content text
     * @property {string|null} [jsonld] Content jsonld
     */

    /**
     * Constructs a new Content.
     * @memberof resource
     * @classdesc Resource content representation
     * @implements IContent
     * @constructor
     * @param {resource.IContent=} [properties] Properties to set
     */
    function Content(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Content tokens.
     * @member {number} tokens
     * @memberof resource.Content
     * @instance
     */
    Content.prototype.tokens = 0;

    /**
     * Content text.
     * @member {string|null|undefined} text
     * @memberof resource.Content
     * @instance
     */
    Content.prototype.text = null;

    /**
     * Content jsonld.
     * @member {string|null|undefined} jsonld
     * @memberof resource.Content
     * @instance
     */
    Content.prototype.jsonld = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Content type.
     * @member {"text"|"jsonld"|undefined} type
     * @memberof resource.Content
     * @instance
     */
    Object.defineProperty(Content.prototype, "type", {
      get: $util.oneOfGetter(($oneOfFields = ["text", "jsonld"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified Content message. Does not implicitly {@link resource.Content.verify|verify} messages.
     * @function encode
     * @memberof resource.Content
     * @static
     * @param {resource.Content} message Content message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Content.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.tokens != null &&
        Object.hasOwnProperty.call(message, "tokens")
      )
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.tokens);
      if (message.text != null && Object.hasOwnProperty.call(message, "text"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.text);
      if (
        message.jsonld != null &&
        Object.hasOwnProperty.call(message, "jsonld")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.jsonld);
      return writer;
    };

    /**
     * Decodes a Content message from the specified reader or buffer.
     * @function decode
     * @memberof resource.Content
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {resource.Content} Content
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Content.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.resource.Content();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.tokens = reader.int32();
            break;
          }
          case 2: {
            message.text = reader.string();
            break;
          }
          case 3: {
            message.jsonld = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Content message.
     * @function verify
     * @memberof resource.Content
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Content.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        if (!$util.isInteger(message.tokens)) return "tokens: integer expected";
      if (message.text != null && message.hasOwnProperty("text")) {
        properties.type = 1;
        if (!$util.isString(message.text)) return "text: string expected";
      }
      if (message.jsonld != null && message.hasOwnProperty("jsonld")) {
        if (properties.type === 1) return "type: multiple values";
        properties.type = 1;
        if (!$util.isString(message.jsonld)) return "jsonld: string expected";
      }
      return null;
    };

    /**
     * Creates a Content message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof resource.Content
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {resource.Content} Content
     */
    Content.fromObject = function fromObject(object) {
      if (object instanceof $root.resource.Content) return object;
      let message = new $root.resource.Content();
      if (object.tokens != null) message.tokens = object.tokens | 0;
      if (object.text != null) message.text = String(object.text);
      if (object.jsonld != null) message.jsonld = String(object.jsonld);
      return message;
    };

    /**
     * Creates a plain object from a Content message. Also converts values to other types if specified.
     * @function toObject
     * @memberof resource.Content
     * @static
     * @param {resource.Content} message Content
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Content.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.tokens = 0;
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        object.tokens = message.tokens;
      if (message.text != null && message.hasOwnProperty("text")) {
        object.text = message.text;
        if (options.oneofs) object.type = "text";
      }
      if (message.jsonld != null && message.hasOwnProperty("jsonld")) {
        object.jsonld = message.jsonld;
        if (options.oneofs) object.type = "jsonld";
      }
      return object;
    };

    /**
     * Converts this Content to JSON.
     * @function toJSON
     * @memberof resource.Content
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Content.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Content
     * @function getTypeUrl
     * @memberof resource.Content
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Content.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/resource.Content";
    };

    return Content;
  })();

  return resource;
})());

export const common = ($root.common = (() => {
  /**
   * Namespace common.
   * @exports common
   * @namespace
   */
  const common = {};

  common.Message = (function () {
    /**
     * Properties of a Message.
     * @memberof common
     * @interface IMessage
     * @property {string|null} [role] Message role
     * @property {string|null} [content] Message content
     */

    /**
     * Constructs a new Message.
     * @memberof common
     * @classdesc @deprecated
     * @implements IMessage
     * @constructor
     * @param {common.IMessage=} [properties] Properties to set
     */
    function Message(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Message role.
     * @member {string} role
     * @memberof common.Message
     * @instance
     */
    Message.prototype.role = "";

    /**
     * Message content.
     * @member {string} content
     * @memberof common.Message
     * @instance
     */
    Message.prototype.content = "";

    /**
     * Encodes the specified Message message. Does not implicitly {@link common.Message.verify|verify} messages.
     * @function encode
     * @memberof common.Message
     * @static
     * @param {common.Message} message Message message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Message.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.role != null && Object.hasOwnProperty.call(message, "role"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.role);
      if (
        message.content != null &&
        Object.hasOwnProperty.call(message, "content")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.content);
      return writer;
    };

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @function decode
     * @memberof common.Message
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Message} Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Message.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Message();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.role = reader.string();
            break;
          }
          case 2: {
            message.content = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Message message.
     * @function verify
     * @memberof common.Message
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Message.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.role != null && message.hasOwnProperty("role"))
        if (!$util.isString(message.role)) return "role: string expected";
      if (message.content != null && message.hasOwnProperty("content"))
        if (!$util.isString(message.content)) return "content: string expected";
      return null;
    };

    /**
     * Creates a Message message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Message
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Message} Message
     */
    Message.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Message) return object;
      let message = new $root.common.Message();
      if (object.role != null) message.role = String(object.role);
      if (object.content != null) message.content = String(object.content);
      return message;
    };

    /**
     * Creates a plain object from a Message message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Message
     * @static
     * @param {common.Message} message Message
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Message.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.role = "";
        object.content = "";
      }
      if (message.role != null && message.hasOwnProperty("role"))
        object.role = message.role;
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = message.content;
      return object;
    };

    /**
     * Converts this Message to JSON.
     * @function toJSON
     * @memberof common.Message
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Message.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Message
     * @function getTypeUrl
     * @memberof common.Message
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Message.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Message";
    };

    return Message;
  })();

  common.Usage = (function () {
    /**
     * Properties of a Usage.
     * @memberof common
     * @interface IUsage
     * @property {number|null} [prompt_tokens] Usage prompt_tokens
     * @property {number|null} [completion_tokens] Usage completion_tokens
     * @property {number|null} [total_tokens] Usage total_tokens
     */

    /**
     * Constructs a new Usage.
     * @memberof common
     * @classdesc Represents a Usage.
     * @implements IUsage
     * @constructor
     * @param {common.IUsage=} [properties] Properties to set
     */
    function Usage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Usage prompt_tokens.
     * @member {number} prompt_tokens
     * @memberof common.Usage
     * @instance
     */
    Usage.prototype.prompt_tokens = 0;

    /**
     * Usage completion_tokens.
     * @member {number} completion_tokens
     * @memberof common.Usage
     * @instance
     */
    Usage.prototype.completion_tokens = 0;

    /**
     * Usage total_tokens.
     * @member {number} total_tokens
     * @memberof common.Usage
     * @instance
     */
    Usage.prototype.total_tokens = 0;

    /**
     * Encodes the specified Usage message. Does not implicitly {@link common.Usage.verify|verify} messages.
     * @function encode
     * @memberof common.Usage
     * @static
     * @param {common.Usage} message Usage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Usage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.prompt_tokens != null &&
        Object.hasOwnProperty.call(message, "prompt_tokens")
      )
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.prompt_tokens);
      if (
        message.completion_tokens != null &&
        Object.hasOwnProperty.call(message, "completion_tokens")
      )
        writer
          .uint32(/* id 2, wireType 0 =*/ 16)
          .int32(message.completion_tokens);
      if (
        message.total_tokens != null &&
        Object.hasOwnProperty.call(message, "total_tokens")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.total_tokens);
      return writer;
    };

    /**
     * Decodes a Usage message from the specified reader or buffer.
     * @function decode
     * @memberof common.Usage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Usage} Usage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Usage.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Usage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.prompt_tokens = reader.int32();
            break;
          }
          case 2: {
            message.completion_tokens = reader.int32();
            break;
          }
          case 3: {
            message.total_tokens = reader.int32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Usage message.
     * @function verify
     * @memberof common.Usage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Usage.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (
        message.prompt_tokens != null &&
        message.hasOwnProperty("prompt_tokens")
      )
        if (!$util.isInteger(message.prompt_tokens))
          return "prompt_tokens: integer expected";
      if (
        message.completion_tokens != null &&
        message.hasOwnProperty("completion_tokens")
      )
        if (!$util.isInteger(message.completion_tokens))
          return "completion_tokens: integer expected";
      if (
        message.total_tokens != null &&
        message.hasOwnProperty("total_tokens")
      )
        if (!$util.isInteger(message.total_tokens))
          return "total_tokens: integer expected";
      return null;
    };

    /**
     * Creates a Usage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Usage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Usage} Usage
     */
    Usage.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Usage) return object;
      let message = new $root.common.Usage();
      if (object.prompt_tokens != null)
        message.prompt_tokens = object.prompt_tokens | 0;
      if (object.completion_tokens != null)
        message.completion_tokens = object.completion_tokens | 0;
      if (object.total_tokens != null)
        message.total_tokens = object.total_tokens | 0;
      return message;
    };

    /**
     * Creates a plain object from a Usage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Usage
     * @static
     * @param {common.Usage} message Usage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Usage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.prompt_tokens = 0;
        object.completion_tokens = 0;
        object.total_tokens = 0;
      }
      if (
        message.prompt_tokens != null &&
        message.hasOwnProperty("prompt_tokens")
      )
        object.prompt_tokens = message.prompt_tokens;
      if (
        message.completion_tokens != null &&
        message.hasOwnProperty("completion_tokens")
      )
        object.completion_tokens = message.completion_tokens;
      if (
        message.total_tokens != null &&
        message.hasOwnProperty("total_tokens")
      )
        object.total_tokens = message.total_tokens;
      return object;
    };

    /**
     * Converts this Usage to JSON.
     * @function toJSON
     * @memberof common.Usage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Usage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Usage
     * @function getTypeUrl
     * @memberof common.Usage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Usage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Usage";
    };

    return Usage;
  })();

  common.Choice = (function () {
    /**
     * Properties of a Choice.
     * @memberof common
     * @interface IChoice
     * @property {number|null} [index] Choice index
     * @property {common.MessageV2|null} [message] Choice message
     * @property {string|null} [finish_reason] Choice finish_reason
     */

    /**
     * Constructs a new Choice.
     * @memberof common
     * @classdesc Represents a Choice.
     * @implements IChoice
     * @constructor
     * @param {common.IChoice=} [properties] Properties to set
     */
    function Choice(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Choice index.
     * @member {number} index
     * @memberof common.Choice
     * @instance
     */
    Choice.prototype.index = 0;

    /**
     * Choice message.
     * @member {common.MessageV2|null|undefined} message
     * @memberof common.Choice
     * @instance
     */
    Choice.prototype.message = null;

    /**
     * Choice finish_reason.
     * @member {string|null|undefined} finish_reason
     * @memberof common.Choice
     * @instance
     */
    Choice.prototype.finish_reason = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Choice _finish_reason.
     * @member {"finish_reason"|undefined} _finish_reason
     * @memberof common.Choice
     * @instance
     */
    Object.defineProperty(Choice.prototype, "_finish_reason", {
      get: $util.oneOfGetter(($oneOfFields = ["finish_reason"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified Choice message. Does not implicitly {@link common.Choice.verify|verify} messages.
     * @function encode
     * @memberof common.Choice
     * @static
     * @param {common.Choice} message Choice message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Choice.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.index != null && Object.hasOwnProperty.call(message, "index"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.index);
      if (
        message.message != null &&
        Object.hasOwnProperty.call(message, "message")
      )
        $root.common.MessageV2.encode(
          message.message,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (
        message.finish_reason != null &&
        Object.hasOwnProperty.call(message, "finish_reason")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.finish_reason);
      return writer;
    };

    /**
     * Decodes a Choice message from the specified reader or buffer.
     * @function decode
     * @memberof common.Choice
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Choice} Choice
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Choice.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Choice();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.index = reader.int32();
            break;
          }
          case 2: {
            message.message = $root.common.MessageV2.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 3: {
            message.finish_reason = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Choice message.
     * @function verify
     * @memberof common.Choice
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Choice.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.index != null && message.hasOwnProperty("index"))
        if (!$util.isInteger(message.index)) return "index: integer expected";
      if (message.message != null && message.hasOwnProperty("message")) {
        let error = $root.common.MessageV2.verify(message.message);
        if (error) return "message." + error;
      }
      if (
        message.finish_reason != null &&
        message.hasOwnProperty("finish_reason")
      ) {
        properties._finish_reason = 1;
        if (!$util.isString(message.finish_reason))
          return "finish_reason: string expected";
      }
      return null;
    };

    /**
     * Creates a Choice message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Choice
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Choice} Choice
     */
    Choice.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Choice) return object;
      let message = new $root.common.Choice();
      if (object.index != null) message.index = object.index | 0;
      if (object.message != null) {
        if (typeof object.message !== "object")
          throw TypeError(".common.Choice.message: object expected");
        message.message = $root.common.MessageV2.fromObject(object.message);
      }
      if (object.finish_reason != null)
        message.finish_reason = String(object.finish_reason);
      return message;
    };

    /**
     * Creates a plain object from a Choice message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Choice
     * @static
     * @param {common.Choice} message Choice
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Choice.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.index = 0;
        object.message = null;
      }
      if (message.index != null && message.hasOwnProperty("index"))
        object.index = message.index;
      if (message.message != null && message.hasOwnProperty("message"))
        object.message = $root.common.MessageV2.toObject(
          message.message,
          options,
        );
      if (
        message.finish_reason != null &&
        message.hasOwnProperty("finish_reason")
      ) {
        object.finish_reason = message.finish_reason;
        if (options.oneofs) object._finish_reason = "finish_reason";
      }
      return object;
    };

    /**
     * Converts this Choice to JSON.
     * @function toJSON
     * @memberof common.Choice
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Choice.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Choice
     * @function getTypeUrl
     * @memberof common.Choice
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Choice.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Choice";
    };

    return Choice;
  })();

  common.Embedding = (function () {
    /**
     * Properties of an Embedding.
     * @memberof common
     * @interface IEmbedding
     * @property {number|null} [index] Embedding index
     * @property {Array.<number>|null} [embedding] Embedding embedding
     */

    /**
     * Constructs a new Embedding.
     * @memberof common
     * @classdesc Represents an Embedding.
     * @implements IEmbedding
     * @constructor
     * @param {common.IEmbedding=} [properties] Properties to set
     */
    function Embedding(properties) {
      this.embedding = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Embedding index.
     * @member {number} index
     * @memberof common.Embedding
     * @instance
     */
    Embedding.prototype.index = 0;

    /**
     * Embedding embedding.
     * @member {Array.<number>} embedding
     * @memberof common.Embedding
     * @instance
     */
    Embedding.prototype.embedding = $util.emptyArray;

    /**
     * Encodes the specified Embedding message. Does not implicitly {@link common.Embedding.verify|verify} messages.
     * @function encode
     * @memberof common.Embedding
     * @static
     * @param {common.Embedding} message Embedding message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Embedding.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.index != null && Object.hasOwnProperty.call(message, "index"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.index);
      if (message.embedding != null && message.embedding.length) {
        writer.uint32(/* id 2, wireType 2 =*/ 18).fork();
        for (let i = 0; i < message.embedding.length; ++i)
          writer.float(message.embedding[i]);
        writer.ldelim();
      }
      return writer;
    };

    /**
     * Decodes an Embedding message from the specified reader or buffer.
     * @function decode
     * @memberof common.Embedding
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Embedding} Embedding
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Embedding.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Embedding();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.index = reader.int32();
            break;
          }
          case 2: {
            if (!(message.embedding && message.embedding.length))
              message.embedding = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.embedding.push(reader.float());
            } else message.embedding.push(reader.float());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an Embedding message.
     * @function verify
     * @memberof common.Embedding
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Embedding.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.index != null && message.hasOwnProperty("index"))
        if (!$util.isInteger(message.index)) return "index: integer expected";
      if (message.embedding != null && message.hasOwnProperty("embedding")) {
        if (!Array.isArray(message.embedding))
          return "embedding: array expected";
        for (let i = 0; i < message.embedding.length; ++i)
          if (typeof message.embedding[i] !== "number")
            return "embedding: number[] expected";
      }
      return null;
    };

    /**
     * Creates an Embedding message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Embedding
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Embedding} Embedding
     */
    Embedding.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Embedding) return object;
      let message = new $root.common.Embedding();
      if (object.index != null) message.index = object.index | 0;
      if (object.embedding) {
        if (!Array.isArray(object.embedding))
          throw TypeError(".common.Embedding.embedding: array expected");
        message.embedding = [];
        for (let i = 0; i < object.embedding.length; ++i)
          message.embedding[i] = Number(object.embedding[i]);
      }
      return message;
    };

    /**
     * Creates a plain object from an Embedding message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Embedding
     * @static
     * @param {common.Embedding} message Embedding
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Embedding.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.embedding = [];
      if (options.defaults) object.index = 0;
      if (message.index != null && message.hasOwnProperty("index"))
        object.index = message.index;
      if (message.embedding && message.embedding.length) {
        object.embedding = [];
        for (let j = 0; j < message.embedding.length; ++j)
          object.embedding[j] =
            options.json && !isFinite(message.embedding[j])
              ? String(message.embedding[j])
              : message.embedding[j];
      }
      return object;
    };

    /**
     * Converts this Embedding to JSON.
     * @function toJSON
     * @memberof common.Embedding
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Embedding.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Embedding
     * @function getTypeUrl
     * @memberof common.Embedding
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Embedding.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Embedding";
    };

    return Embedding;
  })();

  common.Chunk = (function () {
    /**
     * Properties of a Chunk.
     * @memberof common
     * @interface IChunk
     * @property {string|null} [id] Chunk id
     * @property {string|null} [text] Chunk text
     * @property {number|null} [tokens] Chunk tokens
     */

    /**
     * Constructs a new Chunk.
     * @memberof common
     * @classdesc @deprecated
     * @implements IChunk
     * @constructor
     * @param {common.IChunk=} [properties] Properties to set
     */
    function Chunk(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Chunk id.
     * @member {string} id
     * @memberof common.Chunk
     * @instance
     */
    Chunk.prototype.id = "";

    /**
     * Chunk text.
     * @member {string} text
     * @memberof common.Chunk
     * @instance
     */
    Chunk.prototype.text = "";

    /**
     * Chunk tokens.
     * @member {number} tokens
     * @memberof common.Chunk
     * @instance
     */
    Chunk.prototype.tokens = 0;

    /**
     * Encodes the specified Chunk message. Does not implicitly {@link common.Chunk.verify|verify} messages.
     * @function encode
     * @memberof common.Chunk
     * @static
     * @param {common.Chunk} message Chunk message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Chunk.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.id);
      if (message.text != null && Object.hasOwnProperty.call(message, "text"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.text);
      if (
        message.tokens != null &&
        Object.hasOwnProperty.call(message, "tokens")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.tokens);
      return writer;
    };

    /**
     * Decodes a Chunk message from the specified reader or buffer.
     * @function decode
     * @memberof common.Chunk
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Chunk} Chunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Chunk.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Chunk();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.string();
            break;
          }
          case 2: {
            message.text = reader.string();
            break;
          }
          case 3: {
            message.tokens = reader.int32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Chunk message.
     * @function verify
     * @memberof common.Chunk
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Chunk.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isString(message.id)) return "id: string expected";
      if (message.text != null && message.hasOwnProperty("text"))
        if (!$util.isString(message.text)) return "text: string expected";
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        if (!$util.isInteger(message.tokens)) return "tokens: integer expected";
      return null;
    };

    /**
     * Creates a Chunk message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Chunk
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Chunk} Chunk
     */
    Chunk.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Chunk) return object;
      let message = new $root.common.Chunk();
      if (object.id != null) message.id = String(object.id);
      if (object.text != null) message.text = String(object.text);
      if (object.tokens != null) message.tokens = object.tokens | 0;
      return message;
    };

    /**
     * Creates a plain object from a Chunk message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Chunk
     * @static
     * @param {common.Chunk} message Chunk
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Chunk.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = "";
        object.text = "";
        object.tokens = 0;
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = message.id;
      if (message.text != null && message.hasOwnProperty("text"))
        object.text = message.text;
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        object.tokens = message.tokens;
      return object;
    };

    /**
     * Converts this Chunk to JSON.
     * @function toJSON
     * @memberof common.Chunk
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Chunk.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Chunk
     * @function getTypeUrl
     * @memberof common.Chunk
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Chunk.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Chunk";
    };

    return Chunk;
  })();

  common.Similarity = (function () {
    /**
     * Properties of a Similarity.
     * @memberof common
     * @interface ISimilarity
     * @property {string|null} [id] Similarity id
     * @property {number|null} [score] Similarity score
     * @property {number|null} [tokens] Similarity tokens
     * @property {string|null} [text] Similarity text
     */

    /**
     * Constructs a new Similarity.
     * @memberof common
     * @classdesc @deprecated
     * @implements ISimilarity
     * @constructor
     * @param {common.ISimilarity=} [properties] Properties to set
     */
    function Similarity(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Similarity id.
     * @member {string} id
     * @memberof common.Similarity
     * @instance
     */
    Similarity.prototype.id = "";

    /**
     * Similarity score.
     * @member {number} score
     * @memberof common.Similarity
     * @instance
     */
    Similarity.prototype.score = 0;

    /**
     * Similarity tokens.
     * @member {number} tokens
     * @memberof common.Similarity
     * @instance
     */
    Similarity.prototype.tokens = 0;

    /**
     * Similarity text.
     * @member {string} text
     * @memberof common.Similarity
     * @instance
     */
    Similarity.prototype.text = "";

    /**
     * Encodes the specified Similarity message. Does not implicitly {@link common.Similarity.verify|verify} messages.
     * @function encode
     * @memberof common.Similarity
     * @static
     * @param {common.Similarity} message Similarity message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Similarity.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.id);
      if (message.score != null && Object.hasOwnProperty.call(message, "score"))
        writer.uint32(/* id 2, wireType 1 =*/ 17).double(message.score);
      if (
        message.tokens != null &&
        Object.hasOwnProperty.call(message, "tokens")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.tokens);
      if (message.text != null && Object.hasOwnProperty.call(message, "text"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.text);
      return writer;
    };

    /**
     * Decodes a Similarity message from the specified reader or buffer.
     * @function decode
     * @memberof common.Similarity
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Similarity} Similarity
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Similarity.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Similarity();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.string();
            break;
          }
          case 2: {
            message.score = reader.double();
            break;
          }
          case 3: {
            message.tokens = reader.int32();
            break;
          }
          case 4: {
            message.text = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Similarity message.
     * @function verify
     * @memberof common.Similarity
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Similarity.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isString(message.id)) return "id: string expected";
      if (message.score != null && message.hasOwnProperty("score"))
        if (typeof message.score !== "number") return "score: number expected";
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        if (!$util.isInteger(message.tokens)) return "tokens: integer expected";
      if (message.text != null && message.hasOwnProperty("text"))
        if (!$util.isString(message.text)) return "text: string expected";
      return null;
    };

    /**
     * Creates a Similarity message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Similarity
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Similarity} Similarity
     */
    Similarity.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Similarity) return object;
      let message = new $root.common.Similarity();
      if (object.id != null) message.id = String(object.id);
      if (object.score != null) message.score = Number(object.score);
      if (object.tokens != null) message.tokens = object.tokens | 0;
      if (object.text != null) message.text = String(object.text);
      return message;
    };

    /**
     * Creates a plain object from a Similarity message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Similarity
     * @static
     * @param {common.Similarity} message Similarity
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Similarity.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = "";
        object.score = 0;
        object.tokens = 0;
        object.text = "";
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = message.id;
      if (message.score != null && message.hasOwnProperty("score"))
        object.score =
          options.json && !isFinite(message.score)
            ? String(message.score)
            : message.score;
      if (message.tokens != null && message.hasOwnProperty("tokens"))
        object.tokens = message.tokens;
      if (message.text != null && message.hasOwnProperty("text"))
        object.text = message.text;
      return object;
    };

    /**
     * Converts this Similarity to JSON.
     * @function toJSON
     * @memberof common.Similarity
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Similarity.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Similarity
     * @function getTypeUrl
     * @memberof common.Similarity
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Similarity.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Similarity";
    };

    return Similarity;
  })();

  common.Prompt = (function () {
    /**
     * Properties of a Prompt.
     * @memberof common
     * @interface IPrompt
     * @property {Array.<string>|null} [system_instructions] Prompt system_instructions
     * @property {Array.<common.Similarity>|null} [previous_similarities] Prompt previous_similarities
     * @property {Array.<common.Similarity>|null} [current_similarities] Prompt current_similarities
     * @property {Array.<common.Message>|null} [messages] Prompt messages
     */

    /**
     * Constructs a new Prompt.
     * @memberof common
     * @classdesc @deprecated
     * @implements IPrompt
     * @constructor
     * @param {common.IPrompt=} [properties] Properties to set
     */
    function Prompt(properties) {
      this.system_instructions = [];
      this.previous_similarities = [];
      this.current_similarities = [];
      this.messages = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Prompt system_instructions.
     * @member {Array.<string>} system_instructions
     * @memberof common.Prompt
     * @instance
     */
    Prompt.prototype.system_instructions = $util.emptyArray;

    /**
     * Prompt previous_similarities.
     * @member {Array.<common.Similarity>} previous_similarities
     * @memberof common.Prompt
     * @instance
     */
    Prompt.prototype.previous_similarities = $util.emptyArray;

    /**
     * Prompt current_similarities.
     * @member {Array.<common.Similarity>} current_similarities
     * @memberof common.Prompt
     * @instance
     */
    Prompt.prototype.current_similarities = $util.emptyArray;

    /**
     * Prompt messages.
     * @member {Array.<common.Message>} messages
     * @memberof common.Prompt
     * @instance
     */
    Prompt.prototype.messages = $util.emptyArray;

    /**
     * Encodes the specified Prompt message. Does not implicitly {@link common.Prompt.verify|verify} messages.
     * @function encode
     * @memberof common.Prompt
     * @static
     * @param {common.Prompt} message Prompt message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Prompt.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.system_instructions != null &&
        message.system_instructions.length
      )
        for (let i = 0; i < message.system_instructions.length; ++i)
          writer
            .uint32(/* id 1, wireType 2 =*/ 10)
            .string(message.system_instructions[i]);
      if (
        message.previous_similarities != null &&
        message.previous_similarities.length
      )
        for (let i = 0; i < message.previous_similarities.length; ++i)
          $root.common.Similarity.encode(
            message.previous_similarities[i],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          ).ldelim();
      if (
        message.current_similarities != null &&
        message.current_similarities.length
      )
        for (let i = 0; i < message.current_similarities.length; ++i)
          $root.common.Similarity.encode(
            message.current_similarities[i],
            writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
          ).ldelim();
      if (message.messages != null && message.messages.length)
        for (let i = 0; i < message.messages.length; ++i)
          $root.common.Message.encode(
            message.messages[i],
            writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Decodes a Prompt message from the specified reader or buffer.
     * @function decode
     * @memberof common.Prompt
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Prompt} Prompt
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Prompt.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Prompt();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (
              !(
                message.system_instructions &&
                message.system_instructions.length
              )
            )
              message.system_instructions = [];
            message.system_instructions.push(reader.string());
            break;
          }
          case 2: {
            if (
              !(
                message.previous_similarities &&
                message.previous_similarities.length
              )
            )
              message.previous_similarities = [];
            message.previous_similarities.push(
              $root.common.Similarity.decode(reader, reader.uint32()),
            );
            break;
          }
          case 3: {
            if (
              !(
                message.current_similarities &&
                message.current_similarities.length
              )
            )
              message.current_similarities = [];
            message.current_similarities.push(
              $root.common.Similarity.decode(reader, reader.uint32()),
            );
            break;
          }
          case 4: {
            if (!(message.messages && message.messages.length))
              message.messages = [];
            message.messages.push(
              $root.common.Message.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Prompt message.
     * @function verify
     * @memberof common.Prompt
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Prompt.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (
        message.system_instructions != null &&
        message.hasOwnProperty("system_instructions")
      ) {
        if (!Array.isArray(message.system_instructions))
          return "system_instructions: array expected";
        for (let i = 0; i < message.system_instructions.length; ++i)
          if (!$util.isString(message.system_instructions[i]))
            return "system_instructions: string[] expected";
      }
      if (
        message.previous_similarities != null &&
        message.hasOwnProperty("previous_similarities")
      ) {
        if (!Array.isArray(message.previous_similarities))
          return "previous_similarities: array expected";
        for (let i = 0; i < message.previous_similarities.length; ++i) {
          let error = $root.common.Similarity.verify(
            message.previous_similarities[i],
          );
          if (error) return "previous_similarities." + error;
        }
      }
      if (
        message.current_similarities != null &&
        message.hasOwnProperty("current_similarities")
      ) {
        if (!Array.isArray(message.current_similarities))
          return "current_similarities: array expected";
        for (let i = 0; i < message.current_similarities.length; ++i) {
          let error = $root.common.Similarity.verify(
            message.current_similarities[i],
          );
          if (error) return "current_similarities." + error;
        }
      }
      if (message.messages != null && message.hasOwnProperty("messages")) {
        if (!Array.isArray(message.messages)) return "messages: array expected";
        for (let i = 0; i < message.messages.length; ++i) {
          let error = $root.common.Message.verify(message.messages[i]);
          if (error) return "messages." + error;
        }
      }
      return null;
    };

    /**
     * Creates a Prompt message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Prompt
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Prompt} Prompt
     */
    Prompt.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Prompt) return object;
      let message = new $root.common.Prompt();
      if (object.system_instructions) {
        if (!Array.isArray(object.system_instructions))
          throw TypeError(".common.Prompt.system_instructions: array expected");
        message.system_instructions = [];
        for (let i = 0; i < object.system_instructions.length; ++i)
          message.system_instructions[i] = String(
            object.system_instructions[i],
          );
      }
      if (object.previous_similarities) {
        if (!Array.isArray(object.previous_similarities))
          throw TypeError(
            ".common.Prompt.previous_similarities: array expected",
          );
        message.previous_similarities = [];
        for (let i = 0; i < object.previous_similarities.length; ++i) {
          if (typeof object.previous_similarities[i] !== "object")
            throw TypeError(
              ".common.Prompt.previous_similarities: object expected",
            );
          message.previous_similarities[i] = $root.common.Similarity.fromObject(
            object.previous_similarities[i],
          );
        }
      }
      if (object.current_similarities) {
        if (!Array.isArray(object.current_similarities))
          throw TypeError(
            ".common.Prompt.current_similarities: array expected",
          );
        message.current_similarities = [];
        for (let i = 0; i < object.current_similarities.length; ++i) {
          if (typeof object.current_similarities[i] !== "object")
            throw TypeError(
              ".common.Prompt.current_similarities: object expected",
            );
          message.current_similarities[i] = $root.common.Similarity.fromObject(
            object.current_similarities[i],
          );
        }
      }
      if (object.messages) {
        if (!Array.isArray(object.messages))
          throw TypeError(".common.Prompt.messages: array expected");
        message.messages = [];
        for (let i = 0; i < object.messages.length; ++i) {
          if (typeof object.messages[i] !== "object")
            throw TypeError(".common.Prompt.messages: object expected");
          message.messages[i] = $root.common.Message.fromObject(
            object.messages[i],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a Prompt message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Prompt
     * @static
     * @param {common.Prompt} message Prompt
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Prompt.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.system_instructions = [];
        object.previous_similarities = [];
        object.current_similarities = [];
        object.messages = [];
      }
      if (message.system_instructions && message.system_instructions.length) {
        object.system_instructions = [];
        for (let j = 0; j < message.system_instructions.length; ++j)
          object.system_instructions[j] = message.system_instructions[j];
      }
      if (
        message.previous_similarities &&
        message.previous_similarities.length
      ) {
        object.previous_similarities = [];
        for (let j = 0; j < message.previous_similarities.length; ++j)
          object.previous_similarities[j] = $root.common.Similarity.toObject(
            message.previous_similarities[j],
            options,
          );
      }
      if (message.current_similarities && message.current_similarities.length) {
        object.current_similarities = [];
        for (let j = 0; j < message.current_similarities.length; ++j)
          object.current_similarities[j] = $root.common.Similarity.toObject(
            message.current_similarities[j],
            options,
          );
      }
      if (message.messages && message.messages.length) {
        object.messages = [];
        for (let j = 0; j < message.messages.length; ++j)
          object.messages[j] = $root.common.Message.toObject(
            message.messages[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this Prompt to JSON.
     * @function toJSON
     * @memberof common.Prompt
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Prompt.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Prompt
     * @function getTypeUrl
     * @memberof common.Prompt
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Prompt.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Prompt";
    };

    return Prompt;
  })();

  common.Conversation = (function () {
    /**
     * Properties of a Conversation.
     * @memberof common
     * @interface IConversation
     * @property {resource.Identifier|null} [id] Conversation id
     */

    /**
     * Constructs a new Conversation.
     * @memberof common
     * @classdesc Represents a Conversation.
     * @implements IConversation
     * @constructor
     * @param {common.IConversation=} [properties] Properties to set
     */
    function Conversation(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Conversation id.
     * @member {resource.Identifier|null|undefined} id
     * @memberof common.Conversation
     * @instance
     */
    Conversation.prototype.id = null;

    /**
     * Encodes the specified Conversation message. Does not implicitly {@link common.Conversation.verify|verify} messages.
     * @function encode
     * @memberof common.Conversation
     * @static
     * @param {common.Conversation} message Conversation message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Conversation.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        $root.resource.Identifier.encode(
          message.id,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Decodes a Conversation message from the specified reader or buffer.
     * @function decode
     * @memberof common.Conversation
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Conversation} Conversation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Conversation.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Conversation();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = $root.resource.Identifier.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Conversation message.
     * @function verify
     * @memberof common.Conversation
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Conversation.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id")) {
        let error = $root.resource.Identifier.verify(message.id);
        if (error) return "id." + error;
      }
      return null;
    };

    /**
     * Creates a Conversation message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Conversation
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Conversation} Conversation
     */
    Conversation.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Conversation) return object;
      let message = new $root.common.Conversation();
      if (object.id != null) {
        if (typeof object.id !== "object")
          throw TypeError(".common.Conversation.id: object expected");
        message.id = $root.resource.Identifier.fromObject(object.id);
      }
      return message;
    };

    /**
     * Creates a plain object from a Conversation message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Conversation
     * @static
     * @param {common.Conversation} message Conversation
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Conversation.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.id = null;
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = $root.resource.Identifier.toObject(message.id, options);
      return object;
    };

    /**
     * Converts this Conversation to JSON.
     * @function toJSON
     * @memberof common.Conversation
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Conversation.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Conversation
     * @function getTypeUrl
     * @memberof common.Conversation
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Conversation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Conversation";
    };

    return Conversation;
  })();

  common.ToolProp = (function () {
    /**
     * Properties of a ToolProp.
     * @memberof common
     * @interface IToolProp
     * @property {string|null} [type] ToolProp type
     * @property {string|null} [description] ToolProp description
     */

    /**
     * Constructs a new ToolProp.
     * @memberof common
     * @classdesc Represents a ToolProp.
     * @implements IToolProp
     * @constructor
     * @param {common.IToolProp=} [properties] Properties to set
     */
    function ToolProp(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ToolProp type.
     * @member {string} type
     * @memberof common.ToolProp
     * @instance
     */
    ToolProp.prototype.type = "";

    /**
     * ToolProp description.
     * @member {string} description
     * @memberof common.ToolProp
     * @instance
     */
    ToolProp.prototype.description = "";

    /**
     * Encodes the specified ToolProp message. Does not implicitly {@link common.ToolProp.verify|verify} messages.
     * @function encode
     * @memberof common.ToolProp
     * @static
     * @param {common.ToolProp} message ToolProp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ToolProp.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.type);
      if (
        message.description != null &&
        Object.hasOwnProperty.call(message, "description")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.description);
      return writer;
    };

    /**
     * Decodes a ToolProp message from the specified reader or buffer.
     * @function decode
     * @memberof common.ToolProp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.ToolProp} ToolProp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ToolProp.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.ToolProp();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.type = reader.string();
            break;
          }
          case 2: {
            message.description = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a ToolProp message.
     * @function verify
     * @memberof common.ToolProp
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ToolProp.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isString(message.type)) return "type: string expected";
      if (message.description != null && message.hasOwnProperty("description"))
        if (!$util.isString(message.description))
          return "description: string expected";
      return null;
    };

    /**
     * Creates a ToolProp message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.ToolProp
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.ToolProp} ToolProp
     */
    ToolProp.fromObject = function fromObject(object) {
      if (object instanceof $root.common.ToolProp) return object;
      let message = new $root.common.ToolProp();
      if (object.type != null) message.type = String(object.type);
      if (object.description != null)
        message.description = String(object.description);
      return message;
    };

    /**
     * Creates a plain object from a ToolProp message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.ToolProp
     * @static
     * @param {common.ToolProp} message ToolProp
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ToolProp.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.type = "";
        object.description = "";
      }
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = message.type;
      if (message.description != null && message.hasOwnProperty("description"))
        object.description = message.description;
      return object;
    };

    /**
     * Converts this ToolProp to JSON.
     * @function toJSON
     * @memberof common.ToolProp
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ToolProp.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ToolProp
     * @function getTypeUrl
     * @memberof common.ToolProp
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ToolProp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.ToolProp";
    };

    return ToolProp;
  })();

  common.ToolParam = (function () {
    /**
     * Properties of a ToolParam.
     * @memberof common
     * @interface IToolParam
     * @property {string|null} [type] ToolParam type
     * @property {Object.<string,common.ToolProp>|null} [properties] ToolParam properties
     * @property {Array.<string>|null} [required] ToolParam required
     */

    /**
     * Constructs a new ToolParam.
     * @memberof common
     * @classdesc Represents a ToolParam.
     * @implements IToolParam
     * @constructor
     * @param {common.IToolParam=} [properties] Properties to set
     */
    function ToolParam(properties) {
      this.properties = {};
      this.required = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ToolParam type.
     * @member {string} type
     * @memberof common.ToolParam
     * @instance
     */
    ToolParam.prototype.type = "";

    /**
     * ToolParam properties.
     * @member {Object.<string,common.ToolProp>} properties
     * @memberof common.ToolParam
     * @instance
     */
    ToolParam.prototype.properties = $util.emptyObject;

    /**
     * ToolParam required.
     * @member {Array.<string>} required
     * @memberof common.ToolParam
     * @instance
     */
    ToolParam.prototype.required = $util.emptyArray;

    /**
     * Encodes the specified ToolParam message. Does not implicitly {@link common.ToolParam.verify|verify} messages.
     * @function encode
     * @memberof common.ToolParam
     * @static
     * @param {common.ToolParam} message ToolParam message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ToolParam.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.type);
      if (
        message.properties != null &&
        Object.hasOwnProperty.call(message, "properties")
      )
        for (
          let keys = Object.keys(message.properties), i = 0;
          i < keys.length;
          ++i
        ) {
          writer
            .uint32(/* id 2, wireType 2 =*/ 18)
            .fork()
            .uint32(/* id 1, wireType 2 =*/ 10)
            .string(keys[i]);
          $root.common.ToolProp.encode(
            message.properties[keys[i]],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          )
            .ldelim()
            .ldelim();
        }
      if (message.required != null && message.required.length)
        for (let i = 0; i < message.required.length; ++i)
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.required[i]);
      return writer;
    };

    /**
     * Decodes a ToolParam message from the specified reader or buffer.
     * @function decode
     * @memberof common.ToolParam
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.ToolParam} ToolParam
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ToolParam.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.ToolParam(),
        key,
        value;
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.type = reader.string();
            break;
          }
          case 2: {
            if (message.properties === $util.emptyObject)
              message.properties = {};
            let end2 = reader.uint32() + reader.pos;
            key = "";
            value = null;
            while (reader.pos < end2) {
              let tag2 = reader.uint32();
              switch (tag2 >>> 3) {
                case 1:
                  key = reader.string();
                  break;
                case 2:
                  value = $root.common.ToolProp.decode(reader, reader.uint32());
                  break;
                default:
                  reader.skipType(tag2 & 7);
                  break;
              }
            }
            message.properties[key] = value;
            break;
          }
          case 3: {
            if (!(message.required && message.required.length))
              message.required = [];
            message.required.push(reader.string());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a ToolParam message.
     * @function verify
     * @memberof common.ToolParam
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ToolParam.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isString(message.type)) return "type: string expected";
      if (message.properties != null && message.hasOwnProperty("properties")) {
        if (!$util.isObject(message.properties))
          return "properties: object expected";
        let key = Object.keys(message.properties);
        for (let i = 0; i < key.length; ++i) {
          let error = $root.common.ToolProp.verify(message.properties[key[i]]);
          if (error) return "properties." + error;
        }
      }
      if (message.required != null && message.hasOwnProperty("required")) {
        if (!Array.isArray(message.required)) return "required: array expected";
        for (let i = 0; i < message.required.length; ++i)
          if (!$util.isString(message.required[i]))
            return "required: string[] expected";
      }
      return null;
    };

    /**
     * Creates a ToolParam message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.ToolParam
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.ToolParam} ToolParam
     */
    ToolParam.fromObject = function fromObject(object) {
      if (object instanceof $root.common.ToolParam) return object;
      let message = new $root.common.ToolParam();
      if (object.type != null) message.type = String(object.type);
      if (object.properties) {
        if (typeof object.properties !== "object")
          throw TypeError(".common.ToolParam.properties: object expected");
        message.properties = {};
        for (
          let keys = Object.keys(object.properties), i = 0;
          i < keys.length;
          ++i
        ) {
          if (typeof object.properties[keys[i]] !== "object")
            throw TypeError(".common.ToolParam.properties: object expected");
          message.properties[keys[i]] = $root.common.ToolProp.fromObject(
            object.properties[keys[i]],
          );
        }
      }
      if (object.required) {
        if (!Array.isArray(object.required))
          throw TypeError(".common.ToolParam.required: array expected");
        message.required = [];
        for (let i = 0; i < object.required.length; ++i)
          message.required[i] = String(object.required[i]);
      }
      return message;
    };

    /**
     * Creates a plain object from a ToolParam message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.ToolParam
     * @static
     * @param {common.ToolParam} message ToolParam
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ToolParam.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.required = [];
      if (options.objects || options.defaults) object.properties = {};
      if (options.defaults) object.type = "";
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = message.type;
      let keys2;
      if (
        message.properties &&
        (keys2 = Object.keys(message.properties)).length
      ) {
        object.properties = {};
        for (let j = 0; j < keys2.length; ++j)
          object.properties[keys2[j]] = $root.common.ToolProp.toObject(
            message.properties[keys2[j]],
            options,
          );
      }
      if (message.required && message.required.length) {
        object.required = [];
        for (let j = 0; j < message.required.length; ++j)
          object.required[j] = message.required[j];
      }
      return object;
    };

    /**
     * Converts this ToolParam to JSON.
     * @function toJSON
     * @memberof common.ToolParam
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ToolParam.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ToolParam
     * @function getTypeUrl
     * @memberof common.ToolParam
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ToolParam.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.ToolParam";
    };

    return ToolParam;
  })();

  common.ToolFunction = (function () {
    /**
     * Properties of a ToolFunction.
     * @memberof common
     * @interface IToolFunction
     * @property {resource.Descriptor|null} [descriptor] ToolFunction descriptor
     * @property {common.ToolParam|null} [parameters] ToolFunction parameters
     * @property {string|null} ["arguments"] ToolFunction arguments
     */

    /**
     * Constructs a new ToolFunction.
     * @memberof common
     * @classdesc Represents a ToolFunction.
     * @implements IToolFunction
     * @constructor
     * @param {common.IToolFunction=} [properties] Properties to set
     */
    function ToolFunction(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ToolFunction descriptor.
     * @member {resource.Descriptor|null|undefined} descriptor
     * @memberof common.ToolFunction
     * @instance
     */
    ToolFunction.prototype.descriptor = null;

    /**
     * ToolFunction parameters.
     * @member {common.ToolParam|null|undefined} parameters
     * @memberof common.ToolFunction
     * @instance
     */
    ToolFunction.prototype.parameters = null;

    /**
     * ToolFunction arguments.
     * @member {string|null|undefined} arguments
     * @memberof common.ToolFunction
     * @instance
     */
    ToolFunction.prototype["arguments"] = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * ToolFunction call.
     * @member {"parameters"|"arguments"|undefined} call
     * @memberof common.ToolFunction
     * @instance
     */
    Object.defineProperty(ToolFunction.prototype, "call", {
      get: $util.oneOfGetter(($oneOfFields = ["parameters", "arguments"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified ToolFunction message. Does not implicitly {@link common.ToolFunction.verify|verify} messages.
     * @function encode
     * @memberof common.ToolFunction
     * @static
     * @param {common.ToolFunction} message ToolFunction message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ToolFunction.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.descriptor != null &&
        Object.hasOwnProperty.call(message, "descriptor")
      )
        $root.resource.Descriptor.encode(
          message.descriptor,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (
        message.parameters != null &&
        Object.hasOwnProperty.call(message, "parameters")
      )
        $root.common.ToolParam.encode(
          message.parameters,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (
        message["arguments"] != null &&
        Object.hasOwnProperty.call(message, "arguments")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message["arguments"]);
      return writer;
    };

    /**
     * Decodes a ToolFunction message from the specified reader or buffer.
     * @function decode
     * @memberof common.ToolFunction
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.ToolFunction} ToolFunction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ToolFunction.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.ToolFunction();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.descriptor = $root.resource.Descriptor.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 2: {
            message.parameters = $root.common.ToolParam.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 3: {
            message["arguments"] = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a ToolFunction message.
     * @function verify
     * @memberof common.ToolFunction
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ToolFunction.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.descriptor != null && message.hasOwnProperty("descriptor")) {
        let error = $root.resource.Descriptor.verify(message.descriptor);
        if (error) return "descriptor." + error;
      }
      if (message.parameters != null && message.hasOwnProperty("parameters")) {
        properties.call = 1;
        {
          let error = $root.common.ToolParam.verify(message.parameters);
          if (error) return "parameters." + error;
        }
      }
      if (message["arguments"] != null && message.hasOwnProperty("arguments")) {
        if (properties.call === 1) return "call: multiple values";
        properties.call = 1;
        if (!$util.isString(message["arguments"]))
          return "arguments: string expected";
      }
      return null;
    };

    /**
     * Creates a ToolFunction message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.ToolFunction
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.ToolFunction} ToolFunction
     */
    ToolFunction.fromObject = function fromObject(object) {
      if (object instanceof $root.common.ToolFunction) return object;
      let message = new $root.common.ToolFunction();
      if (object.descriptor != null) {
        if (typeof object.descriptor !== "object")
          throw TypeError(".common.ToolFunction.descriptor: object expected");
        message.descriptor = $root.resource.Descriptor.fromObject(
          object.descriptor,
        );
      }
      if (object.parameters != null) {
        if (typeof object.parameters !== "object")
          throw TypeError(".common.ToolFunction.parameters: object expected");
        message.parameters = $root.common.ToolParam.fromObject(
          object.parameters,
        );
      }
      if (object["arguments"] != null)
        message["arguments"] = String(object["arguments"]);
      return message;
    };

    /**
     * Creates a plain object from a ToolFunction message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.ToolFunction
     * @static
     * @param {common.ToolFunction} message ToolFunction
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ToolFunction.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.descriptor = null;
      if (message.descriptor != null && message.hasOwnProperty("descriptor"))
        object.descriptor = $root.resource.Descriptor.toObject(
          message.descriptor,
          options,
        );
      if (message.parameters != null && message.hasOwnProperty("parameters")) {
        object.parameters = $root.common.ToolParam.toObject(
          message.parameters,
          options,
        );
        if (options.oneofs) object.call = "parameters";
      }
      if (message["arguments"] != null && message.hasOwnProperty("arguments")) {
        object["arguments"] = message["arguments"];
        if (options.oneofs) object.call = "arguments";
      }
      return object;
    };

    /**
     * Converts this ToolFunction to JSON.
     * @function toJSON
     * @memberof common.ToolFunction
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ToolFunction.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ToolFunction
     * @function getTypeUrl
     * @memberof common.ToolFunction
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ToolFunction.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.ToolFunction";
    };

    return ToolFunction;
  })();

  common.Tool = (function () {
    /**
     * Properties of a Tool.
     * @memberof common
     * @interface ITool
     * @property {string|null} [type] Tool type
     * @property {common.ToolFunction|null} ["function"] Tool function
     * @property {string|null} [id] Tool id
     */

    /**
     * Constructs a new Tool.
     * @memberof common
     * @classdesc Represents a Tool.
     * @implements ITool
     * @constructor
     * @param {common.ITool=} [properties] Properties to set
     */
    function Tool(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Tool type.
     * @member {string} type
     * @memberof common.Tool
     * @instance
     */
    Tool.prototype.type = "";

    /**
     * Tool function.
     * @member {common.ToolFunction|null|undefined} function
     * @memberof common.Tool
     * @instance
     */
    Tool.prototype["function"] = null;

    /**
     * Tool id.
     * @member {string|null|undefined} id
     * @memberof common.Tool
     * @instance
     */
    Tool.prototype.id = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Tool _id.
     * @member {"id"|undefined} _id
     * @memberof common.Tool
     * @instance
     */
    Object.defineProperty(Tool.prototype, "_id", {
      get: $util.oneOfGetter(($oneOfFields = ["id"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified Tool message. Does not implicitly {@link common.Tool.verify|verify} messages.
     * @function encode
     * @memberof common.Tool
     * @static
     * @param {common.Tool} message Tool message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Tool.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.type);
      if (
        message["function"] != null &&
        Object.hasOwnProperty.call(message, "function")
      )
        $root.common.ToolFunction.encode(
          message["function"],
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.id);
      return writer;
    };

    /**
     * Decodes a Tool message from the specified reader or buffer.
     * @function decode
     * @memberof common.Tool
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Tool} Tool
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Tool.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Tool();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.type = reader.string();
            break;
          }
          case 2: {
            message["function"] = $root.common.ToolFunction.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 3: {
            message.id = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Tool message.
     * @function verify
     * @memberof common.Tool
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Tool.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isString(message.type)) return "type: string expected";
      if (message["function"] != null && message.hasOwnProperty("function")) {
        let error = $root.common.ToolFunction.verify(message["function"]);
        if (error) return "function." + error;
      }
      if (message.id != null && message.hasOwnProperty("id")) {
        properties._id = 1;
        if (!$util.isString(message.id)) return "id: string expected";
      }
      return null;
    };

    /**
     * Creates a Tool message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Tool
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Tool} Tool
     */
    Tool.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Tool) return object;
      let message = new $root.common.Tool();
      if (object.type != null) message.type = String(object.type);
      if (object["function"] != null) {
        if (typeof object["function"] !== "object")
          throw TypeError(".common.Tool.function: object expected");
        message["function"] = $root.common.ToolFunction.fromObject(
          object["function"],
        );
      }
      if (object.id != null) message.id = String(object.id);
      return message;
    };

    /**
     * Creates a plain object from a Tool message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Tool
     * @static
     * @param {common.Tool} message Tool
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Tool.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.type = "";
        object["function"] = null;
      }
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = message.type;
      if (message["function"] != null && message.hasOwnProperty("function"))
        object["function"] = $root.common.ToolFunction.toObject(
          message["function"],
          options,
        );
      if (message.id != null && message.hasOwnProperty("id")) {
        object.id = message.id;
        if (options.oneofs) object._id = "id";
      }
      return object;
    };

    /**
     * Converts this Tool to JSON.
     * @function toJSON
     * @memberof common.Tool
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Tool.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Tool
     * @function getTypeUrl
     * @memberof common.Tool
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Tool.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Tool";
    };

    return Tool;
  })();

  common.ToolCallRequest = (function () {
    /**
     * Properties of a ToolCallRequest.
     * @memberof common
     * @interface IToolCallRequest
     * @property {string|null} [role] ToolCallRequest role
     * @property {Array.<common.Tool>|null} [tool_calls] ToolCallRequest tool_calls
     */

    /**
     * Constructs a new ToolCallRequest.
     * @memberof common
     * @classdesc Represents a ToolCallRequest.
     * @implements IToolCallRequest
     * @constructor
     * @param {common.IToolCallRequest=} [properties] Properties to set
     */
    function ToolCallRequest(properties) {
      this.tool_calls = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ToolCallRequest role.
     * @member {string} role
     * @memberof common.ToolCallRequest
     * @instance
     */
    ToolCallRequest.prototype.role = "";

    /**
     * ToolCallRequest tool_calls.
     * @member {Array.<common.Tool>} tool_calls
     * @memberof common.ToolCallRequest
     * @instance
     */
    ToolCallRequest.prototype.tool_calls = $util.emptyArray;

    /**
     * Encodes the specified ToolCallRequest message. Does not implicitly {@link common.ToolCallRequest.verify|verify} messages.
     * @function encode
     * @memberof common.ToolCallRequest
     * @static
     * @param {common.ToolCallRequest} message ToolCallRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ToolCallRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.role != null && Object.hasOwnProperty.call(message, "role"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.role);
      if (message.tool_calls != null && message.tool_calls.length)
        for (let i = 0; i < message.tool_calls.length; ++i)
          $root.common.Tool.encode(
            message.tool_calls[i],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Decodes a ToolCallRequest message from the specified reader or buffer.
     * @function decode
     * @memberof common.ToolCallRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.ToolCallRequest} ToolCallRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ToolCallRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.ToolCallRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.role = reader.string();
            break;
          }
          case 2: {
            if (!(message.tool_calls && message.tool_calls.length))
              message.tool_calls = [];
            message.tool_calls.push(
              $root.common.Tool.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a ToolCallRequest message.
     * @function verify
     * @memberof common.ToolCallRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ToolCallRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.role != null && message.hasOwnProperty("role"))
        if (!$util.isString(message.role)) return "role: string expected";
      if (message.tool_calls != null && message.hasOwnProperty("tool_calls")) {
        if (!Array.isArray(message.tool_calls))
          return "tool_calls: array expected";
        for (let i = 0; i < message.tool_calls.length; ++i) {
          let error = $root.common.Tool.verify(message.tool_calls[i]);
          if (error) return "tool_calls." + error;
        }
      }
      return null;
    };

    /**
     * Creates a ToolCallRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.ToolCallRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.ToolCallRequest} ToolCallRequest
     */
    ToolCallRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.common.ToolCallRequest) return object;
      let message = new $root.common.ToolCallRequest();
      if (object.role != null) message.role = String(object.role);
      if (object.tool_calls) {
        if (!Array.isArray(object.tool_calls))
          throw TypeError(".common.ToolCallRequest.tool_calls: array expected");
        message.tool_calls = [];
        for (let i = 0; i < object.tool_calls.length; ++i) {
          if (typeof object.tool_calls[i] !== "object")
            throw TypeError(
              ".common.ToolCallRequest.tool_calls: object expected",
            );
          message.tool_calls[i] = $root.common.Tool.fromObject(
            object.tool_calls[i],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a ToolCallRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.ToolCallRequest
     * @static
     * @param {common.ToolCallRequest} message ToolCallRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ToolCallRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.tool_calls = [];
      if (options.defaults) object.role = "";
      if (message.role != null && message.hasOwnProperty("role"))
        object.role = message.role;
      if (message.tool_calls && message.tool_calls.length) {
        object.tool_calls = [];
        for (let j = 0; j < message.tool_calls.length; ++j)
          object.tool_calls[j] = $root.common.Tool.toObject(
            message.tool_calls[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this ToolCallRequest to JSON.
     * @function toJSON
     * @memberof common.ToolCallRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ToolCallRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ToolCallRequest
     * @function getTypeUrl
     * @memberof common.ToolCallRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ToolCallRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.ToolCallRequest";
    };

    return ToolCallRequest;
  })();

  common.ToolCallResult = (function () {
    /**
     * Properties of a ToolCallResult.
     * @memberof common
     * @interface IToolCallResult
     * @property {string|null} [role] ToolCallResult role
     * @property {string|null} [tool_call_id] ToolCallResult tool_call_id
     * @property {string|null} [content] ToolCallResult content
     */

    /**
     * Constructs a new ToolCallResult.
     * @memberof common
     * @classdesc Represents a ToolCallResult.
     * @implements IToolCallResult
     * @constructor
     * @param {common.IToolCallResult=} [properties] Properties to set
     */
    function ToolCallResult(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ToolCallResult role.
     * @member {string} role
     * @memberof common.ToolCallResult
     * @instance
     */
    ToolCallResult.prototype.role = "";

    /**
     * ToolCallResult tool_call_id.
     * @member {string} tool_call_id
     * @memberof common.ToolCallResult
     * @instance
     */
    ToolCallResult.prototype.tool_call_id = "";

    /**
     * ToolCallResult content.
     * @member {string} content
     * @memberof common.ToolCallResult
     * @instance
     */
    ToolCallResult.prototype.content = "";

    /**
     * Encodes the specified ToolCallResult message. Does not implicitly {@link common.ToolCallResult.verify|verify} messages.
     * @function encode
     * @memberof common.ToolCallResult
     * @static
     * @param {common.ToolCallResult} message ToolCallResult message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ToolCallResult.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.role != null && Object.hasOwnProperty.call(message, "role"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.role);
      if (
        message.tool_call_id != null &&
        Object.hasOwnProperty.call(message, "tool_call_id")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.tool_call_id);
      if (
        message.content != null &&
        Object.hasOwnProperty.call(message, "content")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.content);
      return writer;
    };

    /**
     * Decodes a ToolCallResult message from the specified reader or buffer.
     * @function decode
     * @memberof common.ToolCallResult
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.ToolCallResult} ToolCallResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ToolCallResult.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.ToolCallResult();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.role = reader.string();
            break;
          }
          case 2: {
            message.tool_call_id = reader.string();
            break;
          }
          case 3: {
            message.content = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a ToolCallResult message.
     * @function verify
     * @memberof common.ToolCallResult
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ToolCallResult.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.role != null && message.hasOwnProperty("role"))
        if (!$util.isString(message.role)) return "role: string expected";
      if (
        message.tool_call_id != null &&
        message.hasOwnProperty("tool_call_id")
      )
        if (!$util.isString(message.tool_call_id))
          return "tool_call_id: string expected";
      if (message.content != null && message.hasOwnProperty("content"))
        if (!$util.isString(message.content)) return "content: string expected";
      return null;
    };

    /**
     * Creates a ToolCallResult message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.ToolCallResult
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.ToolCallResult} ToolCallResult
     */
    ToolCallResult.fromObject = function fromObject(object) {
      if (object instanceof $root.common.ToolCallResult) return object;
      let message = new $root.common.ToolCallResult();
      if (object.role != null) message.role = String(object.role);
      if (object.tool_call_id != null)
        message.tool_call_id = String(object.tool_call_id);
      if (object.content != null) message.content = String(object.content);
      return message;
    };

    /**
     * Creates a plain object from a ToolCallResult message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.ToolCallResult
     * @static
     * @param {common.ToolCallResult} message ToolCallResult
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ToolCallResult.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.role = "";
        object.tool_call_id = "";
        object.content = "";
      }
      if (message.role != null && message.hasOwnProperty("role"))
        object.role = message.role;
      if (
        message.tool_call_id != null &&
        message.hasOwnProperty("tool_call_id")
      )
        object.tool_call_id = message.tool_call_id;
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = message.content;
      return object;
    };

    /**
     * Converts this ToolCallResult to JSON.
     * @function toJSON
     * @memberof common.ToolCallResult
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ToolCallResult.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ToolCallResult
     * @function getTypeUrl
     * @memberof common.ToolCallResult
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ToolCallResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.ToolCallResult";
    };

    return ToolCallResult;
  })();

  common.MessageV2 = (function () {
    /**
     * Properties of a MessageV2.
     * @memberof common
     * @interface IMessageV2
     * @property {resource.Identifier|null} [id] MessageV2 id
     * @property {resource.Descriptor|null} [descriptor] MessageV2 descriptor
     * @property {resource.Content|null} [content] MessageV2 content
     * @property {string|null} [role] MessageV2 role
     */

    /**
     * Constructs a new MessageV2.
     * @memberof common
     * @classdesc Represents a MessageV2.
     * @implements IMessageV2
     * @constructor
     * @param {common.IMessageV2=} [properties] Properties to set
     */
    function MessageV2(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * MessageV2 id.
     * @member {resource.Identifier|null|undefined} id
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.id = null;

    /**
     * MessageV2 descriptor.
     * @member {resource.Descriptor|null|undefined} descriptor
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.descriptor = null;

    /**
     * MessageV2 content.
     * @member {resource.Content|null|undefined} content
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.content = null;

    /**
     * MessageV2 role.
     * @member {string} role
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.role = "";

    /**
     * Encodes the specified MessageV2 message. Does not implicitly {@link common.MessageV2.verify|verify} messages.
     * @function encode
     * @memberof common.MessageV2
     * @static
     * @param {common.MessageV2} message MessageV2 message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MessageV2.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        $root.resource.Identifier.encode(
          message.id,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (
        message.descriptor != null &&
        Object.hasOwnProperty.call(message, "descriptor")
      )
        $root.resource.Descriptor.encode(
          message.descriptor,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (
        message.content != null &&
        Object.hasOwnProperty.call(message, "content")
      )
        $root.resource.Content.encode(
          message.content,
          writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
        ).ldelim();
      if (message.role != null && Object.hasOwnProperty.call(message, "role"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.role);
      return writer;
    };

    /**
     * Decodes a MessageV2 message from the specified reader or buffer.
     * @function decode
     * @memberof common.MessageV2
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.MessageV2} MessageV2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MessageV2.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.MessageV2();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = $root.resource.Identifier.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 2: {
            message.descriptor = $root.resource.Descriptor.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 3: {
            message.content = $root.resource.Content.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 4: {
            message.role = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a MessageV2 message.
     * @function verify
     * @memberof common.MessageV2
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MessageV2.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id")) {
        let error = $root.resource.Identifier.verify(message.id);
        if (error) return "id." + error;
      }
      if (message.descriptor != null && message.hasOwnProperty("descriptor")) {
        let error = $root.resource.Descriptor.verify(message.descriptor);
        if (error) return "descriptor." + error;
      }
      if (message.content != null && message.hasOwnProperty("content")) {
        let error = $root.resource.Content.verify(message.content);
        if (error) return "content." + error;
      }
      if (message.role != null && message.hasOwnProperty("role"))
        if (!$util.isString(message.role)) return "role: string expected";
      return null;
    };

    /**
     * Creates a MessageV2 message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.MessageV2
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.MessageV2} MessageV2
     */
    MessageV2.fromObject = function fromObject(object) {
      if (object instanceof $root.common.MessageV2) return object;
      let message = new $root.common.MessageV2();
      if (object.id != null) {
        if (typeof object.id !== "object")
          throw TypeError(".common.MessageV2.id: object expected");
        message.id = $root.resource.Identifier.fromObject(object.id);
      }
      if (object.descriptor != null) {
        if (typeof object.descriptor !== "object")
          throw TypeError(".common.MessageV2.descriptor: object expected");
        message.descriptor = $root.resource.Descriptor.fromObject(
          object.descriptor,
        );
      }
      if (object.content != null) {
        if (typeof object.content !== "object")
          throw TypeError(".common.MessageV2.content: object expected");
        message.content = $root.resource.Content.fromObject(object.content);
      }
      if (object.role != null) message.role = String(object.role);
      return message;
    };

    /**
     * Creates a plain object from a MessageV2 message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.MessageV2
     * @static
     * @param {common.MessageV2} message MessageV2
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MessageV2.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = null;
        object.descriptor = null;
        object.content = null;
        object.role = "";
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = $root.resource.Identifier.toObject(message.id, options);
      if (message.descriptor != null && message.hasOwnProperty("descriptor"))
        object.descriptor = $root.resource.Descriptor.toObject(
          message.descriptor,
          options,
        );
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = $root.resource.Content.toObject(
          message.content,
          options,
        );
      if (message.role != null && message.hasOwnProperty("role"))
        object.role = message.role;
      return object;
    };

    /**
     * Converts this MessageV2 to JSON.
     * @function toJSON
     * @memberof common.MessageV2
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MessageV2.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MessageV2
     * @function getTypeUrl
     * @memberof common.MessageV2
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MessageV2.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.MessageV2";
    };

    return MessageV2;
  })();

  common.Assistant = (function () {
    /**
     * Properties of an Assistant.
     * @memberof common
     * @interface IAssistant
     * @property {resource.Identifier|null} [id] Assistant id
     * @property {resource.Descriptor|null} [descriptor] Assistant descriptor
     * @property {resource.Content|null} [content] Assistant content
     */

    /**
     * Constructs a new Assistant.
     * @memberof common
     * @classdesc Represents an Assistant.
     * @implements IAssistant
     * @constructor
     * @param {common.IAssistant=} [properties] Properties to set
     */
    function Assistant(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Assistant id.
     * @member {resource.Identifier|null|undefined} id
     * @memberof common.Assistant
     * @instance
     */
    Assistant.prototype.id = null;

    /**
     * Assistant descriptor.
     * @member {resource.Descriptor|null|undefined} descriptor
     * @memberof common.Assistant
     * @instance
     */
    Assistant.prototype.descriptor = null;

    /**
     * Assistant content.
     * @member {resource.Content|null|undefined} content
     * @memberof common.Assistant
     * @instance
     */
    Assistant.prototype.content = null;

    /**
     * Encodes the specified Assistant message. Does not implicitly {@link common.Assistant.verify|verify} messages.
     * @function encode
     * @memberof common.Assistant
     * @static
     * @param {common.Assistant} message Assistant message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Assistant.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        $root.resource.Identifier.encode(
          message.id,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (
        message.descriptor != null &&
        Object.hasOwnProperty.call(message, "descriptor")
      )
        $root.resource.Descriptor.encode(
          message.descriptor,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (
        message.content != null &&
        Object.hasOwnProperty.call(message, "content")
      )
        $root.resource.Content.encode(
          message.content,
          writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Decodes an Assistant message from the specified reader or buffer.
     * @function decode
     * @memberof common.Assistant
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {common.Assistant} Assistant
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Assistant.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.common.Assistant();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = $root.resource.Identifier.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 2: {
            message.descriptor = $root.resource.Descriptor.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 3: {
            message.content = $root.resource.Content.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an Assistant message.
     * @function verify
     * @memberof common.Assistant
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Assistant.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id")) {
        let error = $root.resource.Identifier.verify(message.id);
        if (error) return "id." + error;
      }
      if (message.descriptor != null && message.hasOwnProperty("descriptor")) {
        let error = $root.resource.Descriptor.verify(message.descriptor);
        if (error) return "descriptor." + error;
      }
      if (message.content != null && message.hasOwnProperty("content")) {
        let error = $root.resource.Content.verify(message.content);
        if (error) return "content." + error;
      }
      return null;
    };

    /**
     * Creates an Assistant message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Assistant
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Assistant} Assistant
     */
    Assistant.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Assistant) return object;
      let message = new $root.common.Assistant();
      if (object.id != null) {
        if (typeof object.id !== "object")
          throw TypeError(".common.Assistant.id: object expected");
        message.id = $root.resource.Identifier.fromObject(object.id);
      }
      if (object.descriptor != null) {
        if (typeof object.descriptor !== "object")
          throw TypeError(".common.Assistant.descriptor: object expected");
        message.descriptor = $root.resource.Descriptor.fromObject(
          object.descriptor,
        );
      }
      if (object.content != null) {
        if (typeof object.content !== "object")
          throw TypeError(".common.Assistant.content: object expected");
        message.content = $root.resource.Content.fromObject(object.content);
      }
      return message;
    };

    /**
     * Creates a plain object from an Assistant message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Assistant
     * @static
     * @param {common.Assistant} message Assistant
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Assistant.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = null;
        object.descriptor = null;
        object.content = null;
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = $root.resource.Identifier.toObject(message.id, options);
      if (message.descriptor != null && message.hasOwnProperty("descriptor"))
        object.descriptor = $root.resource.Descriptor.toObject(
          message.descriptor,
          options,
        );
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = $root.resource.Content.toObject(
          message.content,
          options,
        );
      return object;
    };

    /**
     * Converts this Assistant to JSON.
     * @function toJSON
     * @memberof common.Assistant
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Assistant.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Assistant
     * @function getTypeUrl
     * @memberof common.Assistant
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Assistant.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Assistant";
    };

    return Assistant;
  })();

  return common;
})());

export const agent = ($root.agent = (() => {
  /**
   * Namespace agent.
   * @exports agent
   * @namespace
   */
  const agent = {};

  agent.AgentRequest = (function () {
    /**
     * Properties of an AgentRequest.
     * @memberof agent
     * @interface IAgentRequest
     * @property {Array.<common.MessageV2>|null} [messages] AgentRequest messages
     * @property {string|null} [conversation_id] AgentRequest conversation_id
     * @property {string|null} [github_token] AgentRequest github_token
     */

    /**
     * Constructs a new AgentRequest.
     * @memberof agent
     * @classdesc Represents an AgentRequest.
     * @implements IAgentRequest
     * @constructor
     * @param {agent.IAgentRequest=} [properties] Properties to set
     */
    function AgentRequest(properties) {
      this.messages = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * AgentRequest messages.
     * @member {Array.<common.MessageV2>} messages
     * @memberof agent.AgentRequest
     * @instance
     */
    AgentRequest.prototype.messages = $util.emptyArray;

    /**
     * AgentRequest conversation_id.
     * @member {string|null|undefined} conversation_id
     * @memberof agent.AgentRequest
     * @instance
     */
    AgentRequest.prototype.conversation_id = null;

    /**
     * AgentRequest github_token.
     * @member {string|null|undefined} github_token
     * @memberof agent.AgentRequest
     * @instance
     */
    AgentRequest.prototype.github_token = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * AgentRequest _conversation_id.
     * @member {"conversation_id"|undefined} _conversation_id
     * @memberof agent.AgentRequest
     * @instance
     */
    Object.defineProperty(AgentRequest.prototype, "_conversation_id", {
      get: $util.oneOfGetter(($oneOfFields = ["conversation_id"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * AgentRequest _github_token.
     * @member {"github_token"|undefined} _github_token
     * @memberof agent.AgentRequest
     * @instance
     */
    Object.defineProperty(AgentRequest.prototype, "_github_token", {
      get: $util.oneOfGetter(($oneOfFields = ["github_token"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified AgentRequest message. Does not implicitly {@link agent.AgentRequest.verify|verify} messages.
     * @function encode
     * @memberof agent.AgentRequest
     * @static
     * @param {agent.AgentRequest} message AgentRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AgentRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.messages != null && message.messages.length)
        for (let i = 0; i < message.messages.length; ++i)
          $root.common.MessageV2.encode(
            message.messages[i],
            writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
          ).ldelim();
      if (
        message.conversation_id != null &&
        Object.hasOwnProperty.call(message, "conversation_id")
      )
        writer
          .uint32(/* id 2, wireType 2 =*/ 18)
          .string(message.conversation_id);
      if (
        message.github_token != null &&
        Object.hasOwnProperty.call(message, "github_token")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.github_token);
      return writer;
    };

    /**
     * Decodes an AgentRequest message from the specified reader or buffer.
     * @function decode
     * @memberof agent.AgentRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {agent.AgentRequest} AgentRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AgentRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.agent.AgentRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.messages && message.messages.length))
              message.messages = [];
            message.messages.push(
              $root.common.MessageV2.decode(reader, reader.uint32()),
            );
            break;
          }
          case 2: {
            message.conversation_id = reader.string();
            break;
          }
          case 3: {
            message.github_token = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an AgentRequest message.
     * @function verify
     * @memberof agent.AgentRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AgentRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.messages != null && message.hasOwnProperty("messages")) {
        if (!Array.isArray(message.messages)) return "messages: array expected";
        for (let i = 0; i < message.messages.length; ++i) {
          let error = $root.common.MessageV2.verify(message.messages[i]);
          if (error) return "messages." + error;
        }
      }
      if (
        message.conversation_id != null &&
        message.hasOwnProperty("conversation_id")
      ) {
        properties._conversation_id = 1;
        if (!$util.isString(message.conversation_id))
          return "conversation_id: string expected";
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      ) {
        properties._github_token = 1;
        if (!$util.isString(message.github_token))
          return "github_token: string expected";
      }
      return null;
    };

    /**
     * Creates an AgentRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof agent.AgentRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {agent.AgentRequest} AgentRequest
     */
    AgentRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.agent.AgentRequest) return object;
      let message = new $root.agent.AgentRequest();
      if (object.messages) {
        if (!Array.isArray(object.messages))
          throw TypeError(".agent.AgentRequest.messages: array expected");
        message.messages = [];
        for (let i = 0; i < object.messages.length; ++i) {
          if (typeof object.messages[i] !== "object")
            throw TypeError(".agent.AgentRequest.messages: object expected");
          message.messages[i] = $root.common.MessageV2.fromObject(
            object.messages[i],
          );
        }
      }
      if (object.conversation_id != null)
        message.conversation_id = String(object.conversation_id);
      if (object.github_token != null)
        message.github_token = String(object.github_token);
      return message;
    };

    /**
     * Creates a plain object from an AgentRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof agent.AgentRequest
     * @static
     * @param {agent.AgentRequest} message AgentRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AgentRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.messages = [];
      if (message.messages && message.messages.length) {
        object.messages = [];
        for (let j = 0; j < message.messages.length; ++j)
          object.messages[j] = $root.common.MessageV2.toObject(
            message.messages[j],
            options,
          );
      }
      if (
        message.conversation_id != null &&
        message.hasOwnProperty("conversation_id")
      ) {
        object.conversation_id = message.conversation_id;
        if (options.oneofs) object._conversation_id = "conversation_id";
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      ) {
        object.github_token = message.github_token;
        if (options.oneofs) object._github_token = "github_token";
      }
      return object;
    };

    /**
     * Converts this AgentRequest to JSON.
     * @function toJSON
     * @memberof agent.AgentRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AgentRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for AgentRequest
     * @function getTypeUrl
     * @memberof agent.AgentRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    AgentRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/agent.AgentRequest";
    };

    return AgentRequest;
  })();

  agent.AgentResponse = (function () {
    /**
     * Properties of an AgentResponse.
     * @memberof agent
     * @interface IAgentResponse
     * @property {string|null} [id] AgentResponse id
     * @property {string|null} [object] AgentResponse object
     * @property {number|Long|null} [created] AgentResponse created
     * @property {string|null} [model] AgentResponse model
     * @property {Array.<common.Choice>|null} [choices] AgentResponse choices
     * @property {common.Usage|null} [usage] AgentResponse usage
     * @property {string|null} [conversation_id] AgentResponse conversation_id
     */

    /**
     * Constructs a new AgentResponse.
     * @memberof agent
     * @classdesc Represents an AgentResponse.
     * @implements IAgentResponse
     * @constructor
     * @param {agent.IAgentResponse=} [properties] Properties to set
     */
    function AgentResponse(properties) {
      this.choices = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * AgentResponse id.
     * @member {string} id
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.id = "";

    /**
     * AgentResponse object.
     * @member {string} object
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.object = "";

    /**
     * AgentResponse created.
     * @member {number|Long} created
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.created = $util.Long
      ? $util.Long.fromBits(0, 0, false)
      : 0;

    /**
     * AgentResponse model.
     * @member {string} model
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.model = "";

    /**
     * AgentResponse choices.
     * @member {Array.<common.Choice>} choices
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.choices = $util.emptyArray;

    /**
     * AgentResponse usage.
     * @member {common.Usage|null|undefined} usage
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.usage = null;

    /**
     * AgentResponse conversation_id.
     * @member {string} conversation_id
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.conversation_id = "";

    /**
     * Encodes the specified AgentResponse message. Does not implicitly {@link agent.AgentResponse.verify|verify} messages.
     * @function encode
     * @memberof agent.AgentResponse
     * @static
     * @param {agent.AgentResponse} message AgentResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AgentResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.id);
      if (
        message.object != null &&
        Object.hasOwnProperty.call(message, "object")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.object);
      if (
        message.created != null &&
        Object.hasOwnProperty.call(message, "created")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int64(message.created);
      if (message.model != null && Object.hasOwnProperty.call(message, "model"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.model);
      if (message.choices != null && message.choices.length)
        for (let i = 0; i < message.choices.length; ++i)
          $root.common.Choice.encode(
            message.choices[i],
            writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
          ).ldelim();
      if (message.usage != null && Object.hasOwnProperty.call(message, "usage"))
        $root.common.Usage.encode(
          message.usage,
          writer.uint32(/* id 6, wireType 2 =*/ 50).fork(),
        ).ldelim();
      if (
        message.conversation_id != null &&
        Object.hasOwnProperty.call(message, "conversation_id")
      )
        writer
          .uint32(/* id 7, wireType 2 =*/ 58)
          .string(message.conversation_id);
      return writer;
    };

    /**
     * Decodes an AgentResponse message from the specified reader or buffer.
     * @function decode
     * @memberof agent.AgentResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {agent.AgentResponse} AgentResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AgentResponse.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.agent.AgentResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.string();
            break;
          }
          case 2: {
            message.object = reader.string();
            break;
          }
          case 3: {
            message.created = reader.int64();
            break;
          }
          case 4: {
            message.model = reader.string();
            break;
          }
          case 5: {
            if (!(message.choices && message.choices.length))
              message.choices = [];
            message.choices.push(
              $root.common.Choice.decode(reader, reader.uint32()),
            );
            break;
          }
          case 6: {
            message.usage = $root.common.Usage.decode(reader, reader.uint32());
            break;
          }
          case 7: {
            message.conversation_id = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an AgentResponse message.
     * @function verify
     * @memberof agent.AgentResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AgentResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isString(message.id)) return "id: string expected";
      if (message.object != null && message.hasOwnProperty("object"))
        if (!$util.isString(message.object)) return "object: string expected";
      if (message.created != null && message.hasOwnProperty("created"))
        if (
          !$util.isInteger(message.created) &&
          !(
            message.created &&
            $util.isInteger(message.created.low) &&
            $util.isInteger(message.created.high)
          )
        )
          return "created: integer|Long expected";
      if (message.model != null && message.hasOwnProperty("model"))
        if (!$util.isString(message.model)) return "model: string expected";
      if (message.choices != null && message.hasOwnProperty("choices")) {
        if (!Array.isArray(message.choices)) return "choices: array expected";
        for (let i = 0; i < message.choices.length; ++i) {
          let error = $root.common.Choice.verify(message.choices[i]);
          if (error) return "choices." + error;
        }
      }
      if (message.usage != null && message.hasOwnProperty("usage")) {
        let error = $root.common.Usage.verify(message.usage);
        if (error) return "usage." + error;
      }
      if (
        message.conversation_id != null &&
        message.hasOwnProperty("conversation_id")
      )
        if (!$util.isString(message.conversation_id))
          return "conversation_id: string expected";
      return null;
    };

    /**
     * Creates an AgentResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof agent.AgentResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {agent.AgentResponse} AgentResponse
     */
    AgentResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.agent.AgentResponse) return object;
      let message = new $root.agent.AgentResponse();
      if (object.id != null) message.id = String(object.id);
      if (object.object != null) message.object = String(object.object);
      if (object.created != null)
        if ($util.Long)
          (message.created = $util.Long.fromValue(object.created)).unsigned =
            false;
        else if (typeof object.created === "string")
          message.created = parseInt(object.created, 10);
        else if (typeof object.created === "number")
          message.created = object.created;
        else if (typeof object.created === "object")
          message.created = new $util.LongBits(
            object.created.low >>> 0,
            object.created.high >>> 0,
          ).toNumber();
      if (object.model != null) message.model = String(object.model);
      if (object.choices) {
        if (!Array.isArray(object.choices))
          throw TypeError(".agent.AgentResponse.choices: array expected");
        message.choices = [];
        for (let i = 0; i < object.choices.length; ++i) {
          if (typeof object.choices[i] !== "object")
            throw TypeError(".agent.AgentResponse.choices: object expected");
          message.choices[i] = $root.common.Choice.fromObject(
            object.choices[i],
          );
        }
      }
      if (object.usage != null) {
        if (typeof object.usage !== "object")
          throw TypeError(".agent.AgentResponse.usage: object expected");
        message.usage = $root.common.Usage.fromObject(object.usage);
      }
      if (object.conversation_id != null)
        message.conversation_id = String(object.conversation_id);
      return message;
    };

    /**
     * Creates a plain object from an AgentResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof agent.AgentResponse
     * @static
     * @param {agent.AgentResponse} message AgentResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AgentResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.choices = [];
      if (options.defaults) {
        object.id = "";
        object.object = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.created =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.created = options.longs === String ? "0" : 0;
        object.model = "";
        object.usage = null;
        object.conversation_id = "";
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = message.id;
      if (message.object != null && message.hasOwnProperty("object"))
        object.object = message.object;
      if (message.created != null && message.hasOwnProperty("created"))
        if (typeof message.created === "number")
          object.created =
            options.longs === String
              ? String(message.created)
              : message.created;
        else
          object.created =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.created)
              : options.longs === Number
                ? new $util.LongBits(
                    message.created.low >>> 0,
                    message.created.high >>> 0,
                  ).toNumber()
                : message.created;
      if (message.model != null && message.hasOwnProperty("model"))
        object.model = message.model;
      if (message.choices && message.choices.length) {
        object.choices = [];
        for (let j = 0; j < message.choices.length; ++j)
          object.choices[j] = $root.common.Choice.toObject(
            message.choices[j],
            options,
          );
      }
      if (message.usage != null && message.hasOwnProperty("usage"))
        object.usage = $root.common.Usage.toObject(message.usage, options);
      if (
        message.conversation_id != null &&
        message.hasOwnProperty("conversation_id")
      )
        object.conversation_id = message.conversation_id;
      return object;
    };

    /**
     * Converts this AgentResponse to JSON.
     * @function toJSON
     * @memberof agent.AgentResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AgentResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for AgentResponse
     * @function getTypeUrl
     * @memberof agent.AgentResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    AgentResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/agent.AgentResponse";
    };

    return AgentResponse;
  })();

  return agent;
})());

export const llm = ($root.llm = (() => {
  /**
   * Namespace llm.
   * @exports llm
   * @namespace
   */
  const llm = {};

  llm.EmbeddingsRequest = (function () {
    /**
     * Properties of an EmbeddingsRequest.
     * @memberof llm
     * @interface IEmbeddingsRequest
     * @property {Array.<string>|null} [chunks] EmbeddingsRequest chunks
     * @property {string|null} [github_token] EmbeddingsRequest github_token
     */

    /**
     * Constructs a new EmbeddingsRequest.
     * @memberof llm
     * @classdesc Represents an EmbeddingsRequest.
     * @implements IEmbeddingsRequest
     * @constructor
     * @param {llm.IEmbeddingsRequest=} [properties] Properties to set
     */
    function EmbeddingsRequest(properties) {
      this.chunks = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * EmbeddingsRequest chunks.
     * @member {Array.<string>} chunks
     * @memberof llm.EmbeddingsRequest
     * @instance
     */
    EmbeddingsRequest.prototype.chunks = $util.emptyArray;

    /**
     * EmbeddingsRequest github_token.
     * @member {string} github_token
     * @memberof llm.EmbeddingsRequest
     * @instance
     */
    EmbeddingsRequest.prototype.github_token = "";

    /**
     * Encodes the specified EmbeddingsRequest message. Does not implicitly {@link llm.EmbeddingsRequest.verify|verify} messages.
     * @function encode
     * @memberof llm.EmbeddingsRequest
     * @static
     * @param {llm.EmbeddingsRequest} message EmbeddingsRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EmbeddingsRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.chunks != null && message.chunks.length)
        for (let i = 0; i < message.chunks.length; ++i)
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.chunks[i]);
      if (
        message.github_token != null &&
        Object.hasOwnProperty.call(message, "github_token")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.github_token);
      return writer;
    };

    /**
     * Decodes an EmbeddingsRequest message from the specified reader or buffer.
     * @function decode
     * @memberof llm.EmbeddingsRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {llm.EmbeddingsRequest} EmbeddingsRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EmbeddingsRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.llm.EmbeddingsRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.chunks && message.chunks.length)) message.chunks = [];
            message.chunks.push(reader.string());
            break;
          }
          case 2: {
            message.github_token = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an EmbeddingsRequest message.
     * @function verify
     * @memberof llm.EmbeddingsRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    EmbeddingsRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.chunks != null && message.hasOwnProperty("chunks")) {
        if (!Array.isArray(message.chunks)) return "chunks: array expected";
        for (let i = 0; i < message.chunks.length; ++i)
          if (!$util.isString(message.chunks[i]))
            return "chunks: string[] expected";
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      )
        if (!$util.isString(message.github_token))
          return "github_token: string expected";
      return null;
    };

    /**
     * Creates an EmbeddingsRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof llm.EmbeddingsRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {llm.EmbeddingsRequest} EmbeddingsRequest
     */
    EmbeddingsRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.llm.EmbeddingsRequest) return object;
      let message = new $root.llm.EmbeddingsRequest();
      if (object.chunks) {
        if (!Array.isArray(object.chunks))
          throw TypeError(".llm.EmbeddingsRequest.chunks: array expected");
        message.chunks = [];
        for (let i = 0; i < object.chunks.length; ++i)
          message.chunks[i] = String(object.chunks[i]);
      }
      if (object.github_token != null)
        message.github_token = String(object.github_token);
      return message;
    };

    /**
     * Creates a plain object from an EmbeddingsRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof llm.EmbeddingsRequest
     * @static
     * @param {llm.EmbeddingsRequest} message EmbeddingsRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    EmbeddingsRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.chunks = [];
      if (options.defaults) object.github_token = "";
      if (message.chunks && message.chunks.length) {
        object.chunks = [];
        for (let j = 0; j < message.chunks.length; ++j)
          object.chunks[j] = message.chunks[j];
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      )
        object.github_token = message.github_token;
      return object;
    };

    /**
     * Converts this EmbeddingsRequest to JSON.
     * @function toJSON
     * @memberof llm.EmbeddingsRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    EmbeddingsRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for EmbeddingsRequest
     * @function getTypeUrl
     * @memberof llm.EmbeddingsRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    EmbeddingsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/llm.EmbeddingsRequest";
    };

    return EmbeddingsRequest;
  })();

  llm.EmbeddingsResponse = (function () {
    /**
     * Properties of an EmbeddingsResponse.
     * @memberof llm
     * @interface IEmbeddingsResponse
     * @property {Array.<common.Embedding>|null} [data] EmbeddingsResponse data
     */

    /**
     * Constructs a new EmbeddingsResponse.
     * @memberof llm
     * @classdesc Represents an EmbeddingsResponse.
     * @implements IEmbeddingsResponse
     * @constructor
     * @param {llm.IEmbeddingsResponse=} [properties] Properties to set
     */
    function EmbeddingsResponse(properties) {
      this.data = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * EmbeddingsResponse data.
     * @member {Array.<common.Embedding>} data
     * @memberof llm.EmbeddingsResponse
     * @instance
     */
    EmbeddingsResponse.prototype.data = $util.emptyArray;

    /**
     * Encodes the specified EmbeddingsResponse message. Does not implicitly {@link llm.EmbeddingsResponse.verify|verify} messages.
     * @function encode
     * @memberof llm.EmbeddingsResponse
     * @static
     * @param {llm.EmbeddingsResponse} message EmbeddingsResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EmbeddingsResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.data != null && message.data.length)
        for (let i = 0; i < message.data.length; ++i)
          $root.common.Embedding.encode(
            message.data[i],
            writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Decodes an EmbeddingsResponse message from the specified reader or buffer.
     * @function decode
     * @memberof llm.EmbeddingsResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {llm.EmbeddingsResponse} EmbeddingsResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EmbeddingsResponse.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.llm.EmbeddingsResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.data && message.data.length)) message.data = [];
            message.data.push(
              $root.common.Embedding.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an EmbeddingsResponse message.
     * @function verify
     * @memberof llm.EmbeddingsResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    EmbeddingsResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.data != null && message.hasOwnProperty("data")) {
        if (!Array.isArray(message.data)) return "data: array expected";
        for (let i = 0; i < message.data.length; ++i) {
          let error = $root.common.Embedding.verify(message.data[i]);
          if (error) return "data." + error;
        }
      }
      return null;
    };

    /**
     * Creates an EmbeddingsResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof llm.EmbeddingsResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {llm.EmbeddingsResponse} EmbeddingsResponse
     */
    EmbeddingsResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.llm.EmbeddingsResponse) return object;
      let message = new $root.llm.EmbeddingsResponse();
      if (object.data) {
        if (!Array.isArray(object.data))
          throw TypeError(".llm.EmbeddingsResponse.data: array expected");
        message.data = [];
        for (let i = 0; i < object.data.length; ++i) {
          if (typeof object.data[i] !== "object")
            throw TypeError(".llm.EmbeddingsResponse.data: object expected");
          message.data[i] = $root.common.Embedding.fromObject(object.data[i]);
        }
      }
      return message;
    };

    /**
     * Creates a plain object from an EmbeddingsResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof llm.EmbeddingsResponse
     * @static
     * @param {llm.EmbeddingsResponse} message EmbeddingsResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    EmbeddingsResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.data = [];
      if (message.data && message.data.length) {
        object.data = [];
        for (let j = 0; j < message.data.length; ++j)
          object.data[j] = $root.common.Embedding.toObject(
            message.data[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this EmbeddingsResponse to JSON.
     * @function toJSON
     * @memberof llm.EmbeddingsResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    EmbeddingsResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for EmbeddingsResponse
     * @function getTypeUrl
     * @memberof llm.EmbeddingsResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    EmbeddingsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/llm.EmbeddingsResponse";
    };

    return EmbeddingsResponse;
  })();

  llm.CompletionsRequest = (function () {
    /**
     * Properties of a CompletionsRequest.
     * @memberof llm
     * @interface ICompletionsRequest
     * @property {Array.<common.MessageV2>|null} [messages] CompletionsRequest messages
     * @property {number|null} [temperature] CompletionsRequest temperature
     * @property {string|null} [github_token] CompletionsRequest github_token
     */

    /**
     * Constructs a new CompletionsRequest.
     * @memberof llm
     * @classdesc Represents a CompletionsRequest.
     * @implements ICompletionsRequest
     * @constructor
     * @param {llm.ICompletionsRequest=} [properties] Properties to set
     */
    function CompletionsRequest(properties) {
      this.messages = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * CompletionsRequest messages.
     * @member {Array.<common.MessageV2>} messages
     * @memberof llm.CompletionsRequest
     * @instance
     */
    CompletionsRequest.prototype.messages = $util.emptyArray;

    /**
     * CompletionsRequest temperature.
     * @member {number|null|undefined} temperature
     * @memberof llm.CompletionsRequest
     * @instance
     */
    CompletionsRequest.prototype.temperature = null;

    /**
     * CompletionsRequest github_token.
     * @member {string} github_token
     * @memberof llm.CompletionsRequest
     * @instance
     */
    CompletionsRequest.prototype.github_token = "";

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * CompletionsRequest _temperature.
     * @member {"temperature"|undefined} _temperature
     * @memberof llm.CompletionsRequest
     * @instance
     */
    Object.defineProperty(CompletionsRequest.prototype, "_temperature", {
      get: $util.oneOfGetter(($oneOfFields = ["temperature"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified CompletionsRequest message. Does not implicitly {@link llm.CompletionsRequest.verify|verify} messages.
     * @function encode
     * @memberof llm.CompletionsRequest
     * @static
     * @param {llm.CompletionsRequest} message CompletionsRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CompletionsRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.messages != null && message.messages.length)
        for (let i = 0; i < message.messages.length; ++i)
          $root.common.MessageV2.encode(
            message.messages[i],
            writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
          ).ldelim();
      if (
        message.temperature != null &&
        Object.hasOwnProperty.call(message, "temperature")
      )
        writer.uint32(/* id 2, wireType 5 =*/ 21).float(message.temperature);
      if (
        message.github_token != null &&
        Object.hasOwnProperty.call(message, "github_token")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.github_token);
      return writer;
    };

    /**
     * Decodes a CompletionsRequest message from the specified reader or buffer.
     * @function decode
     * @memberof llm.CompletionsRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {llm.CompletionsRequest} CompletionsRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CompletionsRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.llm.CompletionsRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.messages && message.messages.length))
              message.messages = [];
            message.messages.push(
              $root.common.MessageV2.decode(reader, reader.uint32()),
            );
            break;
          }
          case 2: {
            message.temperature = reader.float();
            break;
          }
          case 3: {
            message.github_token = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a CompletionsRequest message.
     * @function verify
     * @memberof llm.CompletionsRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CompletionsRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.messages != null && message.hasOwnProperty("messages")) {
        if (!Array.isArray(message.messages)) return "messages: array expected";
        for (let i = 0; i < message.messages.length; ++i) {
          let error = $root.common.MessageV2.verify(message.messages[i]);
          if (error) return "messages." + error;
        }
      }
      if (
        message.temperature != null &&
        message.hasOwnProperty("temperature")
      ) {
        properties._temperature = 1;
        if (typeof message.temperature !== "number")
          return "temperature: number expected";
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      )
        if (!$util.isString(message.github_token))
          return "github_token: string expected";
      return null;
    };

    /**
     * Creates a CompletionsRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof llm.CompletionsRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {llm.CompletionsRequest} CompletionsRequest
     */
    CompletionsRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.llm.CompletionsRequest) return object;
      let message = new $root.llm.CompletionsRequest();
      if (object.messages) {
        if (!Array.isArray(object.messages))
          throw TypeError(".llm.CompletionsRequest.messages: array expected");
        message.messages = [];
        for (let i = 0; i < object.messages.length; ++i) {
          if (typeof object.messages[i] !== "object")
            throw TypeError(
              ".llm.CompletionsRequest.messages: object expected",
            );
          message.messages[i] = $root.common.MessageV2.fromObject(
            object.messages[i],
          );
        }
      }
      if (object.temperature != null)
        message.temperature = Number(object.temperature);
      if (object.github_token != null)
        message.github_token = String(object.github_token);
      return message;
    };

    /**
     * Creates a plain object from a CompletionsRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof llm.CompletionsRequest
     * @static
     * @param {llm.CompletionsRequest} message CompletionsRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CompletionsRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.messages = [];
      if (options.defaults) object.github_token = "";
      if (message.messages && message.messages.length) {
        object.messages = [];
        for (let j = 0; j < message.messages.length; ++j)
          object.messages[j] = $root.common.MessageV2.toObject(
            message.messages[j],
            options,
          );
      }
      if (
        message.temperature != null &&
        message.hasOwnProperty("temperature")
      ) {
        object.temperature =
          options.json && !isFinite(message.temperature)
            ? String(message.temperature)
            : message.temperature;
        if (options.oneofs) object._temperature = "temperature";
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      )
        object.github_token = message.github_token;
      return object;
    };

    /**
     * Converts this CompletionsRequest to JSON.
     * @function toJSON
     * @memberof llm.CompletionsRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CompletionsRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CompletionsRequest
     * @function getTypeUrl
     * @memberof llm.CompletionsRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CompletionsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/llm.CompletionsRequest";
    };

    return CompletionsRequest;
  })();

  llm.CompletionsResponse = (function () {
    /**
     * Properties of a CompletionsResponse.
     * @memberof llm
     * @interface ICompletionsResponse
     * @property {string|null} [id] CompletionsResponse id
     * @property {string|null} [object] CompletionsResponse object
     * @property {number|Long|null} [created] CompletionsResponse created
     * @property {string|null} [model] CompletionsResponse model
     * @property {Array.<common.Choice>|null} [choices] CompletionsResponse choices
     * @property {common.Usage|null} [usage] CompletionsResponse usage
     */

    /**
     * Constructs a new CompletionsResponse.
     * @memberof llm
     * @classdesc Represents a CompletionsResponse.
     * @implements ICompletionsResponse
     * @constructor
     * @param {llm.ICompletionsResponse=} [properties] Properties to set
     */
    function CompletionsResponse(properties) {
      this.choices = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * CompletionsResponse id.
     * @member {string} id
     * @memberof llm.CompletionsResponse
     * @instance
     */
    CompletionsResponse.prototype.id = "";

    /**
     * CompletionsResponse object.
     * @member {string} object
     * @memberof llm.CompletionsResponse
     * @instance
     */
    CompletionsResponse.prototype.object = "";

    /**
     * CompletionsResponse created.
     * @member {number|Long} created
     * @memberof llm.CompletionsResponse
     * @instance
     */
    CompletionsResponse.prototype.created = $util.Long
      ? $util.Long.fromBits(0, 0, false)
      : 0;

    /**
     * CompletionsResponse model.
     * @member {string} model
     * @memberof llm.CompletionsResponse
     * @instance
     */
    CompletionsResponse.prototype.model = "";

    /**
     * CompletionsResponse choices.
     * @member {Array.<common.Choice>} choices
     * @memberof llm.CompletionsResponse
     * @instance
     */
    CompletionsResponse.prototype.choices = $util.emptyArray;

    /**
     * CompletionsResponse usage.
     * @member {common.Usage|null|undefined} usage
     * @memberof llm.CompletionsResponse
     * @instance
     */
    CompletionsResponse.prototype.usage = null;

    /**
     * Encodes the specified CompletionsResponse message. Does not implicitly {@link llm.CompletionsResponse.verify|verify} messages.
     * @function encode
     * @memberof llm.CompletionsResponse
     * @static
     * @param {llm.CompletionsResponse} message CompletionsResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CompletionsResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.id);
      if (
        message.object != null &&
        Object.hasOwnProperty.call(message, "object")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.object);
      if (
        message.created != null &&
        Object.hasOwnProperty.call(message, "created")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int64(message.created);
      if (message.model != null && Object.hasOwnProperty.call(message, "model"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.model);
      if (message.choices != null && message.choices.length)
        for (let i = 0; i < message.choices.length; ++i)
          $root.common.Choice.encode(
            message.choices[i],
            writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
          ).ldelim();
      if (message.usage != null && Object.hasOwnProperty.call(message, "usage"))
        $root.common.Usage.encode(
          message.usage,
          writer.uint32(/* id 6, wireType 2 =*/ 50).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Decodes a CompletionsResponse message from the specified reader or buffer.
     * @function decode
     * @memberof llm.CompletionsResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {llm.CompletionsResponse} CompletionsResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CompletionsResponse.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.llm.CompletionsResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.string();
            break;
          }
          case 2: {
            message.object = reader.string();
            break;
          }
          case 3: {
            message.created = reader.int64();
            break;
          }
          case 4: {
            message.model = reader.string();
            break;
          }
          case 5: {
            if (!(message.choices && message.choices.length))
              message.choices = [];
            message.choices.push(
              $root.common.Choice.decode(reader, reader.uint32()),
            );
            break;
          }
          case 6: {
            message.usage = $root.common.Usage.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a CompletionsResponse message.
     * @function verify
     * @memberof llm.CompletionsResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CompletionsResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isString(message.id)) return "id: string expected";
      if (message.object != null && message.hasOwnProperty("object"))
        if (!$util.isString(message.object)) return "object: string expected";
      if (message.created != null && message.hasOwnProperty("created"))
        if (
          !$util.isInteger(message.created) &&
          !(
            message.created &&
            $util.isInteger(message.created.low) &&
            $util.isInteger(message.created.high)
          )
        )
          return "created: integer|Long expected";
      if (message.model != null && message.hasOwnProperty("model"))
        if (!$util.isString(message.model)) return "model: string expected";
      if (message.choices != null && message.hasOwnProperty("choices")) {
        if (!Array.isArray(message.choices)) return "choices: array expected";
        for (let i = 0; i < message.choices.length; ++i) {
          let error = $root.common.Choice.verify(message.choices[i]);
          if (error) return "choices." + error;
        }
      }
      if (message.usage != null && message.hasOwnProperty("usage")) {
        let error = $root.common.Usage.verify(message.usage);
        if (error) return "usage." + error;
      }
      return null;
    };

    /**
     * Creates a CompletionsResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof llm.CompletionsResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {llm.CompletionsResponse} CompletionsResponse
     */
    CompletionsResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.llm.CompletionsResponse) return object;
      let message = new $root.llm.CompletionsResponse();
      if (object.id != null) message.id = String(object.id);
      if (object.object != null) message.object = String(object.object);
      if (object.created != null)
        if ($util.Long)
          (message.created = $util.Long.fromValue(object.created)).unsigned =
            false;
        else if (typeof object.created === "string")
          message.created = parseInt(object.created, 10);
        else if (typeof object.created === "number")
          message.created = object.created;
        else if (typeof object.created === "object")
          message.created = new $util.LongBits(
            object.created.low >>> 0,
            object.created.high >>> 0,
          ).toNumber();
      if (object.model != null) message.model = String(object.model);
      if (object.choices) {
        if (!Array.isArray(object.choices))
          throw TypeError(".llm.CompletionsResponse.choices: array expected");
        message.choices = [];
        for (let i = 0; i < object.choices.length; ++i) {
          if (typeof object.choices[i] !== "object")
            throw TypeError(
              ".llm.CompletionsResponse.choices: object expected",
            );
          message.choices[i] = $root.common.Choice.fromObject(
            object.choices[i],
          );
        }
      }
      if (object.usage != null) {
        if (typeof object.usage !== "object")
          throw TypeError(".llm.CompletionsResponse.usage: object expected");
        message.usage = $root.common.Usage.fromObject(object.usage);
      }
      return message;
    };

    /**
     * Creates a plain object from a CompletionsResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof llm.CompletionsResponse
     * @static
     * @param {llm.CompletionsResponse} message CompletionsResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CompletionsResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.choices = [];
      if (options.defaults) {
        object.id = "";
        object.object = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.created =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.created = options.longs === String ? "0" : 0;
        object.model = "";
        object.usage = null;
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = message.id;
      if (message.object != null && message.hasOwnProperty("object"))
        object.object = message.object;
      if (message.created != null && message.hasOwnProperty("created"))
        if (typeof message.created === "number")
          object.created =
            options.longs === String
              ? String(message.created)
              : message.created;
        else
          object.created =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.created)
              : options.longs === Number
                ? new $util.LongBits(
                    message.created.low >>> 0,
                    message.created.high >>> 0,
                  ).toNumber()
                : message.created;
      if (message.model != null && message.hasOwnProperty("model"))
        object.model = message.model;
      if (message.choices && message.choices.length) {
        object.choices = [];
        for (let j = 0; j < message.choices.length; ++j)
          object.choices[j] = $root.common.Choice.toObject(
            message.choices[j],
            options,
          );
      }
      if (message.usage != null && message.hasOwnProperty("usage"))
        object.usage = $root.common.Usage.toObject(message.usage, options);
      return object;
    };

    /**
     * Converts this CompletionsResponse to JSON.
     * @function toJSON
     * @memberof llm.CompletionsResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CompletionsResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CompletionsResponse
     * @function getTypeUrl
     * @memberof llm.CompletionsResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CompletionsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/llm.CompletionsResponse";
    };

    return CompletionsResponse;
  })();

  return llm;
})());

export const vector = ($root.vector = (() => {
  /**
   * Namespace vector.
   * @exports vector
   * @namespace
   */
  const vector = {};

  vector.Filter = (function () {
    /**
     * Properties of a Filter.
     * @memberof vector
     * @interface IFilter
     * @property {string|null} [limit] Filter limit
     * @property {string|null} [threshold] Filter threshold
     * @property {string|null} [max_tokens] Filter max_tokens
     * @property {string|null} [prefix] Filter prefix
     * @property {string|null} [type] Filter type
     */

    /**
     * Constructs a new Filter.
     * @memberof vector
     * @classdesc Represents a Filter.
     * @implements IFilter
     * @constructor
     * @param {vector.IFilter=} [properties] Properties to set
     */
    function Filter(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Filter limit.
     * @member {string|null|undefined} limit
     * @memberof vector.Filter
     * @instance
     */
    Filter.prototype.limit = null;

    /**
     * Filter threshold.
     * @member {string|null|undefined} threshold
     * @memberof vector.Filter
     * @instance
     */
    Filter.prototype.threshold = null;

    /**
     * Filter max_tokens.
     * @member {string|null|undefined} max_tokens
     * @memberof vector.Filter
     * @instance
     */
    Filter.prototype.max_tokens = null;

    /**
     * Filter prefix.
     * @member {string|null|undefined} prefix
     * @memberof vector.Filter
     * @instance
     */
    Filter.prototype.prefix = null;

    /**
     * Filter type.
     * @member {string|null|undefined} type
     * @memberof vector.Filter
     * @instance
     */
    Filter.prototype.type = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Filter _limit.
     * @member {"limit"|undefined} _limit
     * @memberof vector.Filter
     * @instance
     */
    Object.defineProperty(Filter.prototype, "_limit", {
      get: $util.oneOfGetter(($oneOfFields = ["limit"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Filter _threshold.
     * @member {"threshold"|undefined} _threshold
     * @memberof vector.Filter
     * @instance
     */
    Object.defineProperty(Filter.prototype, "_threshold", {
      get: $util.oneOfGetter(($oneOfFields = ["threshold"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Filter _max_tokens.
     * @member {"max_tokens"|undefined} _max_tokens
     * @memberof vector.Filter
     * @instance
     */
    Object.defineProperty(Filter.prototype, "_max_tokens", {
      get: $util.oneOfGetter(($oneOfFields = ["max_tokens"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Filter _prefix.
     * @member {"prefix"|undefined} _prefix
     * @memberof vector.Filter
     * @instance
     */
    Object.defineProperty(Filter.prototype, "_prefix", {
      get: $util.oneOfGetter(($oneOfFields = ["prefix"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Filter _type.
     * @member {"type"|undefined} _type
     * @memberof vector.Filter
     * @instance
     */
    Object.defineProperty(Filter.prototype, "_type", {
      get: $util.oneOfGetter(($oneOfFields = ["type"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified Filter message. Does not implicitly {@link vector.Filter.verify|verify} messages.
     * @function encode
     * @memberof vector.Filter
     * @static
     * @param {vector.Filter} message Filter message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Filter.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.limit != null && Object.hasOwnProperty.call(message, "limit"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.limit);
      if (
        message.threshold != null &&
        Object.hasOwnProperty.call(message, "threshold")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.threshold);
      if (
        message.max_tokens != null &&
        Object.hasOwnProperty.call(message, "max_tokens")
      )
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.max_tokens);
      if (
        message.prefix != null &&
        Object.hasOwnProperty.call(message, "prefix")
      )
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.prefix);
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.type);
      return writer;
    };

    /**
     * Decodes a Filter message from the specified reader or buffer.
     * @function decode
     * @memberof vector.Filter
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {vector.Filter} Filter
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Filter.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.vector.Filter();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.limit = reader.string();
            break;
          }
          case 2: {
            message.threshold = reader.string();
            break;
          }
          case 3: {
            message.max_tokens = reader.string();
            break;
          }
          case 4: {
            message.prefix = reader.string();
            break;
          }
          case 5: {
            message.type = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Filter message.
     * @function verify
     * @memberof vector.Filter
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Filter.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.limit != null && message.hasOwnProperty("limit")) {
        properties._limit = 1;
        if (!$util.isString(message.limit)) return "limit: string expected";
      }
      if (message.threshold != null && message.hasOwnProperty("threshold")) {
        properties._threshold = 1;
        if (!$util.isString(message.threshold))
          return "threshold: string expected";
      }
      if (message.max_tokens != null && message.hasOwnProperty("max_tokens")) {
        properties._max_tokens = 1;
        if (!$util.isString(message.max_tokens))
          return "max_tokens: string expected";
      }
      if (message.prefix != null && message.hasOwnProperty("prefix")) {
        properties._prefix = 1;
        if (!$util.isString(message.prefix)) return "prefix: string expected";
      }
      if (message.type != null && message.hasOwnProperty("type")) {
        properties._type = 1;
        if (!$util.isString(message.type)) return "type: string expected";
      }
      return null;
    };

    /**
     * Creates a Filter message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof vector.Filter
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {vector.Filter} Filter
     */
    Filter.fromObject = function fromObject(object) {
      if (object instanceof $root.vector.Filter) return object;
      let message = new $root.vector.Filter();
      if (object.limit != null) message.limit = String(object.limit);
      if (object.threshold != null)
        message.threshold = String(object.threshold);
      if (object.max_tokens != null)
        message.max_tokens = String(object.max_tokens);
      if (object.prefix != null) message.prefix = String(object.prefix);
      if (object.type != null) message.type = String(object.type);
      return message;
    };

    /**
     * Creates a plain object from a Filter message. Also converts values to other types if specified.
     * @function toObject
     * @memberof vector.Filter
     * @static
     * @param {vector.Filter} message Filter
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Filter.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (message.limit != null && message.hasOwnProperty("limit")) {
        object.limit = message.limit;
        if (options.oneofs) object._limit = "limit";
      }
      if (message.threshold != null && message.hasOwnProperty("threshold")) {
        object.threshold = message.threshold;
        if (options.oneofs) object._threshold = "threshold";
      }
      if (message.max_tokens != null && message.hasOwnProperty("max_tokens")) {
        object.max_tokens = message.max_tokens;
        if (options.oneofs) object._max_tokens = "max_tokens";
      }
      if (message.prefix != null && message.hasOwnProperty("prefix")) {
        object.prefix = message.prefix;
        if (options.oneofs) object._prefix = "prefix";
      }
      if (message.type != null && message.hasOwnProperty("type")) {
        object.type = message.type;
        if (options.oneofs) object._type = "type";
      }
      return object;
    };

    /**
     * Converts this Filter to JSON.
     * @function toJSON
     * @memberof vector.Filter
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Filter.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Filter
     * @function getTypeUrl
     * @memberof vector.Filter
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Filter.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/vector.Filter";
    };

    return Filter;
  })();

  vector.QueryItemsRequest = (function () {
    /**
     * Properties of a QueryItemsRequest.
     * @memberof vector
     * @interface IQueryItemsRequest
     * @property {string|null} [index] QueryItemsRequest index
     * @property {Array.<number>|null} [vector] QueryItemsRequest vector
     * @property {vector.Filter|null} [filter] QueryItemsRequest filter
     */

    /**
     * Constructs a new QueryItemsRequest.
     * @memberof vector
     * @classdesc Represents a QueryItemsRequest.
     * @implements IQueryItemsRequest
     * @constructor
     * @param {vector.IQueryItemsRequest=} [properties] Properties to set
     */
    function QueryItemsRequest(properties) {
      this.vector = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * QueryItemsRequest index.
     * @member {string} index
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.index = "";

    /**
     * QueryItemsRequest vector.
     * @member {Array.<number>} vector
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.vector = $util.emptyArray;

    /**
     * QueryItemsRequest filter.
     * @member {vector.Filter|null|undefined} filter
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.filter = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * QueryItemsRequest _filter.
     * @member {"filter"|undefined} _filter
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    Object.defineProperty(QueryItemsRequest.prototype, "_filter", {
      get: $util.oneOfGetter(($oneOfFields = ["filter"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified QueryItemsRequest message. Does not implicitly {@link vector.QueryItemsRequest.verify|verify} messages.
     * @function encode
     * @memberof vector.QueryItemsRequest
     * @static
     * @param {vector.QueryItemsRequest} message QueryItemsRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    QueryItemsRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.index != null && Object.hasOwnProperty.call(message, "index"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.index);
      if (message.vector != null && message.vector.length) {
        writer.uint32(/* id 2, wireType 2 =*/ 18).fork();
        for (let i = 0; i < message.vector.length; ++i)
          writer.double(message.vector[i]);
        writer.ldelim();
      }
      if (
        message.filter != null &&
        Object.hasOwnProperty.call(message, "filter")
      )
        $root.vector.Filter.encode(
          message.filter,
          writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Decodes a QueryItemsRequest message from the specified reader or buffer.
     * @function decode
     * @memberof vector.QueryItemsRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {vector.QueryItemsRequest} QueryItemsRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    QueryItemsRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.vector.QueryItemsRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.index = reader.string();
            break;
          }
          case 2: {
            if (!(message.vector && message.vector.length)) message.vector = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.vector.push(reader.double());
            } else message.vector.push(reader.double());
            break;
          }
          case 3: {
            message.filter = $root.vector.Filter.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a QueryItemsRequest message.
     * @function verify
     * @memberof vector.QueryItemsRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    QueryItemsRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.index != null && message.hasOwnProperty("index"))
        if (!$util.isString(message.index)) return "index: string expected";
      if (message.vector != null && message.hasOwnProperty("vector")) {
        if (!Array.isArray(message.vector)) return "vector: array expected";
        for (let i = 0; i < message.vector.length; ++i)
          if (typeof message.vector[i] !== "number")
            return "vector: number[] expected";
      }
      if (message.filter != null && message.hasOwnProperty("filter")) {
        properties._filter = 1;
        {
          let error = $root.vector.Filter.verify(message.filter);
          if (error) return "filter." + error;
        }
      }
      return null;
    };

    /**
     * Creates a QueryItemsRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof vector.QueryItemsRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {vector.QueryItemsRequest} QueryItemsRequest
     */
    QueryItemsRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.vector.QueryItemsRequest) return object;
      let message = new $root.vector.QueryItemsRequest();
      if (object.index != null) message.index = String(object.index);
      if (object.vector) {
        if (!Array.isArray(object.vector))
          throw TypeError(".vector.QueryItemsRequest.vector: array expected");
        message.vector = [];
        for (let i = 0; i < object.vector.length; ++i)
          message.vector[i] = Number(object.vector[i]);
      }
      if (object.filter != null) {
        if (typeof object.filter !== "object")
          throw TypeError(".vector.QueryItemsRequest.filter: object expected");
        message.filter = $root.vector.Filter.fromObject(object.filter);
      }
      return message;
    };

    /**
     * Creates a plain object from a QueryItemsRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof vector.QueryItemsRequest
     * @static
     * @param {vector.QueryItemsRequest} message QueryItemsRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    QueryItemsRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.vector = [];
      if (options.defaults) object.index = "";
      if (message.index != null && message.hasOwnProperty("index"))
        object.index = message.index;
      if (message.vector && message.vector.length) {
        object.vector = [];
        for (let j = 0; j < message.vector.length; ++j)
          object.vector[j] =
            options.json && !isFinite(message.vector[j])
              ? String(message.vector[j])
              : message.vector[j];
      }
      if (message.filter != null && message.hasOwnProperty("filter")) {
        object.filter = $root.vector.Filter.toObject(message.filter, options);
        if (options.oneofs) object._filter = "filter";
      }
      return object;
    };

    /**
     * Converts this QueryItemsRequest to JSON.
     * @function toJSON
     * @memberof vector.QueryItemsRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    QueryItemsRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for QueryItemsRequest
     * @function getTypeUrl
     * @memberof vector.QueryItemsRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    QueryItemsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/vector.QueryItemsRequest";
    };

    return QueryItemsRequest;
  })();

  vector.QueryItemsResponse = (function () {
    /**
     * Properties of a QueryItemsResponse.
     * @memberof vector
     * @interface IQueryItemsResponse
     * @property {Array.<resource.Identifier>|null} [identifiers] QueryItemsResponse identifiers
     */

    /**
     * Constructs a new QueryItemsResponse.
     * @memberof vector
     * @classdesc Represents a QueryItemsResponse.
     * @implements IQueryItemsResponse
     * @constructor
     * @param {vector.IQueryItemsResponse=} [properties] Properties to set
     */
    function QueryItemsResponse(properties) {
      this.identifiers = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * QueryItemsResponse identifiers.
     * @member {Array.<resource.Identifier>} identifiers
     * @memberof vector.QueryItemsResponse
     * @instance
     */
    QueryItemsResponse.prototype.identifiers = $util.emptyArray;

    /**
     * Encodes the specified QueryItemsResponse message. Does not implicitly {@link vector.QueryItemsResponse.verify|verify} messages.
     * @function encode
     * @memberof vector.QueryItemsResponse
     * @static
     * @param {vector.QueryItemsResponse} message QueryItemsResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    QueryItemsResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.identifiers != null && message.identifiers.length)
        for (let i = 0; i < message.identifiers.length; ++i)
          $root.resource.Identifier.encode(
            message.identifiers[i],
            writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Decodes a QueryItemsResponse message from the specified reader or buffer.
     * @function decode
     * @memberof vector.QueryItemsResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {vector.QueryItemsResponse} QueryItemsResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    QueryItemsResponse.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.vector.QueryItemsResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            if (!(message.identifiers && message.identifiers.length))
              message.identifiers = [];
            message.identifiers.push(
              $root.resource.Identifier.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a QueryItemsResponse message.
     * @function verify
     * @memberof vector.QueryItemsResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    QueryItemsResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (
        message.identifiers != null &&
        message.hasOwnProperty("identifiers")
      ) {
        if (!Array.isArray(message.identifiers))
          return "identifiers: array expected";
        for (let i = 0; i < message.identifiers.length; ++i) {
          let error = $root.resource.Identifier.verify(message.identifiers[i]);
          if (error) return "identifiers." + error;
        }
      }
      return null;
    };

    /**
     * Creates a QueryItemsResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof vector.QueryItemsResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {vector.QueryItemsResponse} QueryItemsResponse
     */
    QueryItemsResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.vector.QueryItemsResponse) return object;
      let message = new $root.vector.QueryItemsResponse();
      if (object.identifiers) {
        if (!Array.isArray(object.identifiers))
          throw TypeError(
            ".vector.QueryItemsResponse.identifiers: array expected",
          );
        message.identifiers = [];
        for (let i = 0; i < object.identifiers.length; ++i) {
          if (typeof object.identifiers[i] !== "object")
            throw TypeError(
              ".vector.QueryItemsResponse.identifiers: object expected",
            );
          message.identifiers[i] = $root.resource.Identifier.fromObject(
            object.identifiers[i],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a QueryItemsResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof vector.QueryItemsResponse
     * @static
     * @param {vector.QueryItemsResponse} message QueryItemsResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    QueryItemsResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.identifiers = [];
      if (message.identifiers && message.identifiers.length) {
        object.identifiers = [];
        for (let j = 0; j < message.identifiers.length; ++j)
          object.identifiers[j] = $root.resource.Identifier.toObject(
            message.identifiers[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this QueryItemsResponse to JSON.
     * @function toJSON
     * @memberof vector.QueryItemsResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    QueryItemsResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for QueryItemsResponse
     * @function getTypeUrl
     * @memberof vector.QueryItemsResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    QueryItemsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/vector.QueryItemsResponse";
    };

    return QueryItemsResponse;
  })();

  vector.GetItemRequest = (function () {
    /**
     * Properties of a GetItemRequest.
     * @memberof vector
     * @interface IGetItemRequest
     * @property {string|null} [index] GetItemRequest index
     * @property {string|null} [id] GetItemRequest id
     */

    /**
     * Constructs a new GetItemRequest.
     * @memberof vector
     * @classdesc Represents a GetItemRequest.
     * @implements IGetItemRequest
     * @constructor
     * @param {vector.IGetItemRequest=} [properties] Properties to set
     */
    function GetItemRequest(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GetItemRequest index.
     * @member {string} index
     * @memberof vector.GetItemRequest
     * @instance
     */
    GetItemRequest.prototype.index = "";

    /**
     * GetItemRequest id.
     * @member {string} id
     * @memberof vector.GetItemRequest
     * @instance
     */
    GetItemRequest.prototype.id = "";

    /**
     * Encodes the specified GetItemRequest message. Does not implicitly {@link vector.GetItemRequest.verify|verify} messages.
     * @function encode
     * @memberof vector.GetItemRequest
     * @static
     * @param {vector.GetItemRequest} message GetItemRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GetItemRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.index != null && Object.hasOwnProperty.call(message, "index"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.index);
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.id);
      return writer;
    };

    /**
     * Decodes a GetItemRequest message from the specified reader or buffer.
     * @function decode
     * @memberof vector.GetItemRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {vector.GetItemRequest} GetItemRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GetItemRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.vector.GetItemRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.index = reader.string();
            break;
          }
          case 2: {
            message.id = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a GetItemRequest message.
     * @function verify
     * @memberof vector.GetItemRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GetItemRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.index != null && message.hasOwnProperty("index"))
        if (!$util.isString(message.index)) return "index: string expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isString(message.id)) return "id: string expected";
      return null;
    };

    /**
     * Creates a GetItemRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof vector.GetItemRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {vector.GetItemRequest} GetItemRequest
     */
    GetItemRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.vector.GetItemRequest) return object;
      let message = new $root.vector.GetItemRequest();
      if (object.index != null) message.index = String(object.index);
      if (object.id != null) message.id = String(object.id);
      return message;
    };

    /**
     * Creates a plain object from a GetItemRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof vector.GetItemRequest
     * @static
     * @param {vector.GetItemRequest} message GetItemRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GetItemRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.index = "";
        object.id = "";
      }
      if (message.index != null && message.hasOwnProperty("index"))
        object.index = message.index;
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = message.id;
      return object;
    };

    /**
     * Converts this GetItemRequest to JSON.
     * @function toJSON
     * @memberof vector.GetItemRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GetItemRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GetItemRequest
     * @function getTypeUrl
     * @memberof vector.GetItemRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GetItemRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/vector.GetItemRequest";
    };

    return GetItemRequest;
  })();

  vector.GetItemResponse = (function () {
    /**
     * Properties of a GetItemResponse.
     * @memberof vector
     * @interface IGetItemResponse
     * @property {resource.Identifier|null} [identifier] GetItemResponse identifier
     */

    /**
     * Constructs a new GetItemResponse.
     * @memberof vector
     * @classdesc Represents a GetItemResponse.
     * @implements IGetItemResponse
     * @constructor
     * @param {vector.IGetItemResponse=} [properties] Properties to set
     */
    function GetItemResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GetItemResponse identifier.
     * @member {resource.Identifier|null|undefined} identifier
     * @memberof vector.GetItemResponse
     * @instance
     */
    GetItemResponse.prototype.identifier = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * GetItemResponse _identifier.
     * @member {"identifier"|undefined} _identifier
     * @memberof vector.GetItemResponse
     * @instance
     */
    Object.defineProperty(GetItemResponse.prototype, "_identifier", {
      get: $util.oneOfGetter(($oneOfFields = ["identifier"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Encodes the specified GetItemResponse message. Does not implicitly {@link vector.GetItemResponse.verify|verify} messages.
     * @function encode
     * @memberof vector.GetItemResponse
     * @static
     * @param {vector.GetItemResponse} message GetItemResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GetItemResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.identifier != null &&
        Object.hasOwnProperty.call(message, "identifier")
      )
        $root.resource.Identifier.encode(
          message.identifier,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Decodes a GetItemResponse message from the specified reader or buffer.
     * @function decode
     * @memberof vector.GetItemResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {vector.GetItemResponse} GetItemResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GetItemResponse.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.vector.GetItemResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.identifier = $root.resource.Identifier.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a GetItemResponse message.
     * @function verify
     * @memberof vector.GetItemResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GetItemResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.identifier != null && message.hasOwnProperty("identifier")) {
        properties._identifier = 1;
        {
          let error = $root.resource.Identifier.verify(message.identifier);
          if (error) return "identifier." + error;
        }
      }
      return null;
    };

    /**
     * Creates a GetItemResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof vector.GetItemResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {vector.GetItemResponse} GetItemResponse
     */
    GetItemResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.vector.GetItemResponse) return object;
      let message = new $root.vector.GetItemResponse();
      if (object.identifier != null) {
        if (typeof object.identifier !== "object")
          throw TypeError(
            ".vector.GetItemResponse.identifier: object expected",
          );
        message.identifier = $root.resource.Identifier.fromObject(
          object.identifier,
        );
      }
      return message;
    };

    /**
     * Creates a plain object from a GetItemResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof vector.GetItemResponse
     * @static
     * @param {vector.GetItemResponse} message GetItemResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GetItemResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (message.identifier != null && message.hasOwnProperty("identifier")) {
        object.identifier = $root.resource.Identifier.toObject(
          message.identifier,
          options,
        );
        if (options.oneofs) object._identifier = "identifier";
      }
      return object;
    };

    /**
     * Converts this GetItemResponse to JSON.
     * @function toJSON
     * @memberof vector.GetItemResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GetItemResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GetItemResponse
     * @function getTypeUrl
     * @memberof vector.GetItemResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GetItemResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/vector.GetItemResponse";
    };

    return GetItemResponse;
  })();

  return vector;
})());

export const memory = ($root.memory = (() => {
  /**
   * Namespace memory.
   * @exports memory
   * @namespace
   */
  const memory = {};

  memory.AppendRequest = (function () {
    /**
     * Properties of an AppendRequest.
     * @memberof memory
     * @interface IAppendRequest
     * @property {string|null} ["for"] AppendRequest for
     * @property {Array.<resource.Identifier>|null} [identifiers] AppendRequest identifiers
     */

    /**
     * Constructs a new AppendRequest.
     * @memberof memory
     * @classdesc Represents an AppendRequest.
     * @implements IAppendRequest
     * @constructor
     * @param {memory.IAppendRequest=} [properties] Properties to set
     */
    function AppendRequest(properties) {
      this.identifiers = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * AppendRequest for.
     * @member {string} for
     * @memberof memory.AppendRequest
     * @instance
     */
    AppendRequest.prototype["for"] = "";

    /**
     * AppendRequest identifiers.
     * @member {Array.<resource.Identifier>} identifiers
     * @memberof memory.AppendRequest
     * @instance
     */
    AppendRequest.prototype.identifiers = $util.emptyArray;

    /**
     * Encodes the specified AppendRequest message. Does not implicitly {@link memory.AppendRequest.verify|verify} messages.
     * @function encode
     * @memberof memory.AppendRequest
     * @static
     * @param {memory.AppendRequest} message AppendRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AppendRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message["for"] != null && Object.hasOwnProperty.call(message, "for"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message["for"]);
      if (message.identifiers != null && message.identifiers.length)
        for (let i = 0; i < message.identifiers.length; ++i)
          $root.resource.Identifier.encode(
            message.identifiers[i],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Decodes an AppendRequest message from the specified reader or buffer.
     * @function decode
     * @memberof memory.AppendRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {memory.AppendRequest} AppendRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AppendRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.memory.AppendRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message["for"] = reader.string();
            break;
          }
          case 2: {
            if (!(message.identifiers && message.identifiers.length))
              message.identifiers = [];
            message.identifiers.push(
              $root.resource.Identifier.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an AppendRequest message.
     * @function verify
     * @memberof memory.AppendRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AppendRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message["for"] != null && message.hasOwnProperty("for"))
        if (!$util.isString(message["for"])) return "for: string expected";
      if (
        message.identifiers != null &&
        message.hasOwnProperty("identifiers")
      ) {
        if (!Array.isArray(message.identifiers))
          return "identifiers: array expected";
        for (let i = 0; i < message.identifiers.length; ++i) {
          let error = $root.resource.Identifier.verify(message.identifiers[i]);
          if (error) return "identifiers." + error;
        }
      }
      return null;
    };

    /**
     * Creates an AppendRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof memory.AppendRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {memory.AppendRequest} AppendRequest
     */
    AppendRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.memory.AppendRequest) return object;
      let message = new $root.memory.AppendRequest();
      if (object["for"] != null) message["for"] = String(object["for"]);
      if (object.identifiers) {
        if (!Array.isArray(object.identifiers))
          throw TypeError(".memory.AppendRequest.identifiers: array expected");
        message.identifiers = [];
        for (let i = 0; i < object.identifiers.length; ++i) {
          if (typeof object.identifiers[i] !== "object")
            throw TypeError(
              ".memory.AppendRequest.identifiers: object expected",
            );
          message.identifiers[i] = $root.resource.Identifier.fromObject(
            object.identifiers[i],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from an AppendRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof memory.AppendRequest
     * @static
     * @param {memory.AppendRequest} message AppendRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AppendRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.identifiers = [];
      if (options.defaults) object["for"] = "";
      if (message["for"] != null && message.hasOwnProperty("for"))
        object["for"] = message["for"];
      if (message.identifiers && message.identifiers.length) {
        object.identifiers = [];
        for (let j = 0; j < message.identifiers.length; ++j)
          object.identifiers[j] = $root.resource.Identifier.toObject(
            message.identifiers[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this AppendRequest to JSON.
     * @function toJSON
     * @memberof memory.AppendRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AppendRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for AppendRequest
     * @function getTypeUrl
     * @memberof memory.AppendRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    AppendRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/memory.AppendRequest";
    };

    return AppendRequest;
  })();

  memory.AppendResponse = (function () {
    /**
     * Properties of an AppendResponse.
     * @memberof memory
     * @interface IAppendResponse
     * @property {string|null} [accepted] AppendResponse accepted
     */

    /**
     * Constructs a new AppendResponse.
     * @memberof memory
     * @classdesc Represents an AppendResponse.
     * @implements IAppendResponse
     * @constructor
     * @param {memory.IAppendResponse=} [properties] Properties to set
     */
    function AppendResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * AppendResponse accepted.
     * @member {string} accepted
     * @memberof memory.AppendResponse
     * @instance
     */
    AppendResponse.prototype.accepted = "";

    /**
     * Encodes the specified AppendResponse message. Does not implicitly {@link memory.AppendResponse.verify|verify} messages.
     * @function encode
     * @memberof memory.AppendResponse
     * @static
     * @param {memory.AppendResponse} message AppendResponse message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AppendResponse.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (
        message.accepted != null &&
        Object.hasOwnProperty.call(message, "accepted")
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.accepted);
      return writer;
    };

    /**
     * Decodes an AppendResponse message from the specified reader or buffer.
     * @function decode
     * @memberof memory.AppendResponse
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {memory.AppendResponse} AppendResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AppendResponse.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.memory.AppendResponse();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.accepted = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies an AppendResponse message.
     * @function verify
     * @memberof memory.AppendResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AppendResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.accepted != null && message.hasOwnProperty("accepted"))
        if (!$util.isString(message.accepted))
          return "accepted: string expected";
      return null;
    };

    /**
     * Creates an AppendResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof memory.AppendResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {memory.AppendResponse} AppendResponse
     */
    AppendResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.memory.AppendResponse) return object;
      let message = new $root.memory.AppendResponse();
      if (object.accepted != null) message.accepted = String(object.accepted);
      return message;
    };

    /**
     * Creates a plain object from an AppendResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof memory.AppendResponse
     * @static
     * @param {memory.AppendResponse} message AppendResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AppendResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.accepted = "";
      if (message.accepted != null && message.hasOwnProperty("accepted"))
        object.accepted = message.accepted;
      return object;
    };

    /**
     * Converts this AppendResponse to JSON.
     * @function toJSON
     * @memberof memory.AppendResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AppendResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for AppendResponse
     * @function getTypeUrl
     * @memberof memory.AppendResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    AppendResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/memory.AppendResponse";
    };

    return AppendResponse;
  })();

  memory.WindowRequest = (function () {
    /**
     * Properties of a WindowRequest.
     * @memberof memory
     * @interface IWindowRequest
     * @property {string|null} ["for"] WindowRequest for
     * @property {Array.<number>|null} [vector] WindowRequest vector
     * @property {number|null} [budget] WindowRequest budget
     * @property {memory.WindowRequest.Allocation|null} [allocation] WindowRequest allocation
     */

    /**
     * Constructs a new WindowRequest.
     * @memberof memory
     * @classdesc Represents a WindowRequest.
     * @implements IWindowRequest
     * @constructor
     * @param {memory.IWindowRequest=} [properties] Properties to set
     */
    function WindowRequest(properties) {
      this.vector = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * WindowRequest for.
     * @member {string} for
     * @memberof memory.WindowRequest
     * @instance
     */
    WindowRequest.prototype["for"] = "";

    /**
     * WindowRequest vector.
     * @member {Array.<number>} vector
     * @memberof memory.WindowRequest
     * @instance
     */
    WindowRequest.prototype.vector = $util.emptyArray;

    /**
     * WindowRequest budget.
     * @member {number} budget
     * @memberof memory.WindowRequest
     * @instance
     */
    WindowRequest.prototype.budget = 0;

    /**
     * WindowRequest allocation.
     * @member {memory.WindowRequest.Allocation|null|undefined} allocation
     * @memberof memory.WindowRequest
     * @instance
     */
    WindowRequest.prototype.allocation = null;

    /**
     * Encodes the specified WindowRequest message. Does not implicitly {@link memory.WindowRequest.verify|verify} messages.
     * @function encode
     * @memberof memory.WindowRequest
     * @static
     * @param {memory.WindowRequest} message WindowRequest message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    WindowRequest.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message["for"] != null && Object.hasOwnProperty.call(message, "for"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message["for"]);
      if (message.vector != null && message.vector.length) {
        writer.uint32(/* id 2, wireType 2 =*/ 18).fork();
        for (let i = 0; i < message.vector.length; ++i)
          writer.double(message.vector[i]);
        writer.ldelim();
      }
      if (
        message.budget != null &&
        Object.hasOwnProperty.call(message, "budget")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.budget);
      if (
        message.allocation != null &&
        Object.hasOwnProperty.call(message, "allocation")
      )
        $root.memory.WindowRequest.Allocation.encode(
          message.allocation,
          writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Decodes a WindowRequest message from the specified reader or buffer.
     * @function decode
     * @memberof memory.WindowRequest
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {memory.WindowRequest} WindowRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    WindowRequest.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.memory.WindowRequest();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message["for"] = reader.string();
            break;
          }
          case 2: {
            if (!(message.vector && message.vector.length)) message.vector = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.vector.push(reader.double());
            } else message.vector.push(reader.double());
            break;
          }
          case 3: {
            message.budget = reader.int32();
            break;
          }
          case 4: {
            message.allocation = $root.memory.WindowRequest.Allocation.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a WindowRequest message.
     * @function verify
     * @memberof memory.WindowRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    WindowRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message["for"] != null && message.hasOwnProperty("for"))
        if (!$util.isString(message["for"])) return "for: string expected";
      if (message.vector != null && message.hasOwnProperty("vector")) {
        if (!Array.isArray(message.vector)) return "vector: array expected";
        for (let i = 0; i < message.vector.length; ++i)
          if (typeof message.vector[i] !== "number")
            return "vector: number[] expected";
      }
      if (message.budget != null && message.hasOwnProperty("budget"))
        if (!$util.isInteger(message.budget)) return "budget: integer expected";
      if (message.allocation != null && message.hasOwnProperty("allocation")) {
        let error = $root.memory.WindowRequest.Allocation.verify(
          message.allocation,
        );
        if (error) return "allocation." + error;
      }
      return null;
    };

    /**
     * Creates a WindowRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof memory.WindowRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {memory.WindowRequest} WindowRequest
     */
    WindowRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.memory.WindowRequest) return object;
      let message = new $root.memory.WindowRequest();
      if (object["for"] != null) message["for"] = String(object["for"]);
      if (object.vector) {
        if (!Array.isArray(object.vector))
          throw TypeError(".memory.WindowRequest.vector: array expected");
        message.vector = [];
        for (let i = 0; i < object.vector.length; ++i)
          message.vector[i] = Number(object.vector[i]);
      }
      if (object.budget != null) message.budget = object.budget | 0;
      if (object.allocation != null) {
        if (typeof object.allocation !== "object")
          throw TypeError(".memory.WindowRequest.allocation: object expected");
        message.allocation = $root.memory.WindowRequest.Allocation.fromObject(
          object.allocation,
        );
      }
      return message;
    };

    /**
     * Creates a plain object from a WindowRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof memory.WindowRequest
     * @static
     * @param {memory.WindowRequest} message WindowRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    WindowRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.vector = [];
      if (options.defaults) {
        object["for"] = "";
        object.budget = 0;
        object.allocation = null;
      }
      if (message["for"] != null && message.hasOwnProperty("for"))
        object["for"] = message["for"];
      if (message.vector && message.vector.length) {
        object.vector = [];
        for (let j = 0; j < message.vector.length; ++j)
          object.vector[j] =
            options.json && !isFinite(message.vector[j])
              ? String(message.vector[j])
              : message.vector[j];
      }
      if (message.budget != null && message.hasOwnProperty("budget"))
        object.budget = message.budget;
      if (message.allocation != null && message.hasOwnProperty("allocation"))
        object.allocation = $root.memory.WindowRequest.Allocation.toObject(
          message.allocation,
          options,
        );
      return object;
    };

    /**
     * Converts this WindowRequest to JSON.
     * @function toJSON
     * @memberof memory.WindowRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    WindowRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for WindowRequest
     * @function getTypeUrl
     * @memberof memory.WindowRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    WindowRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/memory.WindowRequest";
    };

    WindowRequest.Allocation = (function () {
      /**
       * Properties of an Allocation.
       * @memberof memory.WindowRequest
       * @interface IAllocation
       * @property {number|null} [tools] Allocation tools
       * @property {number|null} [context] Allocation context
       * @property {number|null} [history] Allocation history
       */

      /**
       * Constructs a new Allocation.
       * @memberof memory.WindowRequest
       * @classdesc Represents an Allocation.
       * @implements IAllocation
       * @constructor
       * @param {memory.WindowRequest.IAllocation=} [properties] Properties to set
       */
      function Allocation(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
      }

      /**
       * Allocation tools.
       * @member {number} tools
       * @memberof memory.WindowRequest.Allocation
       * @instance
       */
      Allocation.prototype.tools = 0;

      /**
       * Allocation context.
       * @member {number} context
       * @memberof memory.WindowRequest.Allocation
       * @instance
       */
      Allocation.prototype.context = 0;

      /**
       * Allocation history.
       * @member {number} history
       * @memberof memory.WindowRequest.Allocation
       * @instance
       */
      Allocation.prototype.history = 0;

      /**
       * Encodes the specified Allocation message. Does not implicitly {@link memory.WindowRequest.Allocation.verify|verify} messages.
       * @function encode
       * @memberof memory.WindowRequest.Allocation
       * @static
       * @param {memory.WindowRequest.Allocation} message Allocation message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Allocation.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (
          message.tools != null &&
          Object.hasOwnProperty.call(message, "tools")
        )
          writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.tools);
        if (
          message.context != null &&
          Object.hasOwnProperty.call(message, "context")
        )
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.context);
        if (
          message.history != null &&
          Object.hasOwnProperty.call(message, "history")
        )
          writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.history);
        return writer;
      };

      /**
       * Decodes an Allocation message from the specified reader or buffer.
       * @function decode
       * @memberof memory.WindowRequest.Allocation
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {memory.WindowRequest.Allocation} Allocation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Allocation.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.memory.WindowRequest.Allocation();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.tools = reader.int32();
              break;
            }
            case 2: {
              message.context = reader.int32();
              break;
            }
            case 3: {
              message.history = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7);
              break;
          }
        }
        return message;
      };

      /**
       * Verifies an Allocation message.
       * @function verify
       * @memberof memory.WindowRequest.Allocation
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Allocation.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (message.tools != null && message.hasOwnProperty("tools"))
          if (!$util.isInteger(message.tools)) return "tools: integer expected";
        if (message.context != null && message.hasOwnProperty("context"))
          if (!$util.isInteger(message.context))
            return "context: integer expected";
        if (message.history != null && message.hasOwnProperty("history"))
          if (!$util.isInteger(message.history))
            return "history: integer expected";
        return null;
      };

      /**
       * Creates an Allocation message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof memory.WindowRequest.Allocation
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {memory.WindowRequest.Allocation} Allocation
       */
      Allocation.fromObject = function fromObject(object) {
        if (object instanceof $root.memory.WindowRequest.Allocation)
          return object;
        let message = new $root.memory.WindowRequest.Allocation();
        if (object.tools != null) message.tools = object.tools | 0;
        if (object.context != null) message.context = object.context | 0;
        if (object.history != null) message.history = object.history | 0;
        return message;
      };

      /**
       * Creates a plain object from an Allocation message. Also converts values to other types if specified.
       * @function toObject
       * @memberof memory.WindowRequest.Allocation
       * @static
       * @param {memory.WindowRequest.Allocation} message Allocation
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Allocation.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.tools = 0;
          object.context = 0;
          object.history = 0;
        }
        if (message.tools != null && message.hasOwnProperty("tools"))
          object.tools = message.tools;
        if (message.context != null && message.hasOwnProperty("context"))
          object.context = message.context;
        if (message.history != null && message.hasOwnProperty("history"))
          object.history = message.history;
        return object;
      };

      /**
       * Converts this Allocation to JSON.
       * @function toJSON
       * @memberof memory.WindowRequest.Allocation
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Allocation.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Allocation
       * @function getTypeUrl
       * @memberof memory.WindowRequest.Allocation
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Allocation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/memory.WindowRequest.Allocation";
      };

      return Allocation;
    })();

    return WindowRequest;
  })();

  memory.Window = (function () {
    /**
     * Properties of a Window.
     * @memberof memory
     * @interface IWindow
     * @property {string|null} ["for"] Window for
     * @property {Array.<resource.Identifier>|null} [tools] Window tools
     * @property {Array.<resource.Identifier>|null} [context] Window context
     * @property {Array.<resource.Identifier>|null} [history] Window history
     */

    /**
     * Constructs a new Window.
     * @memberof memory
     * @classdesc Represents a Window.
     * @implements IWindow
     * @constructor
     * @param {memory.IWindow=} [properties] Properties to set
     */
    function Window(properties) {
      this.tools = [];
      this.context = [];
      this.history = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Window for.
     * @member {string} for
     * @memberof memory.Window
     * @instance
     */
    Window.prototype["for"] = "";

    /**
     * Window tools.
     * @member {Array.<resource.Identifier>} tools
     * @memberof memory.Window
     * @instance
     */
    Window.prototype.tools = $util.emptyArray;

    /**
     * Window context.
     * @member {Array.<resource.Identifier>} context
     * @memberof memory.Window
     * @instance
     */
    Window.prototype.context = $util.emptyArray;

    /**
     * Window history.
     * @member {Array.<resource.Identifier>} history
     * @memberof memory.Window
     * @instance
     */
    Window.prototype.history = $util.emptyArray;

    /**
     * Encodes the specified Window message. Does not implicitly {@link memory.Window.verify|verify} messages.
     * @function encode
     * @memberof memory.Window
     * @static
     * @param {memory.Window} message Window message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Window.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message["for"] != null && Object.hasOwnProperty.call(message, "for"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message["for"]);
      if (message.tools != null && message.tools.length)
        for (let i = 0; i < message.tools.length; ++i)
          $root.resource.Identifier.encode(
            message.tools[i],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          ).ldelim();
      if (message.context != null && message.context.length)
        for (let i = 0; i < message.context.length; ++i)
          $root.resource.Identifier.encode(
            message.context[i],
            writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
          ).ldelim();
      if (message.history != null && message.history.length)
        for (let i = 0; i < message.history.length; ++i)
          $root.resource.Identifier.encode(
            message.history[i],
            writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Decodes a Window message from the specified reader or buffer.
     * @function decode
     * @memberof memory.Window
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {memory.Window} Window
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Window.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.memory.Window();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message["for"] = reader.string();
            break;
          }
          case 2: {
            if (!(message.tools && message.tools.length)) message.tools = [];
            message.tools.push(
              $root.resource.Identifier.decode(reader, reader.uint32()),
            );
            break;
          }
          case 3: {
            if (!(message.context && message.context.length))
              message.context = [];
            message.context.push(
              $root.resource.Identifier.decode(reader, reader.uint32()),
            );
            break;
          }
          case 4: {
            if (!(message.history && message.history.length))
              message.history = [];
            message.history.push(
              $root.resource.Identifier.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Verifies a Window message.
     * @function verify
     * @memberof memory.Window
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Window.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message["for"] != null && message.hasOwnProperty("for"))
        if (!$util.isString(message["for"])) return "for: string expected";
      if (message.tools != null && message.hasOwnProperty("tools")) {
        if (!Array.isArray(message.tools)) return "tools: array expected";
        for (let i = 0; i < message.tools.length; ++i) {
          let error = $root.resource.Identifier.verify(message.tools[i]);
          if (error) return "tools." + error;
        }
      }
      if (message.context != null && message.hasOwnProperty("context")) {
        if (!Array.isArray(message.context)) return "context: array expected";
        for (let i = 0; i < message.context.length; ++i) {
          let error = $root.resource.Identifier.verify(message.context[i]);
          if (error) return "context." + error;
        }
      }
      if (message.history != null && message.hasOwnProperty("history")) {
        if (!Array.isArray(message.history)) return "history: array expected";
        for (let i = 0; i < message.history.length; ++i) {
          let error = $root.resource.Identifier.verify(message.history[i]);
          if (error) return "history." + error;
        }
      }
      return null;
    };

    /**
     * Creates a Window message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof memory.Window
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {memory.Window} Window
     */
    Window.fromObject = function fromObject(object) {
      if (object instanceof $root.memory.Window) return object;
      let message = new $root.memory.Window();
      if (object["for"] != null) message["for"] = String(object["for"]);
      if (object.tools) {
        if (!Array.isArray(object.tools))
          throw TypeError(".memory.Window.tools: array expected");
        message.tools = [];
        for (let i = 0; i < object.tools.length; ++i) {
          if (typeof object.tools[i] !== "object")
            throw TypeError(".memory.Window.tools: object expected");
          message.tools[i] = $root.resource.Identifier.fromObject(
            object.tools[i],
          );
        }
      }
      if (object.context) {
        if (!Array.isArray(object.context))
          throw TypeError(".memory.Window.context: array expected");
        message.context = [];
        for (let i = 0; i < object.context.length; ++i) {
          if (typeof object.context[i] !== "object")
            throw TypeError(".memory.Window.context: object expected");
          message.context[i] = $root.resource.Identifier.fromObject(
            object.context[i],
          );
        }
      }
      if (object.history) {
        if (!Array.isArray(object.history))
          throw TypeError(".memory.Window.history: array expected");
        message.history = [];
        for (let i = 0; i < object.history.length; ++i) {
          if (typeof object.history[i] !== "object")
            throw TypeError(".memory.Window.history: object expected");
          message.history[i] = $root.resource.Identifier.fromObject(
            object.history[i],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a Window message. Also converts values to other types if specified.
     * @function toObject
     * @memberof memory.Window
     * @static
     * @param {memory.Window} message Window
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Window.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.tools = [];
        object.context = [];
        object.history = [];
      }
      if (options.defaults) object["for"] = "";
      if (message["for"] != null && message.hasOwnProperty("for"))
        object["for"] = message["for"];
      if (message.tools && message.tools.length) {
        object.tools = [];
        for (let j = 0; j < message.tools.length; ++j)
          object.tools[j] = $root.resource.Identifier.toObject(
            message.tools[j],
            options,
          );
      }
      if (message.context && message.context.length) {
        object.context = [];
        for (let j = 0; j < message.context.length; ++j)
          object.context[j] = $root.resource.Identifier.toObject(
            message.context[j],
            options,
          );
      }
      if (message.history && message.history.length) {
        object.history = [];
        for (let j = 0; j < message.history.length; ++j)
          object.history[j] = $root.resource.Identifier.toObject(
            message.history[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this Window to JSON.
     * @function toJSON
     * @memberof memory.Window
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Window.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Window
     * @function getTypeUrl
     * @memberof memory.Window
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Window.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/memory.Window";
    };

    return Window;
  })();

  return memory;
})());

export { $root as default };
