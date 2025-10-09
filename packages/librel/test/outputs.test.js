/**
 * @file Tests for release outputs management utilities
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { StackOutputs } from "../outputs.js";

describe("StackOutputs", () => {
  let mockClient;
  let stackOutputs;

  describe("constructor", () => {
    it("should throw error when client is not provided", () => {
      assert.throws(() => new StackOutputs(), {
        message: "CloudFormation client is required",
      });
    });

    it("should throw error when client is null", () => {
      assert.throws(() => new StackOutputs(null), {
        message: "CloudFormation client is required",
      });
    });
  });

  beforeEach(() => {
    mockClient = {
      send: async (_command) => {
        // Mock implementation will be set per test
        throw new Error("Mock not configured");
      },
    };
    stackOutputs = new StackOutputs(mockClient);
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

      const result = await stackOutputs.retrieve({
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

      const result = await stackOutputs.retrieve({
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

      const result = await stackOutputs.retrieve({
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

      const result = await stackOutputs.retrieve({
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
          await stackOutputs.retrieve({
            "missing-stack": ["VpcId"],
          });
        },
        { message: "Stack not found" },
      );
    });
  });
});
