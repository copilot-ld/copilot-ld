/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

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
     * @classdesc Represents a Message.
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
     * @property {common.Message|null} [message] Choice message
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
     * @member {common.Message|null|undefined} message
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
        let error = $root.common.Message.verify(message.message);
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
        message.message = $root.common.Message.fromObject(object.message);
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
        object.message = $root.common.Message.toObject(
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
     * @classdesc Represents a Chunk.
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
     * @classdesc Represents a Similarity.
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
     * @classdesc Represents a Prompt.
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

  common.Resource = (function () {
    /**
     * Properties of a Resource.
     * @memberof common
     * @interface IResource
     * @property {string|null} [id] Resource id
     * @property {string|null} [name] Resource name
     * @property {string|null} [type] Resource type
     * @property {string|null} [purpose] Resource purpose
     * @property {string|null} [instructions] Resource instructions
     * @property {string|null} [applicability] Resource applicability
     * @property {string|null} [evaluation] Resource evaluation
     * @property {number|null} [tokens] Resource tokens
     * @property {number|null} [score] Resource score
     */

    /**
     * Constructs a new Resource.
     * @memberof common
     * @classdesc Represents a Resource.
     * @implements IResource
     * @constructor
     * @param {common.IResource=} [properties] Properties to set
     */
    function Resource(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Resource id.
     * @member {string} id
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.id = "";

    /**
     * Resource name.
     * @member {string} name
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.name = "";

    /**
     * Resource type.
     * @member {string} type
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.type = "";

    /**
     * Resource purpose.
     * @member {string} purpose
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.purpose = "";

    /**
     * Resource instructions.
     * @member {string} instructions
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.instructions = "";

    /**
     * Resource applicability.
     * @member {string} applicability
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.applicability = "";

    /**
     * Resource evaluation.
     * @member {string} evaluation
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.evaluation = "";

    /**
     * Resource tokens.
     * @member {number|null|undefined} tokens
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.tokens = null;

    /**
     * Resource score.
     * @member {number|null|undefined} score
     * @memberof common.Resource
     * @instance
     */
    Resource.prototype.score = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * Resource _tokens.
     * @member {"tokens"|undefined} _tokens
     * @memberof common.Resource
     * @instance
     */
    Object.defineProperty(Resource.prototype, "_tokens", {
      get: $util.oneOfGetter(($oneOfFields = ["tokens"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Resource _score.
     * @member {"score"|undefined} _score
     * @memberof common.Resource
     * @instance
     */
    Object.defineProperty(Resource.prototype, "_score", {
      get: $util.oneOfGetter(($oneOfFields = ["score"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * Verifies a Resource message.
     * @function verify
     * @memberof common.Resource
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Resource.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      let properties = {};
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isString(message.id)) return "id: string expected";
      if (message.name != null && message.hasOwnProperty("name"))
        if (!$util.isString(message.name)) return "name: string expected";
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isString(message.type)) return "type: string expected";
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
     * Creates a Resource message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof common.Resource
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {common.Resource} Resource
     */
    Resource.fromObject = function fromObject(object) {
      if (object instanceof $root.common.Resource) return object;
      let message = new $root.common.Resource();
      if (object.id != null) message.id = String(object.id);
      if (object.name != null) message.name = String(object.name);
      if (object.type != null) message.type = String(object.type);
      if (object.purpose != null) message.purpose = String(object.purpose);
      if (object.instructions != null)
        message.instructions = String(object.instructions);
      if (object.applicability != null)
        message.applicability = String(object.applicability);
      if (object.evaluation != null)
        message.evaluation = String(object.evaluation);
      if (object.tokens != null) message.tokens = object.tokens | 0;
      if (object.score != null) message.score = Number(object.score);
      return message;
    };

    /**
     * Creates a plain object from a Resource message. Also converts values to other types if specified.
     * @function toObject
     * @memberof common.Resource
     * @static
     * @param {common.Resource} message Resource
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Resource.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = "";
        object.name = "";
        object.type = "";
        object.purpose = "";
        object.instructions = "";
        object.applicability = "";
        object.evaluation = "";
      }
      if (message.id != null && message.hasOwnProperty("id"))
        object.id = message.id;
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = message.type;
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
     * Converts this Resource to JSON.
     * @function toJSON
     * @memberof common.Resource
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Resource.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Resource
     * @function getTypeUrl
     * @memberof common.Resource
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Resource.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/common.Resource";
    };

    return Resource;
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
     * @property {common.Resource|null} [meta] ToolFunction meta
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
     * ToolFunction meta.
     * @member {common.Resource|null|undefined} meta
     * @memberof common.ToolFunction
     * @instance
     */
    ToolFunction.prototype.meta = null;

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
      if (message.meta != null && message.hasOwnProperty("meta")) {
        let error = $root.common.Resource.verify(message.meta);
        if (error) return "meta." + error;
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
      if (object.meta != null) {
        if (typeof object.meta !== "object")
          throw TypeError(".common.ToolFunction.meta: object expected");
        message.meta = $root.common.Resource.fromObject(object.meta);
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
      if (options.defaults) object.meta = null;
      if (message.meta != null && message.hasOwnProperty("meta"))
        object.meta = $root.common.Resource.toObject(message.meta, options);
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

  common.MessageV2 = (function () {
    /**
     * Properties of a MessageV2.
     * @memberof common
     * @interface IMessageV2
     * @property {common.Resource|null} [meta] MessageV2 meta
     * @property {string|null} [role] MessageV2 role
     * @property {string|null} [content] MessageV2 content
     * @property {Array.<common.Tool>|null} [tool_calls] MessageV2 tool_calls
     * @property {string|null} [tool_call_id] MessageV2 tool_call_id
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
      this.tool_calls = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * MessageV2 meta.
     * @member {common.Resource|null|undefined} meta
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.meta = null;

    /**
     * MessageV2 role.
     * @member {string} role
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.role = "";

    /**
     * MessageV2 content.
     * @member {string|null|undefined} content
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.content = null;

    /**
     * MessageV2 tool_calls.
     * @member {Array.<common.Tool>} tool_calls
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.tool_calls = $util.emptyArray;

    /**
     * MessageV2 tool_call_id.
     * @member {string|null|undefined} tool_call_id
     * @memberof common.MessageV2
     * @instance
     */
    MessageV2.prototype.tool_call_id = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * MessageV2 _content.
     * @member {"content"|undefined} _content
     * @memberof common.MessageV2
     * @instance
     */
    Object.defineProperty(MessageV2.prototype, "_content", {
      get: $util.oneOfGetter(($oneOfFields = ["content"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * MessageV2 _tool_call_id.
     * @member {"tool_call_id"|undefined} _tool_call_id
     * @memberof common.MessageV2
     * @instance
     */
    Object.defineProperty(MessageV2.prototype, "_tool_call_id", {
      get: $util.oneOfGetter(($oneOfFields = ["tool_call_id"])),
      set: $util.oneOfSetter($oneOfFields),
    });

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
      let properties = {};
      if (message.meta != null && message.hasOwnProperty("meta")) {
        let error = $root.common.Resource.verify(message.meta);
        if (error) return "meta." + error;
      }
      if (message.role != null && message.hasOwnProperty("role"))
        if (!$util.isString(message.role)) return "role: string expected";
      if (message.content != null && message.hasOwnProperty("content")) {
        properties._content = 1;
        if (!$util.isString(message.content)) return "content: string expected";
      }
      if (message.tool_calls != null && message.hasOwnProperty("tool_calls")) {
        if (!Array.isArray(message.tool_calls))
          return "tool_calls: array expected";
        for (let i = 0; i < message.tool_calls.length; ++i) {
          let error = $root.common.Tool.verify(message.tool_calls[i]);
          if (error) return "tool_calls." + error;
        }
      }
      if (
        message.tool_call_id != null &&
        message.hasOwnProperty("tool_call_id")
      ) {
        properties._tool_call_id = 1;
        if (!$util.isString(message.tool_call_id))
          return "tool_call_id: string expected";
      }
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
      if (object.meta != null) {
        if (typeof object.meta !== "object")
          throw TypeError(".common.MessageV2.meta: object expected");
        message.meta = $root.common.Resource.fromObject(object.meta);
      }
      if (object.role != null) message.role = String(object.role);
      if (object.content != null) message.content = String(object.content);
      if (object.tool_calls) {
        if (!Array.isArray(object.tool_calls))
          throw TypeError(".common.MessageV2.tool_calls: array expected");
        message.tool_calls = [];
        for (let i = 0; i < object.tool_calls.length; ++i) {
          if (typeof object.tool_calls[i] !== "object")
            throw TypeError(".common.MessageV2.tool_calls: object expected");
          message.tool_calls[i] = $root.common.Tool.fromObject(
            object.tool_calls[i],
          );
        }
      }
      if (object.tool_call_id != null)
        message.tool_call_id = String(object.tool_call_id);
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
      if (options.arrays || options.defaults) object.tool_calls = [];
      if (options.defaults) {
        object.meta = null;
        object.role = "";
      }
      if (message.meta != null && message.hasOwnProperty("meta"))
        object.meta = $root.common.Resource.toObject(message.meta, options);
      if (message.role != null && message.hasOwnProperty("role"))
        object.role = message.role;
      if (message.content != null && message.hasOwnProperty("content")) {
        object.content = message.content;
        if (options.oneofs) object._content = "content";
      }
      if (message.tool_calls && message.tool_calls.length) {
        object.tool_calls = [];
        for (let j = 0; j < message.tool_calls.length; ++j)
          object.tool_calls[j] = $root.common.Tool.toObject(
            message.tool_calls[j],
            options,
          );
      }
      if (
        message.tool_call_id != null &&
        message.hasOwnProperty("tool_call_id")
      ) {
        object.tool_call_id = message.tool_call_id;
        if (options.oneofs) object._tool_call_id = "tool_call_id";
      }
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
     * @property {Array.<common.Message>|null} [messages] AgentRequest messages
     * @property {string|null} [session_id] AgentRequest session_id
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
     * @member {Array.<common.Message>} messages
     * @memberof agent.AgentRequest
     * @instance
     */
    AgentRequest.prototype.messages = $util.emptyArray;

    /**
     * AgentRequest session_id.
     * @member {string|null|undefined} session_id
     * @memberof agent.AgentRequest
     * @instance
     */
    AgentRequest.prototype.session_id = null;

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
     * AgentRequest _session_id.
     * @member {"session_id"|undefined} _session_id
     * @memberof agent.AgentRequest
     * @instance
     */
    Object.defineProperty(AgentRequest.prototype, "_session_id", {
      get: $util.oneOfGetter(($oneOfFields = ["session_id"])),
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
          let error = $root.common.Message.verify(message.messages[i]);
          if (error) return "messages." + error;
        }
      }
      if (message.session_id != null && message.hasOwnProperty("session_id")) {
        properties._session_id = 1;
        if (!$util.isString(message.session_id))
          return "session_id: string expected";
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
          message.messages[i] = $root.common.Message.fromObject(
            object.messages[i],
          );
        }
      }
      if (object.session_id != null)
        message.session_id = String(object.session_id);
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
          object.messages[j] = $root.common.Message.toObject(
            message.messages[j],
            options,
          );
      }
      if (message.session_id != null && message.hasOwnProperty("session_id")) {
        object.session_id = message.session_id;
        if (options.oneofs) object._session_id = "session_id";
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
     * @property {string|null} [session_id] AgentResponse session_id
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
     * AgentResponse session_id.
     * @member {string} session_id
     * @memberof agent.AgentResponse
     * @instance
     */
    AgentResponse.prototype.session_id = "";

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
      if (message.session_id != null && message.hasOwnProperty("session_id"))
        if (!$util.isString(message.session_id))
          return "session_id: string expected";
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
      if (object.session_id != null)
        message.session_id = String(object.session_id);
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
        object.session_id = "";
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
      if (message.session_id != null && message.hasOwnProperty("session_id"))
        object.session_id = message.session_id;
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

export const history = ($root.history = (() => {
  /**
   * Namespace history.
   * @exports history
   * @namespace
   */
  const history = {};

  history.GetHistoryRequest = (function () {
    /**
     * Properties of a GetHistoryRequest.
     * @memberof history
     * @interface IGetHistoryRequest
     * @property {string|null} [session_id] GetHistoryRequest session_id
     */

    /**
     * Constructs a new GetHistoryRequest.
     * @memberof history
     * @classdesc Represents a GetHistoryRequest.
     * @implements IGetHistoryRequest
     * @constructor
     * @param {history.IGetHistoryRequest=} [properties] Properties to set
     */
    function GetHistoryRequest(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GetHistoryRequest session_id.
     * @member {string} session_id
     * @memberof history.GetHistoryRequest
     * @instance
     */
    GetHistoryRequest.prototype.session_id = "";

    /**
     * Verifies a GetHistoryRequest message.
     * @function verify
     * @memberof history.GetHistoryRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GetHistoryRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.session_id != null && message.hasOwnProperty("session_id"))
        if (!$util.isString(message.session_id))
          return "session_id: string expected";
      return null;
    };

    /**
     * Creates a GetHistoryRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof history.GetHistoryRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {history.GetHistoryRequest} GetHistoryRequest
     */
    GetHistoryRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.history.GetHistoryRequest) return object;
      let message = new $root.history.GetHistoryRequest();
      if (object.session_id != null)
        message.session_id = String(object.session_id);
      return message;
    };

    /**
     * Creates a plain object from a GetHistoryRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof history.GetHistoryRequest
     * @static
     * @param {history.GetHistoryRequest} message GetHistoryRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GetHistoryRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.session_id = "";
      if (message.session_id != null && message.hasOwnProperty("session_id"))
        object.session_id = message.session_id;
      return object;
    };

    /**
     * Converts this GetHistoryRequest to JSON.
     * @function toJSON
     * @memberof history.GetHistoryRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GetHistoryRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GetHistoryRequest
     * @function getTypeUrl
     * @memberof history.GetHistoryRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GetHistoryRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/history.GetHistoryRequest";
    };

    return GetHistoryRequest;
  })();

  history.GetHistoryResponse = (function () {
    /**
     * Properties of a GetHistoryResponse.
     * @memberof history
     * @interface IGetHistoryResponse
     * @property {common.Prompt|null} [prompt] GetHistoryResponse prompt
     */

    /**
     * Constructs a new GetHistoryResponse.
     * @memberof history
     * @classdesc Represents a GetHistoryResponse.
     * @implements IGetHistoryResponse
     * @constructor
     * @param {history.IGetHistoryResponse=} [properties] Properties to set
     */
    function GetHistoryResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GetHistoryResponse prompt.
     * @member {common.Prompt|null|undefined} prompt
     * @memberof history.GetHistoryResponse
     * @instance
     */
    GetHistoryResponse.prototype.prompt = null;

    /**
     * Verifies a GetHistoryResponse message.
     * @function verify
     * @memberof history.GetHistoryResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GetHistoryResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.prompt != null && message.hasOwnProperty("prompt")) {
        let error = $root.common.Prompt.verify(message.prompt);
        if (error) return "prompt." + error;
      }
      return null;
    };

    /**
     * Creates a GetHistoryResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof history.GetHistoryResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {history.GetHistoryResponse} GetHistoryResponse
     */
    GetHistoryResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.history.GetHistoryResponse) return object;
      let message = new $root.history.GetHistoryResponse();
      if (object.prompt != null) {
        if (typeof object.prompt !== "object")
          throw TypeError(
            ".history.GetHistoryResponse.prompt: object expected",
          );
        message.prompt = $root.common.Prompt.fromObject(object.prompt);
      }
      return message;
    };

    /**
     * Creates a plain object from a GetHistoryResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof history.GetHistoryResponse
     * @static
     * @param {history.GetHistoryResponse} message GetHistoryResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GetHistoryResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.prompt = null;
      if (message.prompt != null && message.hasOwnProperty("prompt"))
        object.prompt = $root.common.Prompt.toObject(message.prompt, options);
      return object;
    };

    /**
     * Converts this GetHistoryResponse to JSON.
     * @function toJSON
     * @memberof history.GetHistoryResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GetHistoryResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GetHistoryResponse
     * @function getTypeUrl
     * @memberof history.GetHistoryResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GetHistoryResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/history.GetHistoryResponse";
    };

    return GetHistoryResponse;
  })();

  history.UpdateHistoryRequest = (function () {
    /**
     * Properties of an UpdateHistoryRequest.
     * @memberof history
     * @interface IUpdateHistoryRequest
     * @property {string|null} [session_id] UpdateHistoryRequest session_id
     * @property {common.Prompt|null} [prompt] UpdateHistoryRequest prompt
     * @property {string|null} [github_token] UpdateHistoryRequest github_token
     */

    /**
     * Constructs a new UpdateHistoryRequest.
     * @memberof history
     * @classdesc Represents an UpdateHistoryRequest.
     * @implements IUpdateHistoryRequest
     * @constructor
     * @param {history.IUpdateHistoryRequest=} [properties] Properties to set
     */
    function UpdateHistoryRequest(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * UpdateHistoryRequest session_id.
     * @member {string} session_id
     * @memberof history.UpdateHistoryRequest
     * @instance
     */
    UpdateHistoryRequest.prototype.session_id = "";

    /**
     * UpdateHistoryRequest prompt.
     * @member {common.Prompt|null|undefined} prompt
     * @memberof history.UpdateHistoryRequest
     * @instance
     */
    UpdateHistoryRequest.prototype.prompt = null;

    /**
     * UpdateHistoryRequest github_token.
     * @member {string} github_token
     * @memberof history.UpdateHistoryRequest
     * @instance
     */
    UpdateHistoryRequest.prototype.github_token = "";

    /**
     * Verifies an UpdateHistoryRequest message.
     * @function verify
     * @memberof history.UpdateHistoryRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UpdateHistoryRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.session_id != null && message.hasOwnProperty("session_id"))
        if (!$util.isString(message.session_id))
          return "session_id: string expected";
      if (message.prompt != null && message.hasOwnProperty("prompt")) {
        let error = $root.common.Prompt.verify(message.prompt);
        if (error) return "prompt." + error;
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
     * Creates an UpdateHistoryRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof history.UpdateHistoryRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {history.UpdateHistoryRequest} UpdateHistoryRequest
     */
    UpdateHistoryRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.history.UpdateHistoryRequest) return object;
      let message = new $root.history.UpdateHistoryRequest();
      if (object.session_id != null)
        message.session_id = String(object.session_id);
      if (object.prompt != null) {
        if (typeof object.prompt !== "object")
          throw TypeError(
            ".history.UpdateHistoryRequest.prompt: object expected",
          );
        message.prompt = $root.common.Prompt.fromObject(object.prompt);
      }
      if (object.github_token != null)
        message.github_token = String(object.github_token);
      return message;
    };

    /**
     * Creates a plain object from an UpdateHistoryRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof history.UpdateHistoryRequest
     * @static
     * @param {history.UpdateHistoryRequest} message UpdateHistoryRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UpdateHistoryRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.session_id = "";
        object.prompt = null;
        object.github_token = "";
      }
      if (message.session_id != null && message.hasOwnProperty("session_id"))
        object.session_id = message.session_id;
      if (message.prompt != null && message.hasOwnProperty("prompt"))
        object.prompt = $root.common.Prompt.toObject(message.prompt, options);
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      )
        object.github_token = message.github_token;
      return object;
    };

    /**
     * Converts this UpdateHistoryRequest to JSON.
     * @function toJSON
     * @memberof history.UpdateHistoryRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UpdateHistoryRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UpdateHistoryRequest
     * @function getTypeUrl
     * @memberof history.UpdateHistoryRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UpdateHistoryRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/history.UpdateHistoryRequest";
    };

    return UpdateHistoryRequest;
  })();

  history.UpdateHistoryResponse = (function () {
    /**
     * Properties of an UpdateHistoryResponse.
     * @memberof history
     * @interface IUpdateHistoryResponse
     * @property {boolean|null} [success] UpdateHistoryResponse success
     * @property {boolean|null} [optimized] UpdateHistoryResponse optimized
     */

    /**
     * Constructs a new UpdateHistoryResponse.
     * @memberof history
     * @classdesc Represents an UpdateHistoryResponse.
     * @implements IUpdateHistoryResponse
     * @constructor
     * @param {history.IUpdateHistoryResponse=} [properties] Properties to set
     */
    function UpdateHistoryResponse(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * UpdateHistoryResponse success.
     * @member {boolean} success
     * @memberof history.UpdateHistoryResponse
     * @instance
     */
    UpdateHistoryResponse.prototype.success = false;

    /**
     * UpdateHistoryResponse optimized.
     * @member {boolean} optimized
     * @memberof history.UpdateHistoryResponse
     * @instance
     */
    UpdateHistoryResponse.prototype.optimized = false;

    /**
     * Verifies an UpdateHistoryResponse message.
     * @function verify
     * @memberof history.UpdateHistoryResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UpdateHistoryResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.success != null && message.hasOwnProperty("success"))
        if (typeof message.success !== "boolean")
          return "success: boolean expected";
      if (message.optimized != null && message.hasOwnProperty("optimized"))
        if (typeof message.optimized !== "boolean")
          return "optimized: boolean expected";
      return null;
    };

    /**
     * Creates an UpdateHistoryResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof history.UpdateHistoryResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {history.UpdateHistoryResponse} UpdateHistoryResponse
     */
    UpdateHistoryResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.history.UpdateHistoryResponse) return object;
      let message = new $root.history.UpdateHistoryResponse();
      if (object.success != null) message.success = Boolean(object.success);
      if (object.optimized != null)
        message.optimized = Boolean(object.optimized);
      return message;
    };

    /**
     * Creates a plain object from an UpdateHistoryResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof history.UpdateHistoryResponse
     * @static
     * @param {history.UpdateHistoryResponse} message UpdateHistoryResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UpdateHistoryResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.success = false;
        object.optimized = false;
      }
      if (message.success != null && message.hasOwnProperty("success"))
        object.success = message.success;
      if (message.optimized != null && message.hasOwnProperty("optimized"))
        object.optimized = message.optimized;
      return object;
    };

    /**
     * Converts this UpdateHistoryResponse to JSON.
     * @function toJSON
     * @memberof history.UpdateHistoryResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UpdateHistoryResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UpdateHistoryResponse
     * @function getTypeUrl
     * @memberof history.UpdateHistoryResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UpdateHistoryResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/history.UpdateHistoryResponse";
    };

    return UpdateHistoryResponse;
  })();

  return history;
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
     * @property {common.Prompt|null} [prompt] CompletionsRequest prompt
     * @property {string|null} [github_token] CompletionsRequest github_token
     * @property {number|null} [temperature] CompletionsRequest temperature
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
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * CompletionsRequest prompt.
     * @member {common.Prompt|null|undefined} prompt
     * @memberof llm.CompletionsRequest
     * @instance
     */
    CompletionsRequest.prototype.prompt = null;

    /**
     * CompletionsRequest github_token.
     * @member {string} github_token
     * @memberof llm.CompletionsRequest
     * @instance
     */
    CompletionsRequest.prototype.github_token = "";

    /**
     * CompletionsRequest temperature.
     * @member {number|null|undefined} temperature
     * @memberof llm.CompletionsRequest
     * @instance
     */
    CompletionsRequest.prototype.temperature = null;

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
      if (message.prompt != null && message.hasOwnProperty("prompt")) {
        let error = $root.common.Prompt.verify(message.prompt);
        if (error) return "prompt." + error;
      }
      if (
        message.github_token != null &&
        message.hasOwnProperty("github_token")
      )
        if (!$util.isString(message.github_token))
          return "github_token: string expected";
      if (
        message.temperature != null &&
        message.hasOwnProperty("temperature")
      ) {
        properties._temperature = 1;
        if (typeof message.temperature !== "number")
          return "temperature: number expected";
      }
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
      if (object.prompt != null) {
        if (typeof object.prompt !== "object")
          throw TypeError(".llm.CompletionsRequest.prompt: object expected");
        message.prompt = $root.common.Prompt.fromObject(object.prompt);
      }
      if (object.github_token != null)
        message.github_token = String(object.github_token);
      if (object.temperature != null)
        message.temperature = Number(object.temperature);
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
      if (options.defaults) {
        object.prompt = null;
        object.github_token = "";
      }
      if (message.prompt != null && message.hasOwnProperty("prompt"))
        object.prompt = $root.common.Prompt.toObject(message.prompt, options);
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

export const text = ($root.text = (() => {
  /**
   * Namespace text.
   * @exports text
   * @namespace
   */
  const text = {};

  text.GetChunksRequest = (function () {
    /**
     * Properties of a GetChunksRequest.
     * @memberof text
     * @interface IGetChunksRequest
     * @property {Array.<string>|null} [ids] GetChunksRequest ids
     */

    /**
     * Constructs a new GetChunksRequest.
     * @memberof text
     * @classdesc Represents a GetChunksRequest.
     * @implements IGetChunksRequest
     * @constructor
     * @param {text.IGetChunksRequest=} [properties] Properties to set
     */
    function GetChunksRequest(properties) {
      this.ids = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GetChunksRequest ids.
     * @member {Array.<string>} ids
     * @memberof text.GetChunksRequest
     * @instance
     */
    GetChunksRequest.prototype.ids = $util.emptyArray;

    /**
     * Verifies a GetChunksRequest message.
     * @function verify
     * @memberof text.GetChunksRequest
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GetChunksRequest.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.ids != null && message.hasOwnProperty("ids")) {
        if (!Array.isArray(message.ids)) return "ids: array expected";
        for (let i = 0; i < message.ids.length; ++i)
          if (!$util.isString(message.ids[i])) return "ids: string[] expected";
      }
      return null;
    };

    /**
     * Creates a GetChunksRequest message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof text.GetChunksRequest
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {text.GetChunksRequest} GetChunksRequest
     */
    GetChunksRequest.fromObject = function fromObject(object) {
      if (object instanceof $root.text.GetChunksRequest) return object;
      let message = new $root.text.GetChunksRequest();
      if (object.ids) {
        if (!Array.isArray(object.ids))
          throw TypeError(".text.GetChunksRequest.ids: array expected");
        message.ids = [];
        for (let i = 0; i < object.ids.length; ++i)
          message.ids[i] = String(object.ids[i]);
      }
      return message;
    };

    /**
     * Creates a plain object from a GetChunksRequest message. Also converts values to other types if specified.
     * @function toObject
     * @memberof text.GetChunksRequest
     * @static
     * @param {text.GetChunksRequest} message GetChunksRequest
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GetChunksRequest.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.ids = [];
      if (message.ids && message.ids.length) {
        object.ids = [];
        for (let j = 0; j < message.ids.length; ++j)
          object.ids[j] = message.ids[j];
      }
      return object;
    };

    /**
     * Converts this GetChunksRequest to JSON.
     * @function toJSON
     * @memberof text.GetChunksRequest
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GetChunksRequest.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GetChunksRequest
     * @function getTypeUrl
     * @memberof text.GetChunksRequest
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GetChunksRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/text.GetChunksRequest";
    };

    return GetChunksRequest;
  })();

  text.GetChunksResponse = (function () {
    /**
     * Properties of a GetChunksResponse.
     * @memberof text
     * @interface IGetChunksResponse
     * @property {Object.<string,common.Chunk>|null} [chunks] GetChunksResponse chunks
     */

    /**
     * Constructs a new GetChunksResponse.
     * @memberof text
     * @classdesc Represents a GetChunksResponse.
     * @implements IGetChunksResponse
     * @constructor
     * @param {text.IGetChunksResponse=} [properties] Properties to set
     */
    function GetChunksResponse(properties) {
      this.chunks = {};
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GetChunksResponse chunks.
     * @member {Object.<string,common.Chunk>} chunks
     * @memberof text.GetChunksResponse
     * @instance
     */
    GetChunksResponse.prototype.chunks = $util.emptyObject;

    /**
     * Verifies a GetChunksResponse message.
     * @function verify
     * @memberof text.GetChunksResponse
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GetChunksResponse.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.chunks != null && message.hasOwnProperty("chunks")) {
        if (!$util.isObject(message.chunks)) return "chunks: object expected";
        let key = Object.keys(message.chunks);
        for (let i = 0; i < key.length; ++i) {
          let error = $root.common.Chunk.verify(message.chunks[key[i]]);
          if (error) return "chunks." + error;
        }
      }
      return null;
    };

    /**
     * Creates a GetChunksResponse message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof text.GetChunksResponse
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {text.GetChunksResponse} GetChunksResponse
     */
    GetChunksResponse.fromObject = function fromObject(object) {
      if (object instanceof $root.text.GetChunksResponse) return object;
      let message = new $root.text.GetChunksResponse();
      if (object.chunks) {
        if (typeof object.chunks !== "object")
          throw TypeError(".text.GetChunksResponse.chunks: object expected");
        message.chunks = {};
        for (
          let keys = Object.keys(object.chunks), i = 0;
          i < keys.length;
          ++i
        ) {
          if (typeof object.chunks[keys[i]] !== "object")
            throw TypeError(".text.GetChunksResponse.chunks: object expected");
          message.chunks[keys[i]] = $root.common.Chunk.fromObject(
            object.chunks[keys[i]],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a GetChunksResponse message. Also converts values to other types if specified.
     * @function toObject
     * @memberof text.GetChunksResponse
     * @static
     * @param {text.GetChunksResponse} message GetChunksResponse
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GetChunksResponse.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.objects || options.defaults) object.chunks = {};
      let keys2;
      if (message.chunks && (keys2 = Object.keys(message.chunks)).length) {
        object.chunks = {};
        for (let j = 0; j < keys2.length; ++j)
          object.chunks[keys2[j]] = $root.common.Chunk.toObject(
            message.chunks[keys2[j]],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this GetChunksResponse to JSON.
     * @function toJSON
     * @memberof text.GetChunksResponse
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GetChunksResponse.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GetChunksResponse
     * @function getTypeUrl
     * @memberof text.GetChunksResponse
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GetChunksResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/text.GetChunksResponse";
    };

    return GetChunksResponse;
  })();

  return text;
})());

export const vector = ($root.vector = (() => {
  /**
   * Namespace vector.
   * @exports vector
   * @namespace
   */
  const vector = {};

  vector.QueryItemsRequest = (function () {
    /**
     * Properties of a QueryItemsRequest.
     * @memberof vector
     * @interface IQueryItemsRequest
     * @property {Array.<number>|null} [vector] QueryItemsRequest vector
     * @property {number|null} [threshold] QueryItemsRequest threshold
     * @property {number|null} [limit] QueryItemsRequest limit
     * @property {number|null} [max_tokens] QueryItemsRequest max_tokens
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
     * QueryItemsRequest vector.
     * @member {Array.<number>} vector
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.vector = $util.emptyArray;

    /**
     * QueryItemsRequest threshold.
     * @member {number|null|undefined} threshold
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.threshold = null;

    /**
     * QueryItemsRequest limit.
     * @member {number|null|undefined} limit
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.limit = null;

    /**
     * QueryItemsRequest max_tokens.
     * @member {number|null|undefined} max_tokens
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    QueryItemsRequest.prototype.max_tokens = null;

    // OneOf field names bound to virtual getters and setters
    let $oneOfFields;

    /**
     * QueryItemsRequest _threshold.
     * @member {"threshold"|undefined} _threshold
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    Object.defineProperty(QueryItemsRequest.prototype, "_threshold", {
      get: $util.oneOfGetter(($oneOfFields = ["threshold"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * QueryItemsRequest _limit.
     * @member {"limit"|undefined} _limit
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    Object.defineProperty(QueryItemsRequest.prototype, "_limit", {
      get: $util.oneOfGetter(($oneOfFields = ["limit"])),
      set: $util.oneOfSetter($oneOfFields),
    });

    /**
     * QueryItemsRequest _max_tokens.
     * @member {"max_tokens"|undefined} _max_tokens
     * @memberof vector.QueryItemsRequest
     * @instance
     */
    Object.defineProperty(QueryItemsRequest.prototype, "_max_tokens", {
      get: $util.oneOfGetter(($oneOfFields = ["max_tokens"])),
      set: $util.oneOfSetter($oneOfFields),
    });

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
      if (message.vector != null && message.hasOwnProperty("vector")) {
        if (!Array.isArray(message.vector)) return "vector: array expected";
        for (let i = 0; i < message.vector.length; ++i)
          if (typeof message.vector[i] !== "number")
            return "vector: number[] expected";
      }
      if (message.threshold != null && message.hasOwnProperty("threshold")) {
        properties._threshold = 1;
        if (typeof message.threshold !== "number")
          return "threshold: number expected";
      }
      if (message.limit != null && message.hasOwnProperty("limit")) {
        properties._limit = 1;
        if (!$util.isInteger(message.limit)) return "limit: integer expected";
      }
      if (message.max_tokens != null && message.hasOwnProperty("max_tokens")) {
        properties._max_tokens = 1;
        if (!$util.isInteger(message.max_tokens))
          return "max_tokens: integer expected";
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
      if (object.vector) {
        if (!Array.isArray(object.vector))
          throw TypeError(".vector.QueryItemsRequest.vector: array expected");
        message.vector = [];
        for (let i = 0; i < object.vector.length; ++i)
          message.vector[i] = Number(object.vector[i]);
      }
      if (object.threshold != null)
        message.threshold = Number(object.threshold);
      if (object.limit != null) message.limit = object.limit | 0;
      if (object.max_tokens != null) message.max_tokens = object.max_tokens | 0;
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
      if (message.vector && message.vector.length) {
        object.vector = [];
        for (let j = 0; j < message.vector.length; ++j)
          object.vector[j] =
            options.json && !isFinite(message.vector[j])
              ? String(message.vector[j])
              : message.vector[j];
      }
      if (message.threshold != null && message.hasOwnProperty("threshold")) {
        object.threshold =
          options.json && !isFinite(message.threshold)
            ? String(message.threshold)
            : message.threshold;
        if (options.oneofs) object._threshold = "threshold";
      }
      if (message.limit != null && message.hasOwnProperty("limit")) {
        object.limit = message.limit;
        if (options.oneofs) object._limit = "limit";
      }
      if (message.max_tokens != null && message.hasOwnProperty("max_tokens")) {
        object.max_tokens = message.max_tokens;
        if (options.oneofs) object._max_tokens = "max_tokens";
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
     * @property {Array.<common.Similarity>|null} [results] QueryItemsResponse results
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
      this.results = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * QueryItemsResponse results.
     * @member {Array.<common.Similarity>} results
     * @memberof vector.QueryItemsResponse
     * @instance
     */
    QueryItemsResponse.prototype.results = $util.emptyArray;

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
      if (message.results != null && message.hasOwnProperty("results")) {
        if (!Array.isArray(message.results)) return "results: array expected";
        for (let i = 0; i < message.results.length; ++i) {
          let error = $root.common.Similarity.verify(message.results[i]);
          if (error) return "results." + error;
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
      if (object.results) {
        if (!Array.isArray(object.results))
          throw TypeError(".vector.QueryItemsResponse.results: array expected");
        message.results = [];
        for (let i = 0; i < object.results.length; ++i) {
          if (typeof object.results[i] !== "object")
            throw TypeError(
              ".vector.QueryItemsResponse.results: object expected",
            );
          message.results[i] = $root.common.Similarity.fromObject(
            object.results[i],
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
      if (options.arrays || options.defaults) object.results = [];
      if (message.results && message.results.length) {
        object.results = [];
        for (let j = 0; j < message.results.length; ++j)
          object.results[j] = $root.common.Similarity.toObject(
            message.results[j],
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

  return vector;
})());

export { $root as default };
