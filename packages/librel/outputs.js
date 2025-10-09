/**
 * @file Release outputs management utilities for CloudFormation stacks
 */

import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

/**
 * Retrieves CloudFormation stack outputs and formats them for parameter files
 * @class StackOutputs
 */
export class StackOutputs {
  #client;

  /**
   * Creates a new StackOutputs instance
   * @param {CloudFormationClient} client - CloudFormation client dependency
   */
  constructor(client) {
    if (!client) throw new Error("CloudFormation client is required");
    this.#client = client;
  }

  /**
   * Retrieves outputs from multiple stacks
   * @param {Record<string, string[]>} map - Map of stack names to output keys
   * @returns {Promise<object[]>} Array of parameter objects compatible with AWS CLI
   * @example
   * const outputs = await stackOutputs.retrieve({
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
      const outputs = await this.#getOutputs(stackName);

      for (const key of outputKeys) {
        const output = outputs.find((o) => o.OutputKey === key);
        if (output) {
          parameters.push({
            ParameterKey: key,
            ParameterValue: output.OutputValue,
          });
        }
      }
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
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await this.#client.send(command);

    if (response.Stacks && response.Stacks[0]) {
      return response.Stacks[0].Outputs || [];
    }

    return [];
  }
}
