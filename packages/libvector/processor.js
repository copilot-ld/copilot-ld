/* eslint-env node */

import { ProcessorBase } from "@copilot-ld/libutil";

/**
 * VectorProcessor class for processing resources into vector embeddings
 * @augments {ProcessorBase}
 */
export class VectorProcessor extends ProcessorBase {
  #contentIndex;
  #descriptorIndex;
  #resourceIndex;
  #llm;
  #targetIndex;

  /**
   * Creates a new VectorProcessor instance
   * @param {import("@copilot-ld/libvector").VectorIndex} contentIndex - The vector index to store content embeddings
   * @param {import("@copilot-ld/libvector").VectorIndex} descriptorIndex - The vector index to store descriptor embeddings
   * @param {import("@copilot-ld/libresource").ResourceIndex} resourceIndex - ResourceIndex instance to process resources from
   * @param {import("@copilot-ld/libcopilot").Copilot} llm - LLM client instance for embedding generation
   * @param {import("@copilot-ld/libutil").Logger} logger - Logger instance for debug output
   */
  constructor(contentIndex, descriptorIndex, resourceIndex, llm, logger) {
    super(logger);
    if (!contentIndex) throw new Error("contentIndex is required");
    if (!descriptorIndex) throw new Error("descriptorIndex is required");
    if (!resourceIndex) throw new Error("resourceIndex is required");
    if (!llm) throw new Error("llm is required");

    this.#contentIndex = contentIndex;
    this.#descriptorIndex = descriptorIndex;
    this.#resourceIndex = resourceIndex;
    this.#llm = llm;
  }

  /**
   * Process resources from the resource index for vector embeddings
   * @param {string} actor - Actor identifier for access control
   * @param {string} representation - What representation of resources to process (descriptor or content)
   * @returns {Promise<void>}
   */
  async process(actor, representation = "content") {
    // 1. Get all resource identifiers
    const identifiers = await this.#resourceIndex.findAll();

    // 2. Filter out conversations and their child resources
    const filteredIdentifiers = identifiers.filter(
      (id) => !String(id).startsWith("common.Conversation"),
    );

    // 3. Load the full resources using the identifiers
    const resources = await this.#resourceIndex.get(filteredIdentifiers, actor);

    // 4. Select the appropriate vector index based on representation
    this.#targetIndex =
      representation === "descriptor"
        ? this.#descriptorIndex
        : this.#contentIndex;

    // 5. Pre-filter resource contents that already exist in the target vector index
    const existing = new Set();
    const checks = await Promise.all(
      resources.map(async (resource) => ({
        id: String(resource.id),
        exists: await this.#targetIndex.has(String(resource.id)),
      })),
    );
    checks
      .filter((check) => check.exists)
      .forEach((check) => existing.add(check.id));

    // Filter resources to only those that need processing
    const resourcesToProcess = [];
    for (const resource of resources) {
      // Determine content to embed based on resource content type
      let text;
      switch (representation) {
        case "content":
          // Not all resources have content, fallback to descriptor
          text = resource.content
            ? String(resource.content)
            : String(resource.descriptor);
          break;

        case "descriptor":
          text = String(resource.descriptor);
      }

      if (text === null || text === "null" || text.trim() === "") {
        continue; // Skip resources with no text
      }

      // Skip if already exists
      if (existing.has(String(resource.id))) {
        continue; // Skip existing resources
      }

      resourcesToProcess.push({
        text: text,
        identifier: resource.id,
        tokens:
          representation === "descriptor"
            ? resource.descriptor.tokens
            : resource.content?.tokens || resource.descriptor.tokens,
      });
    }

    // 6. Use ProcessorBase to handle the batch processing
    await super.process(resourcesToProcess, representation);
  }

  /** @inheritdoc */
  async processItem(item) {
    const texts = [item.text];
    const embeddings = await this.#llm.createEmbeddings(texts);
    const vector = embeddings[0].embedding;

    // Add token count directly to the identifier object (protobuf instance)
    // This ensures token filtering works in query results
    item.identifier.tokens = item.tokens;

    await this.#targetIndex.add(item.identifier, vector);
    return vector;
  }
}
