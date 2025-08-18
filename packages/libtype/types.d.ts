import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace common. */
export namespace common {
  /** Properties of a Message. */
  interface IMessage {
    /** Message role */
    role?: string | null;

    /** Message content */
    content?: string | null;
  }

  /** Represents a Message. */
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
    message?: common.Message | null;

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
    public message?: common.Message | null;

    /** Choice finish_reason. */
    public finish_reason?: string | null;

    /** Choice _finish_reason. */
    public _finish_reason?: "finish_reason";

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

  /** Represents a Chunk. */
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

  /** Represents a Similarity. */
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

  /** Represents a Prompt. */
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
}

/** Namespace agent. */
export namespace agent {
  /** Properties of an AgentRequest. */
  interface IAgentRequest {
    /** AgentRequest messages */
    messages?: common.Message[] | null;

    /** AgentRequest session_id */
    session_id?: string | null;

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
    public messages: common.Message[];

    /** AgentRequest session_id. */
    public session_id?: string | null;

    /** AgentRequest github_token. */
    public github_token?: string | null;

    /** AgentRequest _session_id. */
    public _session_id?: "session_id";

    /** AgentRequest _github_token. */
    public _github_token?: "github_token";

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

    /** AgentResponse session_id */
    session_id?: string | null;
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

    /** AgentResponse session_id. */
    public session_id: string;

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

/** Namespace history. */
export namespace history {
  /** Properties of a GetHistoryRequest. */
  interface IGetHistoryRequest {
    /** GetHistoryRequest session_id */
    session_id?: string | null;
  }

  /** Represents a GetHistoryRequest. */
  class GetHistoryRequest implements IGetHistoryRequest {
    /**
     * Constructs a new GetHistoryRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: history.IGetHistoryRequest);

    /** GetHistoryRequest session_id. */
    public session_id: string;

    /**
     * Verifies a GetHistoryRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a GetHistoryRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GetHistoryRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): history.GetHistoryRequest;

    /**
     * Creates a plain object from a GetHistoryRequest message. Also converts values to other types if specified.
     * @param message GetHistoryRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: history.GetHistoryRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this GetHistoryRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for GetHistoryRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a GetHistoryResponse. */
  interface IGetHistoryResponse {
    /** GetHistoryResponse prompt */
    prompt?: common.Prompt | null;
  }

  /** Represents a GetHistoryResponse. */
  class GetHistoryResponse implements IGetHistoryResponse {
    /**
     * Constructs a new GetHistoryResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: history.IGetHistoryResponse);

    /** GetHistoryResponse prompt. */
    public prompt?: common.Prompt | null;

    /**
     * Verifies a GetHistoryResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a GetHistoryResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GetHistoryResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): history.GetHistoryResponse;

    /**
     * Creates a plain object from a GetHistoryResponse message. Also converts values to other types if specified.
     * @param message GetHistoryResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: history.GetHistoryResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this GetHistoryResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for GetHistoryResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an UpdateHistoryRequest. */
  interface IUpdateHistoryRequest {
    /** UpdateHistoryRequest session_id */
    session_id?: string | null;

    /** UpdateHistoryRequest prompt */
    prompt?: common.Prompt | null;

    /** UpdateHistoryRequest github_token */
    github_token?: string | null;
  }

  /** Represents an UpdateHistoryRequest. */
  class UpdateHistoryRequest implements IUpdateHistoryRequest {
    /**
     * Constructs a new UpdateHistoryRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: history.IUpdateHistoryRequest);

    /** UpdateHistoryRequest session_id. */
    public session_id: string;

    /** UpdateHistoryRequest prompt. */
    public prompt?: common.Prompt | null;

    /** UpdateHistoryRequest github_token. */
    public github_token: string;

    /**
     * Verifies an UpdateHistoryRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an UpdateHistoryRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns UpdateHistoryRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): history.UpdateHistoryRequest;

    /**
     * Creates a plain object from an UpdateHistoryRequest message. Also converts values to other types if specified.
     * @param message UpdateHistoryRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: history.UpdateHistoryRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this UpdateHistoryRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for UpdateHistoryRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of an UpdateHistoryResponse. */
  interface IUpdateHistoryResponse {
    /** UpdateHistoryResponse success */
    success?: boolean | null;

    /** UpdateHistoryResponse optimized */
    optimized?: boolean | null;
  }

  /** Represents an UpdateHistoryResponse. */
  class UpdateHistoryResponse implements IUpdateHistoryResponse {
    /**
     * Constructs a new UpdateHistoryResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: history.IUpdateHistoryResponse);

    /** UpdateHistoryResponse success. */
    public success: boolean;

    /** UpdateHistoryResponse optimized. */
    public optimized: boolean;

    /**
     * Verifies an UpdateHistoryResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an UpdateHistoryResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns UpdateHistoryResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): history.UpdateHistoryResponse;

    /**
     * Creates a plain object from an UpdateHistoryResponse message. Also converts values to other types if specified.
     * @param message UpdateHistoryResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: history.UpdateHistoryResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this UpdateHistoryResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for UpdateHistoryResponse
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
    /** CompletionsRequest prompt */
    prompt?: common.Prompt | null;

    /** CompletionsRequest github_token */
    github_token?: string | null;

    /** CompletionsRequest temperature */
    temperature?: number | null;
  }

  /** Represents a CompletionsRequest. */
  class CompletionsRequest implements ICompletionsRequest {
    /**
     * Constructs a new CompletionsRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: llm.ICompletionsRequest);

    /** CompletionsRequest prompt. */
    public prompt?: common.Prompt | null;

    /** CompletionsRequest github_token. */
    public github_token: string;

    /** CompletionsRequest temperature. */
    public temperature?: number | null;

    /** CompletionsRequest _temperature. */
    public _temperature?: "temperature";

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

/** Namespace text. */
export namespace text {
  /** Properties of a GetChunksRequest. */
  interface IGetChunksRequest {
    /** GetChunksRequest ids */
    ids?: string[] | null;
  }

  /** Represents a GetChunksRequest. */
  class GetChunksRequest implements IGetChunksRequest {
    /**
     * Constructs a new GetChunksRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: text.IGetChunksRequest);

    /** GetChunksRequest ids. */
    public ids: string[];

    /**
     * Verifies a GetChunksRequest message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a GetChunksRequest message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GetChunksRequest
     */
    public static fromObject(object: {
      [k: string]: any;
    }): text.GetChunksRequest;

    /**
     * Creates a plain object from a GetChunksRequest message. Also converts values to other types if specified.
     * @param message GetChunksRequest
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: text.GetChunksRequest,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this GetChunksRequest to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for GetChunksRequest
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a GetChunksResponse. */
  interface IGetChunksResponse {
    /** GetChunksResponse chunks */
    chunks?: { [k: string]: common.Chunk } | null;
  }

  /** Represents a GetChunksResponse. */
  class GetChunksResponse implements IGetChunksResponse {
    /**
     * Constructs a new GetChunksResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: text.IGetChunksResponse);

    /** GetChunksResponse chunks. */
    public chunks: { [k: string]: common.Chunk };

    /**
     * Verifies a GetChunksResponse message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a GetChunksResponse message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns GetChunksResponse
     */
    public static fromObject(object: {
      [k: string]: any;
    }): text.GetChunksResponse;

    /**
     * Creates a plain object from a GetChunksResponse message. Also converts values to other types if specified.
     * @param message GetChunksResponse
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: text.GetChunksResponse,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any };

    /**
     * Converts this GetChunksResponse to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for GetChunksResponse
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }
}

/** Namespace vector. */
export namespace vector {
  /** Properties of a QueryItemsRequest. */
  interface IQueryItemsRequest {
    /** QueryItemsRequest vector */
    vector?: number[] | null;

    /** QueryItemsRequest threshold */
    threshold?: number | null;

    /** QueryItemsRequest limit */
    limit?: number | null;

    /** QueryItemsRequest max_tokens */
    max_tokens?: number | null;
  }

  /** Represents a QueryItemsRequest. */
  class QueryItemsRequest implements IQueryItemsRequest {
    /**
     * Constructs a new QueryItemsRequest.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IQueryItemsRequest);

    /** QueryItemsRequest vector. */
    public vector: number[];

    /** QueryItemsRequest threshold. */
    public threshold?: number | null;

    /** QueryItemsRequest limit. */
    public limit?: number | null;

    /** QueryItemsRequest max_tokens. */
    public max_tokens?: number | null;

    /** QueryItemsRequest _threshold. */
    public _threshold?: "threshold";

    /** QueryItemsRequest _limit. */
    public _limit?: "limit";

    /** QueryItemsRequest _max_tokens. */
    public _max_tokens?: "max_tokens";

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
    /** QueryItemsResponse results */
    results?: common.Similarity[] | null;
  }

  /** Represents a QueryItemsResponse. */
  class QueryItemsResponse implements IQueryItemsResponse {
    /**
     * Constructs a new QueryItemsResponse.
     * @param [properties] Properties to set
     */
    constructor(properties?: vector.IQueryItemsResponse);

    /** QueryItemsResponse results. */
    public results: common.Similarity[];

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
}
