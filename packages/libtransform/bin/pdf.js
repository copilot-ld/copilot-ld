#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createScriptConfig } from "@copilot-ld/libconfig";
import { createLlmApi } from "@copilot-ld/libllm";
import { PromptLoader } from "@copilot-ld/libprompt";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";

import { PdfTransformer } from "../transformer/pdf.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Process all PDF files in the knowledge base directory and generate HTML files
 * @returns {Promise<void>}
 */
async function main() {
  const config = await createScriptConfig("vision");

  const knowledgeStorage = createStorage("knowledge");

  const llm = createLlmApi(
    await config.llmToken(),
    "gpt-4o",
    config.llmBaseUrl(),
    config.embeddingBaseUrl(),
  );
  const logger = createLogger("pdf-transformer");

  // Create prompt loader for transformer
  const promptLoader = new PromptLoader(join(__dirname, "../prompts"));

  logger.debug("main", "Starting PDF pre-processing");
  // Process knowledge using PdfProcessor
  const pdfTransformer = new PdfTransformer(
    knowledgeStorage,
    llm,
    logger,
    promptLoader,
  );
  await pdfTransformer.process();
}

const logger = createLogger("pdf-transformer");

main().catch((error) => {
  logger.exception("main", error);
  process.exit(1);
});
