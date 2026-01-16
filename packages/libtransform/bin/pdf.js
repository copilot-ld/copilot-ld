#!/usr/bin/env node
import { createScriptConfig } from "@copilot-ld/libconfig";
import { createLlmApi } from "@copilot-ld/libllm";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libtelemetry";

import { PdfTransformer } from "../transformer/pdf.js";

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
  );
  const logger = createLogger("pdf-transformer");

  logger.debug("main", "Starting PDF pre-processing");
  // Process knowledge using PdfProcessor
  const pdfTransformer = new PdfTransformer(knowledgeStorage, llm, logger);
  await pdfTransformer.process();
}

const logger = createLogger("pdf-transformer");

main().catch((error) => {
  logger.exception("main", error);
  process.exit(1);
});
