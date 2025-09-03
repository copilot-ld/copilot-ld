import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace resource. */
export namespace resource {
  /** Properties of an Identifier. */
  interface IIdentifier {
    /** Identifier type */
    type?: string | null;

    /** Identifier name */
    name?: string | null;

    /** Identifier parent */
    parent?: string | null;

    /** Identifier tokens */
    tokens?: number | null;

    /** Identifier score */
    score?: number | null;
  }

  /** Represents an Identifier. */
  class Identifier implements IIdentifier {
    /**
     * Constructs a new Identifier.
     * @param [properties] Properties to set
     */
    constructor(properties?: resource.IIdentifier);

    /** Identifier type. */
    public type: string;

    /** Identifier name. */
    public name: string;

    /** Identifier parent. */
    public parent: string;

    /** Identifier tokens. */
    public tokens?: number | null;

    /** Identifier score. */
    public score?: number | null;

    /** Identifier _tokens. */
    public _tokens?: "tokens";

    /** Identifier _score. */
    public _score?: "score";

    /**
     * Encodes the specified Identifier message. Does not implicitly {@link resource.Identifier.verify|verify} messages.
     * @param message Identifier message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: resource.Identifier,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an Identifier message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Identifier
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): resource.Identifier;

    /**
     * Verifies an Identifier message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an Identifier message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Identifier
     */
    public static fromObject(object: { [k: string]: any }): resource.Identifier;

    /**
     * Creates a plain object from an Identifier message. Also converts values to other types if specified.
     * @param message Identifier
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: resource.Identifier,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Identifier to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Identifier
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Descriptor. */
  interface IDescriptor {
    /** Descriptor tokens */
    tokens?: number | null;

    /** Descriptor purpose */
    purpose?: string | null;

    /** Descriptor instructions */
    instructions?: string | null;

    /** Descriptor applicability */
    applicability?: string | null;

    /** Descriptor evaluation */
    evaluation?: string | null;
  }

  /** Resource descriptor representation */
  class Descriptor implements IDescriptor {
    /**
     * Constructs a new Descriptor.
     * @param [properties] Properties to set
     */
    constructor(properties?: resource.IDescriptor);

    /** Descriptor tokens. */
    public tokens: number;

    /** Descriptor purpose. */
    public purpose: string;

    /** Descriptor instructions. */
    public instructions: string;

    /** Descriptor applicability. */
    public applicability: string;

    /** Descriptor evaluation. */
    public evaluation: string;

    /**
     * Encodes the specified Descriptor message. Does not implicitly {@link resource.Descriptor.verify|verify} messages.
     * @param message Descriptor message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: resource.Descriptor,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Descriptor message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Descriptor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): resource.Descriptor;

    /**
     * Verifies a Descriptor message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Descriptor message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Descriptor
     */
    public static fromObject(object: { [k: string]: any }): resource.Descriptor;

    /**
     * Creates a plain object from a Descriptor message. Also converts values to other types if specified.
     * @param message Descriptor
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: resource.Descriptor,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Descriptor to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Descriptor
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Content. */
  interface IContent {
    /** Content tokens */
    tokens?: number | null;

    /** Content text */
    text?: string | null;

    /** Content jsonld */
    jsonld?: string | null;
  }

  /** Resource content representation */
  class Content implements IContent {
    /**
     * Constructs a new Content.
     * @param [properties] Properties to set
     */
    constructor(properties?: resource.IContent);

    /** Content tokens. */
    public tokens: number;

    /** Content text. */
    public text?: string | null;

    /** Content jsonld. */
    public jsonld?: string | null;

    /** Content type. */
    public type?: "text" | "jsonld";

    /**
     * Encodes the specified Content message. Does not implicitly {@link resource.Content.verify|verify} messages.
     * @param message Content message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: resource.Content,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Content message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Content
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): resource.Content;

    /**
     * Verifies a Content message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Content message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Content
     */
    public static fromObject(object: { [k: string]: any }): resource.Content;

    /**
     * Creates a plain object from a Content message. Also converts values to other types if specified.
     * @param message Content
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: resource.Content,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Content to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Content
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

/** Namespace common. */
export namespace common {
  /** Properties of a Message. */
  interface IMessage {
    /** Message role */
    role?: string | null;

    /** Message content */
    content?: string | null;
  }

  /** @deprecated */
  class Message implements IMessage {
    /**
     * Constructs a new Message.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IMessage);

    /** Message role. */
    public role: string;

    /** Message content. */
    public content: string;

    /**
     * Encodes the specified Message message. Does not implicitly {@link common.Message.verify|verify} messages.
     * @param message Message message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Message,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Message;

    /**
     * Verifies a Message message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Message message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Message
     */
    public static fromObject(object: { [k: string]: any }): common.Message;

    /**
     * Creates a plain object from a Message message. Also converts values to other types if specified.
     * @param message Message
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Message,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Message to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Message
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Usage. */
  interface IUsage {
    /** Usage prompt_tokens */
    prompt_tokens?: number | null;

    /** Usage completion_tokens */
    completion_tokens?: number | null;

    /** Usage total_tokens */
    total_tokens?: number | null;
  }

  /** Represents a Usage. */
  class Usage implements IUsage {
    /**
     * Constructs a new Usage.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IUsage);

    /** Usage prompt_tokens. */
    public prompt_tokens: number;

    /** Usage completion_tokens. */
    public completion_tokens: number;

    /** Usage total_tokens. */
    public total_tokens: number;

    /**
     * Encodes the specified Usage message. Does not implicitly {@link common.Usage.verify|verify} messages.
     * @param message Usage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Usage,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Usage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Usage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Usage;

    /**
     * Verifies a Usage message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Usage message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Usage
     */
    public static fromObject(object: { [k: string]: any }): common.Usage;

    /**
     * Creates a plain object from a Usage message. Also converts values to other types if specified.
     * @param message Usage
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Usage,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Usage to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Usage
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Choice. */
  interface IChoice {
    /** Choice index */
    index?: number | null;

    /** Choice message */
    message?: common.MessageV2 | null;

    /** Choice finish_reason */
    finish_reason?: string | null;
  }

  /** Represents a Choice. */
  class Choice implements IChoice {
    /**
     * Constructs a new Choice.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IChoice);

    /** Choice index. */
    public index: number;

    /** Choice message. */
    public message?: common.MessageV2 | null;

    /** Choice finish_reason. */
    public finish_reason?: string | null;

    /** Choice _finish_reason. */
    public _finish_reason?: "finish_reason";

    /**
     * Encodes the specified Choice message. Does not implicitly {@link common.Choice.verify|verify} messages.
     * @param message Choice message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Choice,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Choice message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Choice
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Choice;

    /**
     * Verifies a Choice message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Choice message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Choice
     */
    public static fromObject(object: { [k: string]: any }): common.Choice;

    /**
     * Creates a plain object from a Choice message. Also converts values to other types if specified.
     * @param message Choice
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Choice,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Choice to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Choice
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an Embedding. */
  interface IEmbedding {
    /** Embedding index */
    index?: number | null;

    /** Embedding embedding */
    embedding?: number[] | null;
  }

  /** Represents an Embedding. */
  class Embedding implements IEmbedding {
    /**
     * Constructs a new Embedding.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IEmbedding);

    /** Embedding index. */
    public index: number;

    /** Embedding embedding. */
    public embedding: number[];

    /**
     * Encodes the specified Embedding message. Does not implicitly {@link common.Embedding.verify|verify} messages.
     * @param message Embedding message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Embedding,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an Embedding message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Embedding
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Embedding;

    /**
     * Verifies an Embedding message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an Embedding message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Embedding
     */
    public static fromObject(object: { [k: string]: any }): common.Embedding;

    /**
     * Creates a plain object from an Embedding message. Also converts values to other types if specified.
     * @param message Embedding
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Embedding,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Embedding to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Embedding
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Chunk. */
  interface IChunk {
    /** Chunk id */
    id?: string | null;

    /** Chunk text */
    text?: string | null;

    /** Chunk tokens */
    tokens?: number | null;
  }

  /** @deprecated */
  class Chunk implements IChunk {
    /**
     * Constructs a new Chunk.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IChunk);

    /** Chunk id. */
    public id: string;

    /** Chunk text. */
    public text: string;

    /** Chunk tokens. */
    public tokens: number;

    /**
     * Encodes the specified Chunk message. Does not implicitly {@link common.Chunk.verify|verify} messages.
     * @param message Chunk message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Chunk,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Chunk message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Chunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Chunk;

    /**
     * Verifies a Chunk message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Chunk message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Chunk
     */
    public static fromObject(object: { [k: string]: any }): common.Chunk;

    /**
     * Creates a plain object from a Chunk message. Also converts values to other types if specified.
     * @param message Chunk
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Chunk,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Chunk to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Chunk
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Similarity. */
  interface ISimilarity {
    /** Similarity id */
    id?: string | null;

    /** Similarity score */
    score?: number | null;

    /** Similarity tokens */
    tokens?: number | null;

    /** Similarity text */
    text?: string | null;
  }

  /** @deprecated */
  class Similarity implements ISimilarity {
    /**
     * Constructs a new Similarity.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.ISimilarity);

    /** Similarity id. */
    public id: string;

    /** Similarity score. */
    public score: number;

    /** Similarity tokens. */
    public tokens: number;

    /** Similarity text. */
    public text: string;

    /**
     * Encodes the specified Similarity message. Does not implicitly {@link common.Similarity.verify|verify} messages.
     * @param message Similarity message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Similarity,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Similarity message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Similarity
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Similarity;

    /**
     * Verifies a Similarity message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Similarity message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Similarity
     */
    public static fromObject(object: { [k: string]: any }): common.Similarity;

    /**
     * Creates a plain object from a Similarity message. Also converts values to other types if specified.
     * @param message Similarity
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Similarity,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Similarity to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Similarity
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Prompt. */
  interface IPrompt {
    /** Prompt system_instructions */
    system_instructions?: string[] | null;

    /** Prompt previous_similarities */
    previous_similarities?: common.Similarity[] | null;

    /** Prompt current_similarities */
    current_similarities?: common.Similarity[] | null;

    /** Prompt messages */
    messages?: common.Message[] | null;
  }

  /** @deprecated */
  class Prompt implements IPrompt {
    /**
     * Constructs a new Prompt.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IPrompt);

    /** Prompt system_instructions. */
    public system_instructions: string[];

    /** Prompt previous_similarities. */
    public previous_similarities: common.Similarity[];

    /** Prompt current_similarities. */
    public current_similarities: common.Similarity[];

    /** Prompt messages. */
    public messages: common.Message[];

    /**
     * Encodes the specified Prompt message. Does not implicitly {@link common.Prompt.verify|verify} messages.
     * @param message Prompt message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Prompt,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Prompt message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Prompt
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Prompt;

    /**
     * Verifies a Prompt message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Prompt message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Prompt
     */
    public static fromObject(object: { [k: string]: any }): common.Prompt;

    /**
     * Creates a plain object from a Prompt message. Also converts values to other types if specified.
     * @param message Prompt
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Prompt,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Prompt to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Prompt
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Conversation. */
  interface IConversation {
    /** Conversation id */
    id?: resource.Identifier | null;
  }

  /** Represents a Conversation. */
  class Conversation implements IConversation {
    /**
     * Constructs a new Conversation.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IConversation);

    /** Conversation id. */
    public id?: resource.Identifier | null;

    /**
     * Encodes the specified Conversation message. Does not implicitly {@link common.Conversation.verify|verify} messages.
     * @param message Conversation message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Conversation,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Conversation message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Conversation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Conversation;

    /**
     * Verifies a Conversation message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Conversation message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Conversation
     */
    public static fromObject(object: { [k: string]: any }): common.Conversation;

    /**
     * Creates a plain object from a Conversation message. Also converts values to other types if specified.
     * @param message Conversation
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Conversation,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Conversation to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Conversation
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a ToolProp. */
  interface IToolProp {
    /** ToolProp type */
    type?: string | null;

    /** ToolProp description */
    description?: string | null;
  }

  /** Represents a ToolProp. */
  class ToolProp implements IToolProp {
    /**
     * Constructs a new ToolProp.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IToolProp);

    /** ToolProp type. */
    public type: string;

    /** ToolProp description. */
    public description: string;

    /**
     * Encodes the specified ToolProp message. Does not implicitly {@link common.ToolProp.verify|verify} messages.
     * @param message ToolProp message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.ToolProp,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a ToolProp message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ToolProp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.ToolProp;

    /**
     * Verifies a ToolProp message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a ToolProp message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ToolProp
     */
    public static fromObject(object: { [k: string]: any }): common.ToolProp;

    /**
     * Creates a plain object from a ToolProp message. Also converts values to other types if specified.
     * @param message ToolProp
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.ToolProp,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this ToolProp to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for ToolProp
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a ToolParam. */
  interface IToolParam {
    /** ToolParam type */
    type?: string | null;

    /** ToolParam properties */
    properties?: { [k: string]: common.ToolProp } | null;

    /** ToolParam required */
    required?: string[] | null;
  }

  /** Represents a ToolParam. */
  class ToolParam implements IToolParam {
    /**
     * Constructs a new ToolParam.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IToolParam);

    /** ToolParam type. */
    public type: string;

    /** ToolParam properties. */
    public properties: { [k: string]: common.ToolProp };

    /** ToolParam required. */
    public required: string[];

    /**
     * Encodes the specified ToolParam message. Does not implicitly {@link common.ToolParam.verify|verify} messages.
     * @param message ToolParam message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.ToolParam,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a ToolParam message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ToolParam
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.ToolParam;

    /**
     * Verifies a ToolParam message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a ToolParam message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ToolParam
     */
    public static fromObject(object: { [k: string]: any }): common.ToolParam;

    /**
     * Creates a plain object from a ToolParam message. Also converts values to other types if specified.
     * @param message ToolParam
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.ToolParam,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this ToolParam to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for ToolParam
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a ToolFunction. */
  interface IToolFunction {
    /** ToolFunction descriptor */
    descriptor?: resource.Descriptor | null;

    /** ToolFunction parameters */
    parameters?: common.ToolParam | null;

    /** ToolFunction arguments */
    arguments?: string | null;
  }

  /** Represents a ToolFunction. */
  class ToolFunction implements IToolFunction {
    /**
     * Constructs a new ToolFunction.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IToolFunction);

    /** ToolFunction descriptor. */
    public descriptor?: resource.Descriptor | null;

    /** ToolFunction parameters. */
    public parameters?: common.ToolParam | null;

    /** ToolFunction arguments. */
    public arguments?: string | null;

    /** ToolFunction call. */
    public call?: "parameters" | "arguments";

    /**
     * Encodes the specified ToolFunction message. Does not implicitly {@link common.ToolFunction.verify|verify} messages.
     * @param message ToolFunction message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.ToolFunction,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a ToolFunction message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ToolFunction
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.ToolFunction;

    /**
     * Verifies a ToolFunction message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a ToolFunction message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ToolFunction
     */
    public static fromObject(object: { [k: string]: any }): common.ToolFunction;

    /**
     * Creates a plain object from a ToolFunction message. Also converts values to other types if specified.
     * @param message ToolFunction
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.ToolFunction,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this ToolFunction to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for ToolFunction
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Tool. */
  interface ITool {
    /** Tool type */
    type?: string | null;

    /** Tool function */
    function?: common.ToolFunction | null;

    /** Tool id */
    id?: string | null;
  }

  /** Represents a Tool. */
  class Tool implements ITool {
    /**
     * Constructs a new Tool.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.ITool);

    /** Tool type. */
    public type: string;

    /** Tool function. */
    public function?: common.ToolFunction | null;

    /** Tool id. */
    public id?: string | null;

    /** Tool _id. */
    public _id?: "id";

    /**
     * Encodes the specified Tool message. Does not implicitly {@link common.Tool.verify|verify} messages.
     * @param message Tool message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Tool,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Tool message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Tool
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Tool;

    /**
     * Verifies a Tool message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Tool message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Tool
     */
    public static fromObject(object: { [k: string]: any }): common.Tool;

    /**
     * Creates a plain object from a Tool message. Also converts values to other types if specified.
     * @param message Tool
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Tool,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Tool to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Tool
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a ToolCallRequest. */
  interface IToolCallRequest {
    /** ToolCallRequest role */
    role?: string | null;

    /** ToolCallRequest tool_calls */
    tool_calls?: common.Tool[] | null;
  }

  /** Represents a ToolCallRequest. */
  class ToolCallRequest implements IToolCallRequest {
    /**
     * Constructs a new ToolCallRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IToolCallRequest);

    /** ToolCallRequest role. */
    public role: string;

    /** ToolCallRequest tool_calls. */
    public tool_calls: common.Tool[];

    /**
     * Encodes the specified ToolCallRequest message. Does not implicitly {@link common.ToolCallRequest.verify|verify} messages.
     * @param message ToolCallRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.ToolCallRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a ToolCallRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ToolCallRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.ToolCallRequest;

    /**
     * Verifies a ToolCallRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a ToolCallRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ToolCallRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): common.ToolCallRequest;

    /**
     * Creates a plain object from a ToolCallRequest message. Also converts values to other types if specified.
     * @param message ToolCallRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.ToolCallRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this ToolCallRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for ToolCallRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a ToolCallResult. */
  interface IToolCallResult {
    /** ToolCallResult role */
    role?: string | null;

    /** ToolCallResult tool_call_id */
    tool_call_id?: string | null;

    /** ToolCallResult content */
    content?: string | null;
  }

  /** Represents a ToolCallResult. */
  class ToolCallResult implements IToolCallResult {
    /**
     * Constructs a new ToolCallResult.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IToolCallResult);

    /** ToolCallResult role. */
    public role: string;

    /** ToolCallResult tool_call_id. */
    public tool_call_id: string;

    /** ToolCallResult content. */
    public content: string;

    /**
     * Encodes the specified ToolCallResult message. Does not implicitly {@link common.ToolCallResult.verify|verify} messages.
     * @param message ToolCallResult message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.ToolCallResult,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a ToolCallResult message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns ToolCallResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.ToolCallResult;

    /**
     * Verifies a ToolCallResult message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a ToolCallResult message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ToolCallResult
     */
    public static fromObject(object: {
      [k: string]: any;
    }): common.ToolCallResult;

    /**
     * Creates a plain object from a ToolCallResult message. Also converts values to other types if specified.
     * @param message ToolCallResult
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.ToolCallResult,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this ToolCallResult to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for ToolCallResult
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a MessageV2. */
  interface IMessageV2 {
    /** MessageV2 id */
    id?: resource.Identifier | null;

    /** MessageV2 descriptor */
    descriptor?: resource.Descriptor | null;

    /** MessageV2 content */
    content?: resource.Content | null;

    /** MessageV2 role */
    role?: string | null;
  }

  /** Represents a MessageV2. */
  class MessageV2 implements IMessageV2 {
    /**
     * Constructs a new MessageV2.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IMessageV2);

    /** MessageV2 id. */
    public id?: resource.Identifier | null;

    /** MessageV2 descriptor. */
    public descriptor?: resource.Descriptor | null;

    /** MessageV2 content. */
    public content?: resource.Content | null;

    /** MessageV2 role. */
    public role: string;

    /**
     * Encodes the specified MessageV2 message. Does not implicitly {@link common.MessageV2.verify|verify} messages.
     * @param message MessageV2 message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.MessageV2,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a MessageV2 message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MessageV2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.MessageV2;

    /**
     * Verifies a MessageV2 message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a MessageV2 message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MessageV2
     */
    public static fromObject(object: { [k: string]: any }): common.MessageV2;

    /**
     * Creates a plain object from a MessageV2 message. Also converts values to other types if specified.
     * @param message MessageV2
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.MessageV2,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this MessageV2 to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for MessageV2
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an Assistant. */
  interface IAssistant {
    /** Assistant id */
    id?: resource.Identifier | null;

    /** Assistant descriptor */
    descriptor?: resource.Descriptor | null;

    /** Assistant content */
    content?: resource.Content | null;
  }

  /** Represents an Assistant. */
  class Assistant implements IAssistant {
    /**
     * Constructs a new Assistant.
     * @param [properties] Properties to set
     */
    constructor(properties?: common.IAssistant);

    /** Assistant id. */
    public id?: resource.Identifier | null;

    /** Assistant descriptor. */
    public descriptor?: resource.Descriptor | null;

    /** Assistant content. */
    public content?: resource.Content | null;

    /**
     * Encodes the specified Assistant message. Does not implicitly {@link common.Assistant.verify|verify} messages.
     * @param message Assistant message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: common.Assistant,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an Assistant message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Assistant
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): common.Assistant;

    /**
     * Verifies an Assistant message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an Assistant message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Assistant
     */
    public static fromObject(object: { [k: string]: any }): common.Assistant;

    /**
     * Creates a plain object from an Assistant message. Also converts values to other types if specified.
     * @param message Assistant
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: common.Assistant,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Assistant to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Assistant
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

/** Namespace agent. */
export namespace agent {
  /** Properties of an AgentRequest. */
  interface IAgentRequest {
    /** AgentRequest messages */
    messages?: common.MessageV2[] | null;

    /** AgentRequest conversation_id */
    conversation_id?: string | null;

    /** AgentRequest github_token */
    github_token?: string | null;
  }

  /** Represents an AgentRequest. */
  class AgentRequest implements IAgentRequest {
    /**
     * Constructs a new AgentRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: agent.IAgentRequest);

    /** AgentRequest messages. */
    public messages: common.MessageV2[];

    /** AgentRequest conversation_id. */
    public conversation_id?: string | null;

    /** AgentRequest github_token. */
    public github_token?: string | null;

    /** AgentRequest _conversation_id. */
    public _conversation_id?: "conversation_id";

    /** AgentRequest _github_token. */
    public _github_token?: "github_token";

    /**
     * Encodes the specified AgentRequest message. Does not implicitly {@link agent.AgentRequest.verify|verify} messages.
     * @param message AgentRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: agent.AgentRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an AgentRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns AgentRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): agent.AgentRequest;

    /**
     * Verifies an AgentRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an AgentRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns AgentRequest
     */
    public static fromObject(object: { [k: string]: any }): agent.AgentRequest;

    /**
     * Creates a plain object from an AgentRequest message. Also converts values to other types if specified.
     * @param message AgentRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: agent.AgentRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this AgentRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for AgentRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an AgentResponse. */
  interface IAgentResponse {
    /** AgentResponse id */
    id?: string | null;

    /** AgentResponse object */
    object?: string | null;

    /** AgentResponse created */
    created?: number | Long | null;

    /** AgentResponse model */
    model?: string | null;

    /** AgentResponse choices */
    choices?: common.Choice[] | null;

    /** AgentResponse usage */
    usage?: common.Usage | null;

    /** AgentResponse conversation_id */
    conversation_id?: string | null;
  }

  /** Represents an AgentResponse. */
  class AgentResponse implements IAgentResponse {
    /**
     * Constructs a new AgentResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: agent.IAgentResponse);

    /** AgentResponse id. */
    public id: string;

    /** AgentResponse object. */
    public object: string;

    /** AgentResponse created. */
    public created: number | Long;

    /** AgentResponse model. */
    public model: string;

    /** AgentResponse choices. */
    public choices: common.Choice[];

    /** AgentResponse usage. */
    public usage?: common.Usage | null;

    /** AgentResponse conversation_id. */
    public conversation_id: string;

    /**
     * Encodes the specified AgentResponse message. Does not implicitly {@link agent.AgentResponse.verify|verify} messages.
     * @param message AgentResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: agent.AgentResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an AgentResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns AgentResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): agent.AgentResponse;

    /**
     * Verifies an AgentResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an AgentResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns AgentResponse
     */
    public static fromObject(object: { [k: string]: any }): agent.AgentResponse;

    /**
     * Creates a plain object from an AgentResponse message. Also converts values to other types if specified.
     * @param message AgentResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: agent.AgentResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this AgentResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for AgentResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

/** Namespace llm. */
export namespace llm {
  /** Properties of an EmbeddingsRequest. */
  interface IEmbeddingsRequest {
    /** EmbeddingsRequest chunks */
    chunks?: string[] | null;

    /** EmbeddingsRequest github_token */
    github_token?: string | null;
  }

  /** Represents an EmbeddingsRequest. */
  class EmbeddingsRequest implements IEmbeddingsRequest {
    /**
     * Constructs a new EmbeddingsRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: llm.IEmbeddingsRequest);

    /** EmbeddingsRequest chunks. */
    public chunks: string[];

    /** EmbeddingsRequest github_token. */
    public github_token: string;

    /**
     * Encodes the specified EmbeddingsRequest message. Does not implicitly {@link llm.EmbeddingsRequest.verify|verify} messages.
     * @param message EmbeddingsRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: llm.EmbeddingsRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an EmbeddingsRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns EmbeddingsRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): llm.EmbeddingsRequest;

    /**
     * Verifies an EmbeddingsRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an EmbeddingsRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns EmbeddingsRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): llm.EmbeddingsRequest;

    /**
     * Creates a plain object from an EmbeddingsRequest message. Also converts values to other types if specified.
     * @param message EmbeddingsRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: llm.EmbeddingsRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this EmbeddingsRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for EmbeddingsRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an EmbeddingsResponse. */
  interface IEmbeddingsResponse {
    /** EmbeddingsResponse data */
    data?: common.Embedding[] | null;
  }

  /** Represents an EmbeddingsResponse. */
  class EmbeddingsResponse implements IEmbeddingsResponse {
    /**
     * Constructs a new EmbeddingsResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: llm.IEmbeddingsResponse);

    /** EmbeddingsResponse data. */
    public data: common.Embedding[];

    /**
     * Encodes the specified EmbeddingsResponse message. Does not implicitly {@link llm.EmbeddingsResponse.verify|verify} messages.
     * @param message EmbeddingsResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: llm.EmbeddingsResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an EmbeddingsResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns EmbeddingsResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): llm.EmbeddingsResponse;

    /**
     * Verifies an EmbeddingsResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an EmbeddingsResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns EmbeddingsResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): llm.EmbeddingsResponse;

    /**
     * Creates a plain object from an EmbeddingsResponse message. Also converts values to other types if specified.
     * @param message EmbeddingsResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: llm.EmbeddingsResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this EmbeddingsResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for EmbeddingsResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a CompletionsRequest. */
  interface ICompletionsRequest {
    /** CompletionsRequest messages */
    messages?: common.MessageV2[] | null;

    /** CompletionsRequest temperature */
    temperature?: number | null;

    /** CompletionsRequest github_token */
    github_token?: string | null;
  }

  /** Represents a CompletionsRequest. */
  class CompletionsRequest implements ICompletionsRequest {
    /**
     * Constructs a new CompletionsRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: llm.ICompletionsRequest);

    /** CompletionsRequest messages. */
    public messages: common.MessageV2[];

    /** CompletionsRequest temperature. */
    public temperature?: number | null;

    /** CompletionsRequest github_token. */
    public github_token: string;

    /** CompletionsRequest _temperature. */
    public _temperature?: "temperature";

    /**
     * Encodes the specified CompletionsRequest message. Does not implicitly {@link llm.CompletionsRequest.verify|verify} messages.
     * @param message CompletionsRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: llm.CompletionsRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a CompletionsRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CompletionsRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): llm.CompletionsRequest;

    /**
     * Verifies a CompletionsRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a CompletionsRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CompletionsRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): llm.CompletionsRequest;

    /**
     * Creates a plain object from a CompletionsRequest message. Also converts values to other types if specified.
     * @param message CompletionsRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: llm.CompletionsRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this CompletionsRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CompletionsRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a CompletionsResponse. */
  interface ICompletionsResponse {
    /** CompletionsResponse id */
    id?: string | null;

    /** CompletionsResponse object */
    object?: string | null;

    /** CompletionsResponse created */
    created?: number | Long | null;

    /** CompletionsResponse model */
    model?: string | null;

    /** CompletionsResponse choices */
    choices?: common.Choice[] | null;

    /** CompletionsResponse usage */
    usage?: common.Usage | null;
  }

  /** Represents a CompletionsResponse. */
  class CompletionsResponse implements ICompletionsResponse {
    /**
     * Constructs a new CompletionsResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: llm.ICompletionsResponse);

    /** CompletionsResponse id. */
    public id: string;

    /** CompletionsResponse object. */
    public object: string;

    /** CompletionsResponse created. */
    public created: number | Long;

    /** CompletionsResponse model. */
    public model: string;

    /** CompletionsResponse choices. */
    public choices: common.Choice[];

    /** CompletionsResponse usage. */
    public usage?: common.Usage | null;

    /**
     * Encodes the specified CompletionsResponse message. Does not implicitly {@link llm.CompletionsResponse.verify|verify} messages.
     * @param message CompletionsResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: llm.CompletionsResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a CompletionsResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns CompletionsResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): llm.CompletionsResponse;

    /**
     * Verifies a CompletionsResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a CompletionsResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CompletionsResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): llm.CompletionsResponse;

    /**
     * Creates a plain object from a CompletionsResponse message. Also converts values to other types if specified.
     * @param message CompletionsResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: llm.CompletionsResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this CompletionsResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for CompletionsResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

/** Namespace vector. */
export namespace vector {
  /** Properties of a Filter. */
  interface IFilter {
    /** Filter limit */
    limit?: string | null;

    /** Filter threshold */
    threshold?: string | null;

    /** Filter max_tokens */
    max_tokens?: string | null;

    /** Filter prefix */
    prefix?: string | null;

    /** Filter type */
    type?: string | null;
  }

  /** Represents a Filter. */
  class Filter implements IFilter {
    /**
     * Constructs a new Filter.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IFilter);

    /** Filter limit. */
    public limit?: string | null;

    /** Filter threshold. */
    public threshold?: string | null;

    /** Filter max_tokens. */
    public max_tokens?: string | null;

    /** Filter prefix. */
    public prefix?: string | null;

    /** Filter type. */
    public type?: string | null;

    /** Filter _limit. */
    public _limit?: "limit";

    /** Filter _threshold. */
    public _threshold?: "threshold";

    /** Filter _max_tokens. */
    public _max_tokens?: "max_tokens";

    /** Filter _prefix. */
    public _prefix?: "prefix";

    /** Filter _type. */
    public _type?: "type";

    /**
     * Encodes the specified Filter message. Does not implicitly {@link vector.Filter.verify|verify} messages.
     * @param message Filter message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: vector.Filter,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Filter message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Filter
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): vector.Filter;

    /**
     * Verifies a Filter message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Filter message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Filter
     */
    public static fromObject(object: { [k: string]: any }): vector.Filter;

    /**
     * Creates a plain object from a Filter message. Also converts values to other types if specified.
     * @param message Filter
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: vector.Filter,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Filter to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Filter
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a QueryItemsRequest. */
  interface IQueryItemsRequest {
    /** QueryItemsRequest index */
    index?: string | null;

    /** QueryItemsRequest vector */
    vector?: number[] | null;

    /** QueryItemsRequest filter */
    filter?: vector.Filter | null;
  }

  /** Represents a QueryItemsRequest. */
  class QueryItemsRequest implements IQueryItemsRequest {
    /**
     * Constructs a new QueryItemsRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IQueryItemsRequest);

    /** QueryItemsRequest index. */
    public index: string;

    /** QueryItemsRequest vector. */
    public vector: number[];

    /** QueryItemsRequest filter. */
    public filter?: vector.Filter | null;

    /** QueryItemsRequest _filter. */
    public _filter?: "filter";

    /**
     * Encodes the specified QueryItemsRequest message. Does not implicitly {@link vector.QueryItemsRequest.verify|verify} messages.
     * @param message QueryItemsRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: vector.QueryItemsRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a QueryItemsRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns QueryItemsRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): vector.QueryItemsRequest;

    /**
     * Verifies a QueryItemsRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a QueryItemsRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns QueryItemsRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): vector.QueryItemsRequest;

    /**
     * Creates a plain object from a QueryItemsRequest message. Also converts values to other types if specified.
     * @param message QueryItemsRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: vector.QueryItemsRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this QueryItemsRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for QueryItemsRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a QueryItemsResponse. */
  interface IQueryItemsResponse {
    /** QueryItemsResponse identifiers */
    identifiers?: resource.Identifier[] | null;
  }

  /** Represents a QueryItemsResponse. */
  class QueryItemsResponse implements IQueryItemsResponse {
    /**
     * Constructs a new QueryItemsResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IQueryItemsResponse);

    /** QueryItemsResponse identifiers. */
    public identifiers: resource.Identifier[];

    /**
     * Encodes the specified QueryItemsResponse message. Does not implicitly {@link vector.QueryItemsResponse.verify|verify} messages.
     * @param message QueryItemsResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: vector.QueryItemsResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a QueryItemsResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns QueryItemsResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): vector.QueryItemsResponse;

    /**
     * Verifies a QueryItemsResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a QueryItemsResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns QueryItemsResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): vector.QueryItemsResponse;

    /**
     * Creates a plain object from a QueryItemsResponse message. Also converts values to other types if specified.
     * @param message QueryItemsResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: vector.QueryItemsResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this QueryItemsResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for QueryItemsResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a GetItemRequest. */
  interface IGetItemRequest {
    /** GetItemRequest index */
    index?: string | null;

    /** GetItemRequest id */
    id?: string | null;
  }

  /** Represents a GetItemRequest. */
  class GetItemRequest implements IGetItemRequest {
    /**
     * Constructs a new GetItemRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IGetItemRequest);

    /** GetItemRequest index. */
    public index: string;

    /** GetItemRequest id. */
    public id: string;

    /**
     * Encodes the specified GetItemRequest message. Does not implicitly {@link vector.GetItemRequest.verify|verify} messages.
     * @param message GetItemRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: vector.GetItemRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a GetItemRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns GetItemRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): vector.GetItemRequest;

    /**
     * Verifies a GetItemRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a GetItemRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GetItemRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): vector.GetItemRequest;

    /**
     * Creates a plain object from a GetItemRequest message. Also converts values to other types if specified.
     * @param message GetItemRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: vector.GetItemRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this GetItemRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for GetItemRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a GetItemResponse. */
  interface IGetItemResponse {
    /** GetItemResponse identifier */
    identifier?: resource.Identifier | null;
  }

  /** Represents a GetItemResponse. */
  class GetItemResponse implements IGetItemResponse {
    /**
     * Constructs a new GetItemResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IGetItemResponse);

    /** GetItemResponse identifier. */
    public identifier?: resource.Identifier | null;

    /** GetItemResponse _identifier. */
    public _identifier?: "identifier";

    /**
     * Encodes the specified GetItemResponse message. Does not implicitly {@link vector.GetItemResponse.verify|verify} messages.
     * @param message GetItemResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: vector.GetItemResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a GetItemResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns GetItemResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): vector.GetItemResponse;

    /**
     * Verifies a GetItemResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a GetItemResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GetItemResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): vector.GetItemResponse;

    /**
     * Creates a plain object from a GetItemResponse message. Also converts values to other types if specified.
     * @param message GetItemResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: vector.GetItemResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this GetItemResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for GetItemResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

/** Namespace memory. */
export namespace memory {
  /** Properties of an AppendRequest. */
  interface IAppendRequest {
    /** AppendRequest for */
    for?: string | null;

    /** AppendRequest identifiers */
    identifiers?: resource.Identifier[] | null;
  }

  /** Represents an AppendRequest. */
  class AppendRequest implements IAppendRequest {
    /**
     * Constructs a new AppendRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: memory.IAppendRequest);

    /** AppendRequest for. */
    public for: string;

    /** AppendRequest identifiers. */
    public identifiers: resource.Identifier[];

    /**
     * Encodes the specified AppendRequest message. Does not implicitly {@link memory.AppendRequest.verify|verify} messages.
     * @param message AppendRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: memory.AppendRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an AppendRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns AppendRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): memory.AppendRequest;

    /**
     * Verifies an AppendRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an AppendRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns AppendRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): memory.AppendRequest;

    /**
     * Creates a plain object from an AppendRequest message. Also converts values to other types if specified.
     * @param message AppendRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: memory.AppendRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this AppendRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for AppendRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an AppendResponse. */
  interface IAppendResponse {
    /** AppendResponse accepted */
    accepted?: string | null;
  }

  /** Represents an AppendResponse. */
  class AppendResponse implements IAppendResponse {
    /**
     * Constructs a new AppendResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: memory.IAppendResponse);

    /** AppendResponse accepted. */
    public accepted: string;

    /**
     * Encodes the specified AppendResponse message. Does not implicitly {@link memory.AppendResponse.verify|verify} messages.
     * @param message AppendResponse message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: memory.AppendResponse,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes an AppendResponse message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns AppendResponse
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): memory.AppendResponse;

    /**
     * Verifies an AppendResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an AppendResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns AppendResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): memory.AppendResponse;

    /**
     * Creates a plain object from an AppendResponse message. Also converts values to other types if specified.
     * @param message AppendResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: memory.AppendResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this AppendResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for AppendResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a WindowRequest. */
  interface IWindowRequest {
    /** WindowRequest for */
    for?: string | null;

    /** WindowRequest vector */
    vector?: number[] | null;

    /** WindowRequest budget */
    budget?: number | null;

    /** WindowRequest allocation */
    allocation?: memory.WindowRequest.Allocation | null;
  }

  /** Represents a WindowRequest. */
  class WindowRequest implements IWindowRequest {
    /**
     * Constructs a new WindowRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: memory.IWindowRequest);

    /** WindowRequest for. */
    public for: string;

    /** WindowRequest vector. */
    public vector: number[];

    /** WindowRequest budget. */
    public budget: number;

    /** WindowRequest allocation. */
    public allocation?: memory.WindowRequest.Allocation | null;

    /**
     * Encodes the specified WindowRequest message. Does not implicitly {@link memory.WindowRequest.verify|verify} messages.
     * @param message WindowRequest message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: memory.WindowRequest,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a WindowRequest message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns WindowRequest
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): memory.WindowRequest;

    /**
     * Verifies a WindowRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a WindowRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns WindowRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): memory.WindowRequest;

    /**
     * Creates a plain object from a WindowRequest message. Also converts values to other types if specified.
     * @param message WindowRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: memory.WindowRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this WindowRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for WindowRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  namespace WindowRequest {
    /** Properties of an Allocation. */
    interface IAllocation {
      /** Allocation tools */
      tools?: number | null;

      /** Allocation context */
      context?: number | null;

      /** Allocation history */
      history?: number | null;
    }

    /** Represents an Allocation. */
    class Allocation implements IAllocation {
      /**
       * Constructs a new Allocation.
       * @param [properties] Properties to set
       */
      constructor(properties?: memory.WindowRequest.IAllocation);

      /** Allocation tools. */
      public tools: number;

      /** Allocation context. */
      public context: number;

      /** Allocation history. */
      public history: number;

      /**
       * Encodes the specified Allocation message. Does not implicitly {@link memory.WindowRequest.Allocation.verify|verify} messages.
       * @param message Allocation message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: memory.WindowRequest.Allocation,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer;

      /**
       * Decodes an Allocation message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Allocation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): memory.WindowRequest.Allocation;

      /**
       * Verifies an Allocation message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates an Allocation message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Allocation
       */
      public static fromObject(object: {
        [k: string]: any;
      }): memory.WindowRequest.Allocation;

      /**
       * Creates a plain object from an Allocation message. Also converts values to other types if specified.
       * @param message Allocation
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: memory.WindowRequest.Allocation,
        options?: $protobuf.IConversionOptions,
      ): { [k: string]: any };

      /**
       * Converts this Allocation to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Allocation
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }

  /** Properties of a Window. */
  interface IWindow {
    /** Window for */
    for?: string | null;

    /** Window tools */
    tools?: resource.Identifier[] | null;

    /** Window context */
    context?: resource.Identifier[] | null;

    /** Window history */
    history?: resource.Identifier[] | null;
  }

  /** Represents a Window. */
  class Window implements IWindow {
    /**
     * Constructs a new Window.
     * @param [properties] Properties to set
     */
    constructor(properties?: memory.IWindow);

    /** Window for. */
    public for: string;

    /** Window tools. */
    public tools: resource.Identifier[];

    /** Window context. */
    public context: resource.Identifier[];

    /** Window history. */
    public history: resource.Identifier[];

    /**
     * Encodes the specified Window message. Does not implicitly {@link memory.Window.verify|verify} messages.
     * @param message Window message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: memory.Window,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer;

    /**
     * Decodes a Window message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Window
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): memory.Window;

    /**
     * Verifies a Window message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Window message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Window
     */
    public static fromObject(object: { [k: string]: any }): memory.Window;

    /**
     * Creates a plain object from a Window message. Also converts values to other types if specified.
     * @param message Window
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: memory.Window,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this Window to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Window
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}
