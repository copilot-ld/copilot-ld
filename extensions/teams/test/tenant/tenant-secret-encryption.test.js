/* eslint-env node */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { TenantSecretEncryption } from "../../lib/tenant/secret-encryption.js";

describe("TenantSecretEncryption", () => {
  let encryption;
  let masterKey;

  beforeEach(() => {
    masterKey = TenantSecretEncryption.generateMasterKey();
    encryption = new TenantSecretEncryption({ masterKey });
  });

  describe("constructor", () => {
    it("should create instance with valid master key", () => {
      assert.ok(encryption instanceof TenantSecretEncryption);
    });

    it("should throw error if masterKey is missing", () => {
      assert.throws(() => new TenantSecretEncryption({}), {
        message: "masterKey is required",
      });
    });

    it("should throw error if masterKey is wrong length", () => {
      assert.throws(() => new TenantSecretEncryption({ masterKey: "short" }), {
        message: "masterKey must be 32 bytes (256 bits)",
      });
    });

    it("should accept hex-encoded master key", () => {
      const hexKey = "a".repeat(64);
      const enc = new TenantSecretEncryption({ masterKey: hexKey });
      assert.ok(enc instanceof TenantSecretEncryption);
    });

    it("should accept buffer master key", () => {
      const bufferKey = Buffer.alloc(32);
      const enc = new TenantSecretEncryption({ masterKey: bufferKey });
      assert.ok(enc instanceof TenantSecretEncryption);
    });

    it("should support old master keys for rotation", () => {
      const oldKey = TenantSecretEncryption.generateMasterKey();
      const enc = new TenantSecretEncryption({
        masterKey,
        oldMasterKeys: { 1: oldKey },
        currentKeyVersion: 2,
      });
      assert.ok(enc instanceof TenantSecretEncryption);
    });
  });

  describe("encrypt", () => {
    it("should encrypt a secret successfully", () => {
      const tenantId = "tenant-123";
      const secret = "my-secret-token";

      const encrypted = encryption.encrypt(tenantId, secret);

      assert.ok(encrypted.ciphertext);
      assert.ok(encrypted.nonce);
      assert.ok(encrypted.authTag);
      assert.ok(encrypted.keySalt);
      assert.ok(encrypted.aad);
      assert.equal(encrypted.keyVersion, 1);
      assert.equal(encrypted.algorithm, "aes-256-gcm");
      assert.ok(encrypted.encryptedAt);
    });

    it("should throw error if tenantId is missing", () => {
      assert.throws(() => encryption.encrypt("", "secret"), {
        message: "tenantId is required",
      });
    });

    it("should throw error if secret is missing", () => {
      assert.throws(() => encryption.encrypt("tenant-123", ""), {
        message: "secret is required",
      });
    });

    it("should produce different ciphertext for same input", () => {
      const tenantId = "tenant-123";
      const secret = "my-secret-token";

      const encrypted1 = encryption.encrypt(tenantId, secret);
      const encrypted2 = encryption.encrypt(tenantId, secret);

      assert.notEqual(encrypted1.ciphertext, encrypted2.ciphertext);
      assert.notEqual(encrypted1.nonce, encrypted2.nonce);
      assert.notEqual(encrypted1.keySalt, encrypted2.keySalt);
    });

    it("should produce different ciphertext for different tenants", () => {
      const secret = "my-secret-token";

      const encrypted1 = encryption.encrypt("tenant-1", secret);
      const encrypted2 = encryption.encrypt("tenant-2", secret);

      assert.notEqual(encrypted1.ciphertext, encrypted2.ciphertext);
    });
  });

  describe("decrypt", () => {
    it("should decrypt an encrypted secret successfully", () => {
      const tenantId = "tenant-123";
      const secret = "my-secret-token";

      const encrypted = encryption.encrypt(tenantId, secret);
      const decrypted = encryption.decrypt(tenantId, encrypted);

      assert.equal(decrypted, secret);
    });

    it("should throw error if tenantId is missing", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");

      assert.throws(() => encryption.decrypt("", encrypted), {
        message: "tenantId is required",
      });
    });

    it("should throw error if encryptedSecret is missing", () => {
      assert.throws(() => encryption.decrypt("tenant-123", null), {
        message: "encryptedSecret is required",
      });
    });

    it("should throw error if encrypted secret structure is invalid", () => {
      assert.throws(
        () => encryption.decrypt("tenant-123", { ciphertext: "invalid" }),
        { message: "Invalid encrypted secret structure" },
      );
    });

    it("should throw error if algorithm is unsupported", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");
      encrypted.algorithm = "aes-128-cbc";

      assert.throws(() => encryption.decrypt("tenant-123", encrypted), {
        message: /Unsupported algorithm/,
      });
    });

    it("should throw error if authentication tag is invalid", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");
      encrypted.authTag = Buffer.from("invalid").toString("base64");

      assert.throws(() => encryption.decrypt("tenant-123", encrypted), {
        message: /Decryption failed/,
      });
    });

    it("should throw error if ciphertext is tampered", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");
      const cipherBuffer = Buffer.from(encrypted.ciphertext, "base64");
      cipherBuffer[0] = cipherBuffer[0] ^ 0xff;
      encrypted.ciphertext = cipherBuffer.toString("base64");

      assert.throws(() => encryption.decrypt("tenant-123", encrypted), {
        message: /Decryption failed/,
      });
    });

    it("should throw error if AAD is tampered", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");
      encrypted.aad = Buffer.from("tampered").toString("base64");

      assert.throws(() => encryption.decrypt("tenant-123", encrypted), {
        message: /Decryption failed/,
      });
    });

    it("should throw error if decrypting with wrong tenant ID", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");

      assert.throws(() => encryption.decrypt("tenant-456", encrypted), {
        message: /Decryption failed/,
      });
    });

    it("should handle long secrets", () => {
      const tenantId = "tenant-123";
      const secret = "a".repeat(10000);

      const encrypted = encryption.encrypt(tenantId, secret);
      const decrypted = encryption.decrypt(tenantId, encrypted);

      assert.equal(decrypted, secret);
    });

    it("should handle unicode secrets", () => {
      const tenantId = "tenant-123";
      const secret = "Hello 世界 🌍 Привет";

      const encrypted = encryption.encrypt(tenantId, secret);
      const decrypted = encryption.decrypt(tenantId, encrypted);

      assert.equal(decrypted, secret);
    });
  });

  describe("rotate", () => {
    it("should rotate secret to new key version", () => {
      const oldKey = TenantSecretEncryption.generateMasterKey();
      const oldEncryption = new TenantSecretEncryption({
        masterKey: oldKey,
        currentKeyVersion: 1,
      });

      const secret = "my-secret-token";
      const encrypted = oldEncryption.encrypt("tenant-123", secret);

      const newKey = TenantSecretEncryption.generateMasterKey();
      const newEncryption = new TenantSecretEncryption({
        masterKey: newKey,
        oldMasterKeys: { 1: oldKey },
        currentKeyVersion: 2,
      });

      const rotated = newEncryption.rotate("tenant-123", encrypted);

      assert.equal(rotated.keyVersion, 2);
      assert.notEqual(rotated.ciphertext, encrypted.ciphertext);
      assert.notEqual(rotated.keySalt, encrypted.keySalt);

      const decrypted = newEncryption.decrypt("tenant-123", rotated);
      assert.equal(decrypted, secret);
    });

    it("should not re-encrypt if already at current version", () => {
      const secret = "my-secret-token";
      const encrypted = encryption.encrypt("tenant-123", secret);

      const rotated = encryption.rotate("tenant-123", encrypted);

      assert.equal(rotated, encrypted);
    });

    it("should throw error if old master key not available", () => {
      const oldKey = TenantSecretEncryption.generateMasterKey();
      const oldEncryption = new TenantSecretEncryption({
        masterKey: oldKey,
        currentKeyVersion: 1,
      });

      const encrypted = oldEncryption.encrypt("tenant-123", "secret");

      const newEncryption = new TenantSecretEncryption({
        masterKey: TenantSecretEncryption.generateMasterKey(),
        currentKeyVersion: 2,
      });

      assert.throws(() => newEncryption.rotate("tenant-123", encrypted), {
        message: /Master key version 1 not available/,
      });
    });
  });

  describe("generateMasterKey", () => {
    it("should generate base64 key by default", () => {
      const key = TenantSecretEncryption.generateMasterKey();
      assert.equal(typeof key, "string");
      assert.equal(key.length, 44);
      assert.match(key, /^[A-Za-z0-9+/]+=*$/);
    });

    it("should generate hex key when specified", () => {
      const key = TenantSecretEncryption.generateMasterKey("hex");
      assert.equal(typeof key, "string");
      assert.equal(key.length, 64);
      assert.match(key, /^[0-9a-f]+$/);
    });

    it("should generate buffer when specified", () => {
      const key = TenantSecretEncryption.generateMasterKey("buffer");
      assert.ok(Buffer.isBuffer(key));
      assert.equal(key.length, 32);
    });

    it("should generate different keys each time", () => {
      const key1 = TenantSecretEncryption.generateMasterKey();
      const key2 = TenantSecretEncryption.generateMasterKey();
      assert.notEqual(key1, key2);
    });
  });

  describe("isValidEncryptedSecret", () => {
    it("should return true for valid encrypted secret", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");
      assert.ok(TenantSecretEncryption.isValidEncryptedSecret(encrypted));
    });

    it("should return false for null", () => {
      assert.equal(TenantSecretEncryption.isValidEncryptedSecret(null), false);
    });

    it("should return false for non-object", () => {
      assert.equal(
        TenantSecretEncryption.isValidEncryptedSecret("string"),
        false,
      );
    });

    it("should return false for missing required fields", () => {
      assert.equal(
        TenantSecretEncryption.isValidEncryptedSecret({ ciphertext: "test" }),
        false,
      );
    });

    it("should return false for empty object", () => {
      assert.equal(TenantSecretEncryption.isValidEncryptedSecret({}), false);
    });
  });

  describe("key isolation", () => {
    it("should not decrypt secret encrypted for different tenant", () => {
      const secret = "my-secret-token";
      const encrypted1 = encryption.encrypt("tenant-1", secret);

      assert.throws(() => encryption.decrypt("tenant-2", encrypted1), {
        message: /Decryption failed/,
      });
    });

    it("should not decrypt with different master key", () => {
      const secret = "my-secret-token";
      const encrypted = encryption.encrypt("tenant-123", secret);

      const differentEncryption = new TenantSecretEncryption({
        masterKey: TenantSecretEncryption.generateMasterKey(),
      });

      assert.throws(
        () => differentEncryption.decrypt("tenant-123", encrypted),
        { message: /Decryption failed/ },
      );
    });
  });

  describe("security properties", () => {
    it("should use unique nonce for each encryption", () => {
      const nonces = new Set();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryption.encrypt("tenant-123", "secret");
        nonces.add(encrypted.nonce);
      }

      assert.equal(nonces.size, 100);
    });

    it("should use unique salt for each encryption", () => {
      const salts = new Set();

      for (let i = 0; i < 100; i++) {
        const encrypted = encryption.encrypt("tenant-123", "secret");
        salts.add(encrypted.keySalt);
      }

      assert.equal(salts.size, 100);
    });

    it("should include tenant context in AAD", () => {
      const encrypted = encryption.encrypt("tenant-123", "secret");
      const aadBuffer = Buffer.from(encrypted.aad, "base64");
      const aadData = JSON.parse(aadBuffer.toString("utf8"));

      assert.equal(aadData.tenantId, "tenant-123");
      assert.equal(aadData.keyVersion, 1);
      assert.ok(aadData.timestamp);
    });

    it("should prevent cross-tenant decryption even with same secret", () => {
      const secret = "shared-secret";
      const encrypted1 = encryption.encrypt("tenant-1", secret);
      const encrypted2 = encryption.encrypt("tenant-2", secret);

      const decrypted1 = encryption.decrypt("tenant-1", encrypted1);
      const decrypted2 = encryption.decrypt("tenant-2", encrypted2);

      assert.equal(decrypted1, secret);
      assert.equal(decrypted2, secret);

      assert.throws(() => encryption.decrypt("tenant-2", encrypted1), {
        message: /Decryption failed/,
      });
    });
  });
});
