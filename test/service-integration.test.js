/* eslint-env node */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";

import { ServiceConfig, ExtensionConfig } from "@copilot-ld/libconfig";
import { Client, Service } from "@copilot-ld/libservice";

describe("Service Integration", () => {
  let mockAuthFactory;

  beforeEach(() => {
    // Mock auth factory to avoid requiring environment variables
    mockAuthFactory = () => ({
      createClientInterceptor: () => () => {},
      validateCall: () => ({ isValid: true, serviceId: "test" }),
    });
  });
  test("ServiceConfig integrates with Client", () => {
    // Integration test: ServiceConfig objects work end-to-end with Client
    const config = new ServiceConfig("test-service");
    const client = new Client(config, undefined, mockAuthFactory);

    assert.ok(client);
    assert.strictEqual(config.name, "test-service");
  });

  test("ExtensionConfig integrates with Client", () => {
    // Integration test: ExtensionConfig objects work end-to-end with Client
    const config = new ExtensionConfig("test-extension");
    const client = new Client(config, undefined, mockAuthFactory);

    assert.ok(client);
    assert.strictEqual(config.name, "test-extension");
  });

  test("ServiceConfig integrates with Service", () => {
    // Integration test: ServiceConfig objects work end-to-end with Service
    const config = new ServiceConfig("test-service");
    const service = new Service(config, undefined, mockAuthFactory);

    assert.ok(service);
    assert.strictEqual(config.name, "test-service");
  });

  test("Multiple services use different configs", () => {
    // Integration test: Multiple services can be created with separate configs
    const agentConfig = new ServiceConfig("agent");
    const vectorConfig = new ServiceConfig("vector");

    const agentClient = new Client(agentConfig, undefined, mockAuthFactory);
    const vectorClient = new Client(vectorConfig, undefined, mockAuthFactory);

    assert.ok(agentClient);
    assert.ok(vectorClient);
    assert.notStrictEqual(agentConfig.name, vectorConfig.name);
  });

  test("Extension and Service configs work together", () => {
    // Integration test: Extension and Service configs can coexist
    const extensionConfig = new ExtensionConfig("web");
    const serviceConfig = new ServiceConfig("agent");

    const extensionClient = new Client(
      extensionConfig,
      undefined,
      mockAuthFactory,
    );
    const serviceClient = new Client(serviceConfig, undefined, mockAuthFactory);

    assert.ok(extensionClient);
    assert.ok(serviceClient);
    assert.notStrictEqual(extensionConfig.name, serviceConfig.name);
  });
});
