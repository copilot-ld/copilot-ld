/* eslint-env node */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { Download } from "../download.js";
import { DownloadInterface } from "../types.js";

test("Download class extends DownloadInterface", () => {
  const mockStorageFactory = () => ({});
  const mockLogger = { debug: () => {} };
  
  const download = new Download(mockStorageFactory, mockLogger);
  assert(download instanceof DownloadInterface, "Download should extend DownloadInterface");
});

test("Download constructor validates required dependencies", () => {
  assert.throws(
    () => new Download(null, {}),
    /storageFactory is required/,
    "Should throw when storageFactory is null"
  );
  
  assert.throws(
    () => new Download(() => {}, null),
    /logger is required/,
    "Should throw when logger is null"
  );
});

test("Download instance creation succeeds with valid dependencies", () => {
  const mockStorageFactory = () => ({});
  const mockLogger = { debug: () => {} };
  
  const download = new Download(mockStorageFactory, mockLogger);
  assert(download instanceof Download, "Should create Download instance successfully");
});

test("Download has required methods", () => {
  const mockStorageFactory = () => ({});
  const mockLogger = { debug: () => {} };
  
  const download = new Download(mockStorageFactory, mockLogger);
  
  assert(typeof download.initialize === "function", "Should have initialize method");
  assert(typeof download.download === "function", "Should have download method");
});