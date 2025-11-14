/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "fs";

import { PdfTransform } from "../pdf_transform.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

describe("PdfTransform", () => {
  let knowledgeStorage;
  let llm;
  let logger;
  let transformer;

  const __dirname = dirname(fileURLToPath(import.meta.url));

  beforeEach(() => {
    // Mock KnowledgeStorage with sample HTML
    knowledgeStorage = {
      findByExtension: async (extension) => {
        if (extension === ".pdf") {
          return ["test.pdf"];
        }
        return [];
      },
      get: async (key) => {
        if (key === "test.pdf") {
          return await fs.promises.readFile(__dirname + "/test.pdf");
        }
        return "";
      },
    };

    // Mock LLM
    llm = {
      imageToText: async (
        filePath,
        systemPrompt,
        prompt,
        model,
        max_tokens,
      ) => {
        if (filePath && systemPrompt && prompt && model && max_tokens) {
          const page = filePath.match(/page-\d+.png/i)[0];
          return "<div>" + page + "</div>";
        } else {
          return "";
        }
      },
    };

    // Mock logger (no-op for tests)
    logger = {
      debug: () => {},
    };

    // Create transformer instance
    transformer = new PdfTransform(knowledgeStorage, llm, logger);
  });

  test("creates PdfTransform instance", () => {
    assert.ok(transformer instanceof PdfTransform);
  });

  test("handles empty PDF file list", async () => {
    // Override storage to return empty file list
    knowledgeStorage.findByExtension = async () => [];

    let putCallCount = 0;
    knowledgeStorage.put = async () => {
      putCallCount++;
    };

    await transformer.process(".pdf");

    // Should not call put when no files to process
    assert.strictEqual(putCallCount, 0);
  });

  test("processes PDF file", async () => {
    // Test that the transformer handles real PDF
    let capturedKey = [];
    let capturedHtml = [];

    knowledgeStorage.put = async (htmlKey, html) => {
      capturedKey.push(htmlKey);
      capturedHtml.push(html);
    };

    await transformer.process();
    assert.ok(true, "Processing completed without errors");
    assert.strictEqual(capturedKey.length, 1);
    assert.strictEqual(capturedHtml.length, 1);
    assert.strictEqual(capturedKey[0], "test.html");
    assert.strictEqual(
      capturedHtml[0],
      '<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>test.pdf - PDF to HTML</title></head>\n<body>\n<div>page-1.png</div>\n<div>page-2.png</div>\n</body>\n</html>',
    );
  });

  test("constructor validates required dependencies", () => {
    // Describer is optional; constructing without it should NOT throw
    assert.doesNotThrow(() => {
      new PdfTransform(knowledgeStorage, llm, logger);
    });

    // Parser is required; constructing without it SHOULD throw
    assert.throws(
      () => {
        new PdfTransform(null, llm, logger);
      },
      {
        message: "knowledgeStorage is required",
      },
    );

    assert.throws(
      () => {
        new PdfTransform(knowledgeStorage, null, logger);
      },
      {
        message: "llm is required",
      },
    );

    assert.throws(
      () => {
        new PdfTransform(knowledgeStorage, llm, null);
      },
      {
        message: "logger is required",
      },
    );
  });
});
