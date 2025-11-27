/* eslint-env node */
import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import { TenantClientService } from "../tenant-client-service.js";
import { TenantConfigRepository } from "../tenant-config-repository.js";
import { TenantSecretEncryption } from "../tenant-secret-encryption.js";

describe("TenantClientService", () => {
  let tenantClientService;
  let configRepository;
  let encryption;
  let masterKey;

  beforeEach(() => {
    configRepository = new TenantConfigRepository();
    masterKey = TenantSecretEncryption.generateMasterKey();
    encryption = new TenantSecretEncryption({ masterKey });
    tenantClientService = new TenantClientService(configRepository, encryption);
  });

  describe("constructor", () => {
    test("should create instance with valid dependencies", () => {
      assert.ok(tenantClientService instanceof TenantClientService);
    });

    test("should throw error if configRepository is missing", () => {
      assert.throws(() => new TenantClientService(null, encryption), {
        message: "configRepository is required",
      });
    });

    test("should throw error if encryption is missing", () => {
      assert.throws(() => new TenantClientService(configRepository, null), {
        message: "encryption is required",
      });
    });
  });

  describe("saveTenantConfig", () => {
    test("should save tenant configuration with encrypted secret", async () => {
      const tenantId = "tenant-123";
      const host = "localhost";
      const port = 3001;
      const secret = "my-secret-token-that-is-at-least-32-characters-long";

      await tenantClientService.saveTenantConfig(tenantId, host, port, secret);

      const config = await configRepository.get(tenantId);
      assert.ok(config);
      assert.strictEqual(config.host, host);
      assert.strictEqual(config.port, port);
      assert.ok(config.encryptedSecret);
      assert.ok(config.encryptedSecret.ciphertext);
    });

    test("should overwrite existing configuration", async () => {
      const tenantId = "tenant-123";

      await tenantClientService.saveTenantConfig(
        tenantId,
        "host1",
        3001,
        "secret1-that-is-at-least-32-chars",
      );
      await tenantClientService.saveTenantConfig(
        tenantId,
        "host2",
        3002,
        "secret2-that-is-at-least-32-chars",
      );

      const config = await configRepository.get(tenantId);
      assert.strictEqual(config.host, "host2");
      assert.strictEqual(config.port, 3002);
    });

    test("should encrypt secrets for different tenants independently", async () => {
      const secret = "shared-secret-that-is-at-least-32-characters-long";

      await tenantClientService.saveTenantConfig(
        "tenant-1",
        "host1",
        3001,
        secret,
      );
      await tenantClientService.saveTenantConfig(
        "tenant-2",
        "host2",
        3002,
        secret,
      );

      const config1 = await configRepository.get("tenant-1");
      const config2 = await configRepository.get("tenant-2");

      assert.notEqual(
        config1.encryptedSecret.ciphertext,
        config2.encryptedSecret.ciphertext,
      );
    });
  });

  describe("getTenantConfig", () => {
    test("should return host and port without secret", async () => {
      const tenantId = "tenant-123";
      const host = "localhost";
      const port = 3001;
      const secret = "my-secret-token-that-is-at-least-32-characters-long";

      await tenantClientService.saveTenantConfig(tenantId, host, port, secret);
      const config = await tenantClientService.getTenantConfig(tenantId);

      assert.ok(config);
      assert.strictEqual(config.host, host);
      assert.strictEqual(config.port, port);
      assert.strictEqual(config.secret, undefined);
      assert.strictEqual(config.encryptedSecret, undefined);
    });

    test("should return null for unknown tenant", async () => {
      const config =
        await tenantClientService.getTenantConfig("unknown-tenant");
      assert.strictEqual(config, null);
    });
  });

  describe("getTenantClient", () => {
    test("should return AgentClient for saved tenant", async () => {
      const tenantId = "tenant-123";
      const host = "localhost";
      const port = 3001;
      const secret = "my-secret-token-that-is-at-least-32-characters-long";

      await tenantClientService.saveTenantConfig(tenantId, host, port, secret);
      const client = await tenantClientService.getTenantClient(tenantId);

      assert.ok(client);
      assert.ok(typeof client.ProcessRequest === "function");
    });

    test("should return null for unknown tenant", async () => {
      const client =
        await tenantClientService.getTenantClient("unknown-tenant");
      assert.strictEqual(client, null);
    });

    test("should decrypt secret correctly when building client", async () => {
      const tenantId = "tenant-123";
      const host = "localhost";
      const port = 3001;
      const secret = "my-secret-token-that-is-at-least-32-characters-long";

      await tenantClientService.saveTenantConfig(tenantId, host, port, secret);

      // Should not throw error during decryption
      const client = await tenantClientService.getTenantClient(tenantId);
      assert.ok(client);
    });

    test("should create different clients for different tenants", async () => {
      await tenantClientService.saveTenantConfig(
        "tenant-1",
        "host1",
        3001,
        "secret1-that-is-at-least-32-chars",
      );
      await tenantClientService.saveTenantConfig(
        "tenant-2",
        "host2",
        3002,
        "secret2-that-is-at-least-32-chars",
      );

      const client1 = await tenantClientService.getTenantClient("tenant-1");
      const client2 = await tenantClientService.getTenantClient("tenant-2");

      assert.ok(client1);
      assert.ok(client2);
      assert.notStrictEqual(client1, client2);
    });

    test("should handle tenant config updates", async () => {
      const tenantId = "tenant-123";

      // Save initial config
      await tenantClientService.saveTenantConfig(
        tenantId,
        "host1",
        3001,
        "secret1-that-is-at-least-32-chars",
      );
      const client1 = await tenantClientService.getTenantClient(tenantId);
      assert.ok(client1);

      // Update config
      await tenantClientService.saveTenantConfig(
        tenantId,
        "host2",
        3002,
        "secret2-that-is-at-least-32-chars",
      );
      const client2 = await tenantClientService.getTenantClient(tenantId);
      assert.ok(client2);

      // Clients should be different instances
      assert.notStrictEqual(client1, client2);
    });
  });

  describe("integration", () => {
    test("should complete full save-retrieve-decrypt cycle", async () => {
      const tenantId = "tenant-123";
      const host = "example.com";
      const port = 8080;
      const secret = "super-secret-token-that-is-at-least-32-characters-long";

      // Save configuration
      await tenantClientService.saveTenantConfig(tenantId, host, port, secret);

      // Retrieve non-sensitive config
      const basicConfig = await tenantClientService.getTenantConfig(tenantId);
      assert.strictEqual(basicConfig.host, host);
      assert.strictEqual(basicConfig.port, port);

      // Retrieve client (decrypts secret internally)
      const client = await tenantClientService.getTenantClient(tenantId);
      assert.ok(client);
      assert.ok(typeof client.ProcessRequest === "function");
    });

    test("should isolate tenant data", async () => {
      const tenant1 = {
        id: "tenant-1",
        host: "host1",
        port: 3001,
        secret: "secret1-that-is-at-least-32-chars",
      };
      const tenant2 = {
        id: "tenant-2",
        host: "host2",
        port: 3002,
        secret: "secret2-that-is-at-least-32-chars",
      };

      // Save both tenants
      await tenantClientService.saveTenantConfig(
        tenant1.id,
        tenant1.host,
        tenant1.port,
        tenant1.secret,
      );
      await tenantClientService.saveTenantConfig(
        tenant2.id,
        tenant2.host,
        tenant2.port,
        tenant2.secret,
      );

      // Retrieve tenant 1
      const config1 = await tenantClientService.getTenantConfig(tenant1.id);
      const client1 = await tenantClientService.getTenantClient(tenant1.id);

      // Retrieve tenant 2
      const config2 = await tenantClientService.getTenantConfig(tenant2.id);
      const client2 = await tenantClientService.getTenantClient(tenant2.id);

      // Verify isolation
      assert.strictEqual(config1.host, tenant1.host);
      assert.strictEqual(config2.host, tenant2.host);
      assert.ok(client1);
      assert.ok(client2);
      assert.notStrictEqual(client1, client2);
    });
  });
});
