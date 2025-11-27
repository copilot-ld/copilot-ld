/* eslint-env node */
import crypto from "node:crypto";

/**
 * Handles encryption and decryption of tenant secrets using per-tenant derived keys.
 * Implements envelope encryption with HKDF key derivation, random salts,
 * and AES-256-GCM authenticated encryption.
 */
export class TenantSecretEncryption {
  #masterKeys;
  #currentKeyVersion;

  /**
   * Creates a new TenantSecretEncryption instance.
   * @param {object} options - Configuration options
   * @param {string|Buffer} options.masterKey - Current master encryption key (32 bytes)
   * @param {object} [options.oldMasterKeys] - Previous master keys for rotation {version: key}
   * @param {number} [options.currentKeyVersion] - Version number of current master key (default: 1)
   */
  constructor(options = {}) {
    if (!options.masterKey) throw new Error("masterKey is required");

    const masterKey = this.#normalizeKey(options.masterKey);
    if (masterKey.length !== 32) {
      throw new Error("masterKey must be 32 bytes (256 bits)");
    }

    this.#currentKeyVersion = options.currentKeyVersion || 1;

    // Normalize old master keys if provided
    this.#masterKeys = {};
    if (options.oldMasterKeys) {
      for (const [version, key] of Object.entries(options.oldMasterKeys)) {
        const normalizedKey = this.#normalizeKey(key);
        if (normalizedKey.length !== 32) {
          throw new Error(
            `oldMasterKeys[${version}] must be 32 bytes (256 bits)`,
          );
        }
        this.#masterKeys[version] = normalizedKey;
      }
    }

    this.#masterKeys[this.#currentKeyVersion] = masterKey;
  }

  /**
   * Encrypts a secret for a specific tenant.
   * @param {string} tenantId - Unique tenant identifier
   * @param {string} secret - Plaintext secret to encrypt
   * @returns {object} Encrypted secret with metadata
   * @property {string} ciphertext - Base64-encoded encrypted data
   * @property {string} nonce - Base64-encoded nonce/IV (12 bytes)
   * @property {string} authTag - Base64-encoded authentication tag (16 bytes)
   * @property {string} keySalt - Base64-encoded random salt for key derivation (32 bytes)
   * @property {string} aad - Base64-encoded additional authenticated data
   * @property {number} keyVersion - Master key version used
   * @property {string} algorithm - Encryption algorithm identifier
   * @property {string} encryptedAt - ISO timestamp of encryption
   */
  encrypt(tenantId, secret) {
    if (!tenantId) throw new Error("tenantId is required");
    if (!secret) throw new Error("secret is required");

    // Generate random salt for this tenant's key derivation
    const keySalt = crypto.randomBytes(32);

    // Derive tenant-specific encryption key
    const tenantKey = this.#deriveTenantKey(
      this.#masterKeys[this.#currentKeyVersion],
      keySalt,
      tenantId,
    );

    try {
      // Generate random nonce for this encryption operation
      const nonce = crypto.randomBytes(12);

      // Create additional authenticated data
      const aadData = {
        tenantId,
        keyVersion: this.#currentKeyVersion,
        timestamp: new Date().toISOString(),
      };
      const aad = Buffer.from(JSON.stringify(aadData));

      // Create cipher and set AAD
      const cipher = crypto.createCipheriv("aes-256-gcm", tenantKey, nonce);
      cipher.setAAD(aad);

      // Encrypt the secret
      const encrypted = Buffer.concat([
        cipher.update(secret, "utf8"),
        cipher.final(),
      ]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        ciphertext: encrypted.toString("base64"),
        nonce: nonce.toString("base64"),
        authTag: authTag.toString("base64"),
        keySalt: keySalt.toString("base64"),
        aad: aad.toString("base64"),
        keyVersion: this.#currentKeyVersion,
        algorithm: "aes-256-gcm",
        encryptedAt: aadData.timestamp,
      };
    } finally {
      // Zero out sensitive key material
      tenantKey.fill(0);
    }
  }

  /**
   * Decrypts a secret for a specific tenant.
   * @param {string} tenantId - Unique tenant identifier
   * @param {object} encryptedSecret - Encrypted secret object from encrypt()
   * @returns {string} Decrypted plaintext secret
   * @throws {Error} If decryption fails or authentication check fails
   */
  decrypt(tenantId, encryptedSecret) {
    if (!tenantId) throw new Error("tenantId is required");
    if (!encryptedSecret) throw new Error("encryptedSecret is required");

    const { ciphertext, nonce, authTag, keySalt, aad, keyVersion, algorithm } =
      encryptedSecret;

    // Validate required fields
    if (!ciphertext || !nonce || !authTag || !keySalt || !aad) {
      throw new Error("Invalid encrypted secret structure");
    }

    if (algorithm !== "aes-256-gcm") {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Get the master key for this version
    const masterKey = this.#masterKeys[keyVersion];
    if (!masterKey) {
      throw new Error(`Master key version ${keyVersion} not available`);
    }

    // Derive tenant-specific encryption key
    const keySaltBuffer = Buffer.from(keySalt, "base64");
    const tenantKey = this.#deriveTenantKey(masterKey, keySaltBuffer, tenantId);

    try {
      // Convert from base64
      const nonceBuffer = Buffer.from(nonce, "base64");
      const ciphertextBuffer = Buffer.from(ciphertext, "base64");
      const authTagBuffer = Buffer.from(authTag, "base64");
      const aadBuffer = Buffer.from(aad, "base64");

      // Create decipher and set AAD and auth tag
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        tenantKey,
        nonceBuffer,
      );
      decipher.setAAD(aadBuffer);
      decipher.setAuthTag(authTagBuffer);

      // Decrypt the secret
      const decrypted = Buffer.concat([
        decipher.update(ciphertextBuffer),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    } finally {
      // Zero out sensitive key material
      tenantKey.fill(0);
    }
  }

  /**
   * Re-encrypts a secret with the current master key version.
   * Used for key rotation without decrypting/re-encrypting externally.
   * @param {string} tenantId - Unique tenant identifier
   * @param {object} encryptedSecret - Encrypted secret with old key version
   * @returns {object} Newly encrypted secret with current key version
   */
  rotate(tenantId, encryptedSecret) {
    if (encryptedSecret.keyVersion === this.#currentKeyVersion) {
      return encryptedSecret;
    }

    // Decrypt with old key, encrypt with new key
    const plaintext = this.decrypt(tenantId, encryptedSecret);
    return this.encrypt(tenantId, plaintext);
  }

  /**
   * Derives a tenant-specific encryption key using HKDF.
   * @private
   * @param {Buffer} masterKey - Master encryption key
   * @param {Buffer} salt - Random salt for key derivation
   * @param {string} tenantId - Tenant identifier as context
   * @returns {Buffer} Derived 32-byte encryption key
   */
  #deriveTenantKey(masterKey, salt, tenantId) {
    // Use HKDF (HMAC-based Key Derivation Function)
    // info parameter binds the key to the tenant context
    const info = Buffer.from(`tenant-secret:${tenantId}`, "utf8");

    const derivedKey = crypto.hkdfSync(
      "sha256",
      masterKey,
      salt,
      info,
      32, // Output 32 bytes (256 bits)
    );

    // Convert Uint8Array to Buffer for compatibility with fill() method
    return Buffer.from(derivedKey);
  }

  /**
   * Normalizes a key from string or Buffer to Buffer.
   * @private
   * @param {string|Buffer} key - Key to normalize
   * @returns {Buffer} Normalized key buffer
   */
  #normalizeKey(key) {
    if (Buffer.isBuffer(key)) {
      return key;
    }
    if (typeof key === "string") {
      // If hex string
      if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
        return Buffer.from(key, "hex");
      }
      // If base64 string
      if (key.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(key)) {
        return Buffer.from(key, "base64");
      }
      // Otherwise treat as utf8
      return Buffer.from(key, "utf8");
    }
    throw new Error("masterKey must be a string or Buffer");
  }

  /**
   * Generates a new random master key.
   * @static
   * @param {string} [encoding] - Output encoding ('hex', 'base64', or 'buffer'), default 'base64'
   * @returns {string|Buffer} Random 32-byte master key
   */
  static generateMasterKey(encoding = "base64") {
    const key = crypto.randomBytes(32);
    if (encoding === "buffer") return key;
    return key.toString(encoding);
  }

  /**
   * Validates an encrypted secret structure.
   * @static
   * @param {object} encryptedSecret - Encrypted secret to validate
   * @returns {boolean} True if structure is valid
   */
  static isValidEncryptedSecret(encryptedSecret) {
    if (!encryptedSecret || typeof encryptedSecret !== "object") {
      return false;
    }

    const requiredFields = [
      "ciphertext",
      "nonce",
      "authTag",
      "keySalt",
      "aad",
      "keyVersion",
      "algorithm",
      "encryptedAt",
    ];

    return requiredFields.every((field) => field in encryptedSecret);
  }
}
