import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import {
  TenantConfigRepository,
  TenantConfig,
} from "../../lib/tenant/config-repository.js";

describe("TenantConfigRepository", () => {
  let repo;
  beforeEach(() => {
    repo = new TenantConfigRepository();
  });

  // Given/When/Then: Save and get a client by tenant id
  test("given a client is saved, when get is called with the same id, then it returns the client", async () => {
    // Given
    const config = new TenantConfig("localhost", 3000, { encrypted: "secret" });
    await repo.save("tenantA", config);
    // When
    const result = await repo.get("tenantA");
    // Then
    assert.strictEqual(result.host, config.host);
    assert.strictEqual(result.port, config.port);
    assert.deepStrictEqual(result.encryptedSecret, config.encryptedSecret);
  });

  // Given/When/Then: Get returns null for unknown id
  test("given no client is saved, when get is called with an unknown id, then it returns null", async () => {
    // When
    const result = await repo.get("unknown");
    // Then
    assert.strictEqual(result, null);
  });

  // Given/When/Then: Save overwrites previous client for same id
  test("given a client is saved, when save is called again with the same id, then get returns the new client", async () => {
    // Given
    const config1 = new TenantConfig("localhost", 3000, {
      encrypted: "secret1",
    });
    const config2 = new TenantConfig("remotehost", 4000, {
      encrypted: "secret2",
    });
    await repo.save("tenantA", config1);
    // When
    await repo.save("tenantA", config2);
    // Then
    const result = await repo.get("tenantA");
    assert.strictEqual(result.host, config2.host);
    assert.strictEqual(result.port, config2.port);
  });

  // Given/When/Then: Delete removes client by id
  test("given a client is saved, when delete is called with its id, then get returns null", async () => {
    // Given
    const config = new TenantConfig("localhost", 3000, { encrypted: "secret" });
    await repo.save("tenantA", config);
    // When
    await repo.delete("tenantA");
    // Then
    assert.strictEqual(await repo.get("tenantA"), null);
  });
});
