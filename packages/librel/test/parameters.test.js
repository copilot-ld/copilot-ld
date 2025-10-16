/* eslint-env node */
/**
 * @file Tests for release parameters management utilities
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { StackParameters } from "../parameters.js";

describe("StackParameters", () => {
  let mockClient;
  let stackParameters;

  describe("constructor", () => {
    it("should require a client", () => {
      assert.throws(() => new StackParameters(null), {
        message: "CloudFormation client is required",
      });
    });

    it("should require a client when undefined", () => {
      assert.throws(() => new StackParameters(), {
        message: "CloudFormation client is required",
      });
    });

    it("should accept a valid client", () => {
      const client = { send: () => {} };
      const stackParameters = new StackParameters(client);
      assert.ok(stackParameters);
    });
  });

  describe("amend", () => {
    it("should convert simple key-value map to parameters format", () => {
      const stackParametersForAmend = new StackParameters({ send: () => {} });

      const input = {
        VpcId: "vpc-123",
        Environment: "production",
        Region: "us-east-1",
      };

      const result = stackParametersForAmend.amend(input);

      assert.deepStrictEqual(result, [
        { ParameterKey: "VpcId", ParameterValue: "vpc-123" },
        { ParameterKey: "Environment", ParameterValue: "production" },
        { ParameterKey: "Region", ParameterValue: "us-east-1" },
      ]);
    });

    it("should handle empty map", () => {
      const stackParametersForAmend = new StackParameters({ send: () => {} });

      const result = stackParametersForAmend.amend({});

      assert.deepStrictEqual(result, []);
    });

    it("should handle string values with special characters", () => {
      const stackParametersForAmend = new StackParameters({ send: () => {} });

      const input = {
        DatabaseUrl: "postgres://user:pass@host:5432/db",
        SubnetIds: "subnet-1,subnet-2,subnet-3",
        Description: "A test environment with special chars: !@#$%",
      };

      const result = stackParametersForAmend.amend(input);

      assert.deepStrictEqual(result, [
        {
          ParameterKey: "DatabaseUrl",
          ParameterValue: "postgres://user:pass@host:5432/db",
        },
        {
          ParameterKey: "SubnetIds",
          ParameterValue: "subnet-1,subnet-2,subnet-3",
        },
        {
          ParameterKey: "Description",
          ParameterValue: "A test environment with special chars: !@#$%",
        },
      ]);
    });

    it("should preserve parameter order from input map", () => {
      const stackParametersForAmend = new StackParameters({ send: () => {} });

      const input = {
        ZLast: "last",
        AFirst: "first",
        MMiddle: "middle",
      };

      const result = stackParametersForAmend.amend(input);

      // Object.entries preserves insertion order in modern JavaScript
      assert.deepStrictEqual(result, [
        { ParameterKey: "ZLast", ParameterValue: "last" },
        { ParameterKey: "AFirst", ParameterValue: "first" },
        { ParameterKey: "MMiddle", ParameterValue: "middle" },
      ]);
    });
  });

  beforeEach(() => {
    mockClient = {
      send: async (_command) => {
        // Mock implementation will be set per test
        throw new Error("Mock not configured");
      },
    };
    stackParameters = new StackParameters(mockClient);
  });

  describe("retrieve", () => {
    it("should format stack outputs as parameters", async () => {
      // Mock CloudFormation response
      mockClient.send = async () => ({
        Stacks: [
          {
            Outputs: [
              { OutputKey: "VpcId", OutputValue: "vpc-123" },
              { OutputKey: "SubnetIds", OutputValue: "subnet-1,subnet-2" },
            ],
          },
        ],
      });

      const result = await stackParameters.retrieve({
        "network-stack": ["VpcId", "SubnetIds"],
      });

      assert.deepStrictEqual(result, [
        { ParameterKey: "VpcId", ParameterValue: "vpc-123" },
        { ParameterKey: "SubnetIds", ParameterValue: "subnet-1,subnet-2" },
      ]);
    });

    it("should handle multiple stacks", async () => {
      let callCount = 0;
      mockClient.send = async () => {
        callCount++;
        if (callCount === 1) {
          return {
            Stacks: [
              {
                Outputs: [{ OutputKey: "VpcId", OutputValue: "vpc-123" }],
              },
            ],
          };
        } else {
          return {
            Stacks: [
              {
                Outputs: [
                  {
                    OutputKey: "TokenArn",
                    OutputValue: "arn:aws:secretsmanager:...",
                  },
                ],
              },
            ],
          };
        }
      };

      const result = await stackParameters.retrieve({
        "network-stack": ["VpcId"],
        "secrets-stack": ["TokenArn"],
      });

      assert.deepStrictEqual(result, [
        { ParameterKey: "VpcId", ParameterValue: "vpc-123" },
        {
          ParameterKey: "TokenArn",
          ParameterValue: "arn:aws:secretsmanager:...",
        },
      ]);
    });

    it("should skip missing outputs", async () => {
      mockClient.send = async () => ({
        Stacks: [
          {
            Outputs: [{ OutputKey: "VpcId", OutputValue: "vpc-123" }],
          },
        ],
      });

      const result = await stackParameters.retrieve({
        "network-stack": ["VpcId", "NonExistentKey"],
      });

      assert.deepStrictEqual(result, [
        { ParameterKey: "VpcId", ParameterValue: "vpc-123" },
      ]);
    });

    it("should handle empty stacks", async () => {
      mockClient.send = async () => ({
        Stacks: [{}],
      });

      const result = await stackParameters.retrieve({
        "empty-stack": ["VpcId"],
      });

      assert.deepStrictEqual(result, []);
    });

    it("should propagate client errors", async () => {
      mockClient.send = async () => {
        throw new Error("Stack not found");
      };

      await assert.rejects(
        async () => {
          await stackParameters.retrieve({
            "missing-stack": ["VpcId"],
          });
        },
        { message: "Stack not found" },
      );
    });
  });
});
