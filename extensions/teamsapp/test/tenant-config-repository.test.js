import { describe, test, beforeEach } from "node:test";
import assert from "node:assert";
import { TenantConfigRepository } from "../tenant-config-repository.js";

describe("TenantConfigRepository", () => {
  let repo;
  beforeEach(() => {
    repo = new TenantConfigRepository();
  });

  // Given/When/Then: Save and get a client by tenant id
  test("given a client is saved, when get is called with the same id, then it returns the client", () => {
    // Given
    const client = { name: "client1" };
    repo.save("tenantA", client);
    // When
    const result = repo.get("tenantA");
    // Then
    assert.strictEqual(result, client);
  });

  // Given/When/Then: Get returns null for unknown id
  test("given no client is saved, when get is called with an unknown id, then it returns null", () => {
    // When
    const result = repo.get("unknown");
    // Then
    assert.strictEqual(result, null);
  });

  // Given/When/Then: Save overwrites previous client for same id
  test("given a client is saved, when save is called again with the same id, then get returns the new client", () => {
    // Given
    const client1 = { name: "client1" };
    const client2 = { name: "client2" };
    repo.save("tenantA", client1);
    // When
    repo.save("tenantA", client2);
    // Then
    assert.strictEqual(repo.get("tenantA"), client2);
  });

  // Given/When/Then: Delete removes client by id
  test("given a client is saved, when delete is called with its id, then get returns null", () => {
    // Given
    const client = { name: "client1" };
    repo.save("tenantA", client);
    // When
    repo.delete("tenantA");
    // Then
    assert.strictEqual(repo.get("tenantA"), null);
  });
});
