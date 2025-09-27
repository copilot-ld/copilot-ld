/* eslint-env node */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { Upload } from "../upload.js";
import { UploadInterface } from "../types.js";

test("Upload class extends UploadInterface", () => {
  const mockStorageFactory = () => ({});
  const mockLogger = { debug: () => {} };
  
  const upload = new Upload(mockStorageFactory, mockLogger);
  assert(upload instanceof UploadInterface, "Upload should extend UploadInterface");
});

test("Upload constructor validates required dependencies", () => {
  assert.throws(
    () => new Upload(null, {}),
    /storageFactory is required/,
    "Should throw when storageFactory is null"
  );
  
  assert.throws(
    () => new Upload(() => {}, null),
    /logger is required/,
    "Should throw when logger is null"
  );
});

test("Upload accepts custom prefixes", () => {
  const mockStorageFactory = () => ({});
  const mockLogger = { debug: () => {} };
  const customPrefixes = ["test1", "test2"];
  
  const upload = new Upload(mockStorageFactory, mockLogger, customPrefixes);
  assert(upload instanceof Upload, "Should create Upload instance with custom prefixes");
});

test("Upload uses default prefixes when not provided", () => {
  const mockStorageFactory = () => ({});
  const mockLogger = { debug: () => {} };
  
  const upload = new Upload(mockStorageFactory, mockLogger);
  assert(upload instanceof Upload, "Should create Upload instance with default prefixes");
});