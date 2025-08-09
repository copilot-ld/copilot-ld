/* eslint-env node */
import { test, describe } from "node:test";
import assert from "node:assert";

import { ServiceConfig, ExtensionConfig } from "@copilot-ld/libconfig";
import { Client, Service } from "@copilot-ld/libservice";

describe("Service Integration", () => {
  test("ServiceConfig integrates with Client", () => {
    // Integration test: ServiceConfig objects work end-to-end with Client
    const config = new ServiceConfig("test-service");
    const client = new Client(config);

    assert.ok(client);
    assert.strictEqual(config.name, "test-service");
  });

  test("ExtensionConfig integrates with Client", () => {
    // Integration test: ExtensionConfig objects work end-to-end with Client
    const config = new ExtensionConfig("test-extension");
    const client = new Client(config);

    assert.ok(client);
    assert.strictEqual(config.name, "test-extension");
  });

  test("ServiceConfig integrates with Service", () => {
    // Integration test: ServiceConfig objects work end-to-end with Service
    const config = new ServiceConfig("test-service");
    const service = new Service(config);

    assert.ok(service);
    assert.strictEqual(config.name, "test-service");
  });

  test("Multiple services use different configs", () => {
    // Integration test: Multiple services can be created with separate configs
    const agentConfig = new ServiceConfig("agent");
    const vectorConfig = new ServiceConfig("vector");

    const agentClient = new Client(agentConfig);
    const vectorClient = new Client(vectorConfig);

    assert.ok(agentClient);
    assert.ok(vectorClient);
    assert.notStrictEqual(agentConfig.name, vectorConfig.name);
  });

  test("Extension and Service configs work together", () => {
    // Integration test: Extension and Service configs can coexist
    const extensionConfig = new ExtensionConfig("web");
    const serviceConfig = new ServiceConfig("agent");

    const extensionClient = new Client(extensionConfig);
    const serviceClient = new Client(serviceConfig);

    assert.ok(extensionClient);
    assert.ok(serviceClient);
    assert.notStrictEqual(extensionConfig.name, serviceConfig.name);
  });
});
