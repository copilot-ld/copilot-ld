/**
 * @file Release parameters management utilities for CloudFormation stacks
 */

import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

/**
 * Retrieves CloudFormation stack outputs and formats them for parameter files
 * @class StackParameters
 */
export class StackParameters {
  #client;
  #logger;

  /**
   * Creates a new StackParameters instance
   * @param {CloudFormationClient} client - CloudFormation client dependency
   * @param {import("@copilot-ld/libtelemetry").Logger} logger - Logger instance for debug output
   */
  constructor(client, logger) {
    if (!client) {
      throw new Error("CloudFormation client is required");
    }
    this.#client = client;
    this.#logger = logger || { debug: () => {}, error: () => {} };
  }

  /**
   * Retrieves outputs from multiple stacks
   * @param {Record<string, string[]>} map - Map of stack names to output keys
   * @returns {Promise<object[]>} Array of parameter objects compatible with AWS CLI
   * @example
   * const outputs = await stackParameters.retrieve({
   *   'network-stack': ['VpcId', 'SubnetIds'],
   *   'secrets-stack': ['TokenArn']
   * });
   * // Returns: [
   * //   { ParameterKey: 'VpcId', ParameterValue: 'vpc-123' },
   * //   { ParameterKey: 'SubnetIds', ParameterValue: 'subnet-1,subnet-2' },
   * //   { ParameterKey: 'TokenArn', ParameterValue: 'arn:aws:secretsmanager:...' }
   * // ]
   */
  async retrieve(map) {
    const parameters = [];

    for (const [stackName, outputKeys] of Object.entries(map)) {
      this.#logger.debug(
        `Querying stack '${stackName}' for outputs: ${outputKeys.join(", ")}`,
      );
      const outputs = await this.#getOutputs(stackName);

      for (const key of outputKeys) {
        const output = outputs.find((o) => o.OutputKey === key);
        if (output) {
          this.#logger.debug("Retrieve", "Found", {
            key,
            value: output.OutputValue,
          });
          parameters.push({
            ParameterKey: key,
            ParameterValue: output.OutputValue,
          });
        } else {
          this.#logger.error("Retrieve", "Not found", { key });
        }
      }
    }

    return parameters;
  }

  /**
   * Converts a simple key-value map to CloudFormation parameters format
   * @param {Record<string, string>} map - Simple key-value map
   * @returns {object[]} Array of parameter objects compatible with AWS CLI
   * @example
   * const parameters = stackParameters.amend({
   *   'VpcId': 'vpc-123',
   *   'SubnetIds': 'subnet-1,subnet-2'
   * });
   * // Returns: [
   * //   { ParameterKey: 'VpcId', ParameterValue: 'vpc-123' },
   * //   { ParameterKey: 'SubnetIds', ParameterValue: 'subnet-1,subnet-2' }
   * // ]
   */
  amend(map) {
    const parameters = [];

    for (const [key, value] of Object.entries(map)) {
      parameters.push({
        ParameterKey: key,
        ParameterValue: value,
      });
    }

    return parameters;
  }

  /**
   * Gets outputs for a single stack
   * @private
   * @param {string} stackName - CloudFormation stack name
   * @returns {object} Parsed outputs with keys as camelCase
   */
  async #getOutputs(stackName) {
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await this.#client.send(command);

      if (response.Stacks && response.Stacks[0]) {
        const outputs = response.Stacks[0].Outputs || [];
        this.#logger.debug(
          `Retrieved ${outputs.length} outputs from stack '${stackName}'`,
        );
        return outputs;
      }

      this.#logger.debug(`Stack '${stackName}' found but has no outputs`);
      return [];
    } catch (error) {
      this.#logger.debug(
        `Failed to retrieve outputs from stack '${stackName}': ${error.message}`,
      );
      throw error;
    }
  }
}
