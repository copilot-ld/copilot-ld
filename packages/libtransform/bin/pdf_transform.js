#!/usr/bin/env node
/* eslint-env node */
import { createScriptConfig } from "@copilot-ld/libconfig";
import { createLlm } from "@copilot-ld/libcopilot";
import { createStorage } from "@copilot-ld/libstorage";
import { createLogger } from "@copilot-ld/libutil";

import { PdfTransform } from "@copilot-ld/libtransform/pdf_transform.js";

/**
 * Process all PDF files in the knowledge base directory and generate HTML files
 * @returns {Promise<void>}
 */
async function main() {
  const config = await createScriptConfig("vision");

  const knowledgeStorage = createStorage("knowledge");

  const llm = createLlm(await config.githubToken(), "gpt-4o");
  const logger = createLogger("resources");

  logger.debug("Starting PDF pre-processing");
  // Process knowledge using PdfTransform
  const pdfTransform = new PdfTransform(knowledgeStorage, llm, logger);
  await pdfTransform.process();
}

main().catch((error) => {
  console.error("Resource pdf pre-processing failed:", error);
  process.exit(1);
});
