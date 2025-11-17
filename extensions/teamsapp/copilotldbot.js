import { agent, common } from "@copilot-ld/libtype";
import { ActivityHandler, MessageFactory, CardFactory } from "botbuilder";

/**
 * @typedef {import("@copilot-ld/librpc").clients.AgentClient} AgentClient
 */

/**
 * CopilotLdBot is a Microsoft Teams bot that integrates with the Copilot-LD Agent service to process user messages, maintain conversation state, and provide intelligent responses.
 * Handles message and member events, manages resource IDs for conversation tracking, and formats responses for Teams.
 * @augments ActivityHandler
 */
class CopilotLdBot extends ActivityHandler {
  /**
   * Handles the 'configure' command by sending a settings page link to the user.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @returns {Promise<void>}
   */
  async handleConfigureCommand(context) {
    // Use TEAMS_BOT_DOMAIN env variable for the settings URL
    const tenantId = context?.activity?.conversation?.tenantId;
    const settingsUrl = `https://${process.env.TEAMS_BOT_DOMAIN}/settings?tenantId=${encodeURIComponent(tenantId)}`;
    const card = CardFactory.heroCard(
      "Update Your Settings",
      "Click the button below to open your settings page.",
      null,
      [
        {
          type: "openUrl",
          title: "Open Settings",
          value: settingsUrl,
        },
      ],
    );
    await context.sendActivity({ attachments: [card] });
  }
  /**
   * Creates a new CopilotLdBot instance and sets up event handlers for messages and member additions.
   * @param {AgentClient} agentClient - An instance of AgentClient for communicating with the Agent service.
   * @param {object} config - The extension configuration object.
   */
  constructor(agentClient, config) {
    super();
    if (!agentClient) throw new Error("agentClient is required");
    if (!config) throw new Error("config is required");
    this.agentClient = agentClient;
    this.config = config;
    this.onMessage(this.handleMessage.bind(this));
    this.onMembersAdded(this.handleMembersAdded.bind(this));
    /**
     * Map of resource IDs keyed by tenantId:recipientId for conversation tracking.
     * @type {Map<string, string>}
     */
    this.resourceIds = new Map();
  }

  /**
   * Retrieves the resourceId for a given tenantId and recipientId combination.
   * Used to maintain conversation context across messages.
   * @param {string} tenantId - The tenant ID for the conversation.
   * @param {string} recipientId - The recipient (bot) ID.
   * @returns {string|null} The resourceId if found, otherwise null.
   */
  getResourceId(tenantId, recipientId) {
    const key = `${tenantId}:${recipientId}`;
    return this.resourceIds.has(key) ? this.resourceIds.get(key) : null;
  }

  /**
   * Stores the resourceId for a given tenantId and recipientId combination.
   * Used to track conversation state for each user/bot pair.
   * @param {string} tenantId - The tenant ID for the conversation.
   * @param {string} recipientId - The recipient (bot) ID.
   * @param {string} resourceId - The resource ID to associate with this conversation.
   * @returns {void}
   */
  setResourceId(tenantId, recipientId, resourceId) {
    const key = `${tenantId}:${recipientId}`;
    this.resourceIds.set(key, resourceId);
  }

  /**
   * Handles incoming message activities, sends user input to the Copilot-LD Agent service, and replies with the agent's response.
   * Maintains conversation state using resource IDs and formats responses for Teams.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @param {Function} next - The next middleware function in the pipeline.
   * @returns {Promise<void>}
   */
  async handleMessage(context, next) {
    const text = context.activity.text?.trim().toLowerCase();
    // Check for configure command
    if (text === "configure" || text === "/configure") {
      await this.handleConfigureCommand(context);
      await next();
      return;
    }

    const requestParams = agent.AgentRequest.fromObject({
      messages: [
        common.Message.fromObject({
          role: "user",
          content: context.activity.text,
        }),
      ],
      github_token: await this.config.githubToken(),
      resource_id: this.getResourceId(
        context.activity.conversation.tenantId,
        context.activity.recipient.id,
      ),
    });

    // Debug logging for context and request
    console.log("TenantId:", context.activity.conversation.tenantId);
    console.log("Recipient.id:", context.activity.recipient.id);
    console.log("Received message:", context.activity.text);

    const response = await this.agentClient.ProcessRequest(requestParams);
    let reply = { role: "assistant", content: null };

    if (response.choices?.length > 0 && response.choices[0]?.message?.content) {
      reply.content = String(response.choices[0].message.content);
    }

    this.setResourceId(
      context.activity.conversation.tenantId,
      context.activity.recipient.id,
      response.resource_id,
    );

    await context.sendActivity(
      MessageFactory.text(reply.content, reply.content),
    );
    await next();
  }

  /**
   * Handles members added event by sending a welcome message to new members in the conversation.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @param {Function} next - The next middleware function in the pipeline.
   * @returns {Promise<void>}
   */
  async handleMembersAdded(context, next) {
    const membersAdded = context.activity.membersAdded;
    const welcomeText = "Hello and welcome!";
    for (const element of membersAdded) {
      if (element.id !== context.activity.recipient.id) {
        await context.sendActivity(
          MessageFactory.text(welcomeText, welcomeText),
        );
      }
    }
    await next();
  }
}

export { CopilotLdBot };
