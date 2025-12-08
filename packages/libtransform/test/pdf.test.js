/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs";

import { PdfTransformer } from "../transformer/pdf.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

describe("PdfTransformer", () => {
  let knowledgeStorage;
  let llm;
  let logger;
  let processor;

  const __dirname = dirname(fileURLToPath(import.meta.url));

  beforeEach(() => {
    // Mock KnowledgeStorage with sample HTML
    knowledgeStorage = {
      findByExtension: async (extension) => {
        if (extension === ".pdf") {
          return ["fixtures/test.pdf"];
        }
        return [];
      },
      get: async (key) => {
        if (key === "fixtures/test.pdf") {
          return await fs.promises.readFile(__dirname + "/fixtures/test.pdf");
        }
        return "";
      },
    };

    // Mock LLM
    llm = {
      imageToText: async (
        filePath,
        prompt,
        model,
        systemPrompt,
        max_tokens,
      ) => {
        if (filePath && systemPrompt && prompt && model && max_tokens) {
          const page = filePath.match(/page-\d+.png/i)[0];
          return "<div>" + page + "</div>";
        } else {
          return "";
        }
      },
      createCompletions: async () => {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  global_summary: "Test document summary",
                  document_type: "presentation",
                  slides: {
                    1: "Slide 1 summary",
                    2: "Slide 2 summary",
                  },
                }),
              },
            },
          ],
        };
      },
    };

    // Mock logger (no-op for tests)
    logger = {
      debug: () => {},
    };

    // Create processor instance
    processor = new PdfTransformer(knowledgeStorage, llm, logger);
  });

  test("creates PdfTransformer instance", { skip: "requires pdftoppm" }, () => {
    assert.ok(processor instanceof PdfTransformer);
  });

  test(
    "handles empty PDF file list",
    { skip: "requires pdftoppm" },
    async () => {
      // Override storage to return empty file list
      knowledgeStorage.findByExtension = async () => [];

      let putCallCount = 0;
      knowledgeStorage.put = async () => {
        putCallCount++;
      };

      await processor.process(".pdf");

      // Should not call put when no files to process
      assert.strictEqual(putCallCount, 0);
    },
  );

  test("processes PDF file", { skip: "requires pdftoppm" }, async () => {
    // Test that the transformer handles real PDF
    let capturedKey = [];
    let capturedHtml = [];

    knowledgeStorage.put = async (htmlKey, html) => {
      capturedKey.push(htmlKey);
      capturedHtml.push(html);
    };

    await processor.process();
    assert.ok(true, "Processing completed without errors");

    // Process stores 3 files: merged HTML, context JSON, and final HTML
    assert.strictEqual(capturedKey.length, 3);

    // Verify merged HTML
    assert.strictEqual(capturedKey[0], "fixtures/test.pdf-merged.html");
    assert.ok(capturedHtml[0].includes("<div>page-1.png</div>"));
    assert.ok(capturedHtml[0].includes("<div>page-2.png</div>"));

    // Verify context JSON
    assert.strictEqual(capturedKey[1], "fixtures/test.pdf-context.json");
    const context = JSON.parse(capturedHtml[1]);
    assert.strictEqual(context.global_summary, "Test document summary");
    assert.strictEqual(context.document_type, "presentation");

    // Verify final HTML
    assert.strictEqual(capturedKey[2], "fixtures/test.html");
    assert.ok(capturedHtml[2].includes("<!DOCTYPE html>"));
  });

  test(
    "constructor validates required dependencies",
    { skip: "requires pdftoppm" },
    () => {
      assert.doesNotThrow(() => {
        new PdfTransformer(knowledgeStorage, llm, logger);
      });

      assert.throws(
        () => {
          new PdfTransformer(null, llm, logger);
        },
        {
          message: "knowledgeStorage is required",
        },
      );

      assert.throws(
        () => {
          new PdfTransformer(knowledgeStorage, null, logger);
        },
        {
          message: "llm is required",
        },
      );

      assert.throws(
        () => {
          new PdfTransformer(knowledgeStorage, llm, null);
        },
        {
          message: "logger is required",
        },
      );
    },
  );
});
