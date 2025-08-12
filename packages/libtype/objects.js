/* eslint-env node */

/**
 * Represents a text chunk with metadata
 */
export class Chunk {
  /**
   * Creates a new Chunk instance
   * @param {object} params - Chunk parameters
   * @param {string} params.id - Unique identifier for the chunk
   * @param {number} params.tokens - Number of tokens in the chunk (default: 0)
   * @param {string} params.text - Text content of the chunk
   */
  constructor({ id, text = null, tokens = 0 }) {
    this.id = id;
    this.tokens = tokens;
    if (text) this.text = text;
  }
}

/**
 * Represents a completion choice with message and metadata
 */
export class Choice {
  /**
   * Creates a new Choice instance
   * @param {object} params - Choice parameters
   * @param {number} params.index - Index of the choice
   * @param {object} params.message - Message object with role and content
   * @param {string} params.finish_reason - Reason why completion finished
   */
  constructor({ index, message, finish_reason }) {
    this.index = index;
    this.message = new Message(message);
    this.finish_reason = finish_reason;
  }
}

/**
 * Represents embedding data with index and embedding vector
 */
export class Embedding {
  /**
   * Creates a new Embedding instance
   * @param {object} params - Embedding parameters
   * @param {number} params.index - Index of the embedding
   * @param {number[]} params.embedding - Vector embedding array
   */
  constructor({ index, embedding }) {
    this.index = index;
    this.embedding = embedding;
  }
}

/**
 * Represents a chat message with role and content
 */
export class Message {
  /**
   * Creates a new Message instance
   * @param {object} params - Message parameters
   * @param {string} params.role - Role of the message sender (user, assistant, system)
   * @param {string} params.content - Content of the message
   */
  constructor({ role, content }) {
    this.role = role;
    this.content = content;
  }
}

/**
 * Represents a vector search result with similarity metadata
 */
export class Similarity {
  /**
   * Creates a new Similarity instance
   * @param {object} params - Similarity parameters
   * @param {string} params.id - Unique identifier for the similar item
   * @param {number} params.score - Similarity score (0-1)
   * @param {number} params.tokens - Number of tokens in the item (default: 0)
   * @param {string} params.scope - Scope classification of the item (default: null)
   * @param {string} params.text - Text content of the related chunk (default: null)
   */
  constructor({ id, score, tokens = 0, scope = null, text = null }) {
    this.id = id;
    this.score = score;
    this.tokens = tokens;
    this.scope = scope;
    this.text = text;
  }
}

/**
 * Represents token usage statistics for completions
 */
export class Usage {
  /**
   * Creates a new Usage instance
   * @param {object} params - Usage parameters
   * @param {number} params.prompt_tokens - Number of tokens in the prompt
   * @param {number} params.completion_tokens - Number of tokens in the completion
   * @param {number} params.total_tokens - Total number of tokens used
   */
  constructor({ prompt_tokens, completion_tokens, total_tokens }) {
    this.prompt_tokens = prompt_tokens;
    this.completion_tokens = completion_tokens;
    this.total_tokens = total_tokens;
  }
}
