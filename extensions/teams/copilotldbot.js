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
   * Creates a new CopilotLdBot instance and sets up event handlers for messages and member additions.
   * @param {import('./tenant-client-service.js').TenantClientService} tenantClientService - Service for managing tenant-specific AgentClient instances.
   * @param {import('@copilot-ld/libconfig').Config} config - The extension configuration object.
   */
  constructor(tenantClientService, config) {
    super();
    if (!tenantClientService)
      throw new Error("tenantClientService is required");
    if (!config) throw new Error("config is required");
    this.tenantClientService = tenantClientService;
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
      resource_id: this.#getResourceId(
        context.activity.conversation.tenantId,
        context.activity.recipient.id,
      ),
    });

    const tenantId = context.activity.conversation.tenantId;

    // Debug logging for context and request
    console.log("TenantId:", tenantId);
    console.log("Recipient.id:", context.activity.recipient.id);
    console.log("Received message:", context.activity.text);

    const client = await this.tenantClientService.getTenantClient(tenantId);
    const response = await client.ProcessRequest(requestParams);
    let reply = { role: "assistant", content: null };

    if (response.choices?.length > 0 && response.choices[0]?.message?.content) {
      reply.content = String(response.choices[0].message.content);
    }

    this.#setResourceId(
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
   * Retrieves the resourceId for a given tenantId and recipientId combination.
   * Used to maintain conversation context across messages.
   * @param {string} tenantId - The tenant ID for the conversation.
   * @param {string} recipientId - The recipient (bot) ID.
   * @returns {string|null} The resourceId if found, otherwise null.
   */
  #getResourceId(tenantId, recipientId) {
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
  #setResourceId(tenantId, recipientId, resourceId) {
    const key = `${tenantId}:${recipientId}`;
    this.resourceIds.set(key, resourceId);
  }

  /**
   * Handles the 'configure' command by sending a settings page link to the user.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @returns {Promise<void>}
   */
  async handleConfigureCommand(context) {
    const tenantId = context?.activity?.conversation?.tenantId;
    const card = CardFactory.heroCard(
      "Update Your Settings",
      "Click the button below to open your settings page.",
      null,
      [
        {
          type: "invoke",
          title: "Open Settings",
          value: {
            type: "task/fetch",
            tenantId: tenantId,
          },
        },
      ],
    );
    await context.sendActivity({ attachments: [card] });
  }

  /**
   * Handles task module fetch requests to open the settings page in a dialog.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @returns {Promise<import('botbuilder').InvokeResponse>} The invoke response with task module configuration.
   */
  async handleTaskModuleFetch(context) {
    const tenantId =
      context.activity.value?.tenantId ||
      context?.activity?.conversation?.tenantId;
    console.log("Handling task/fetch for tenantId:", tenantId);

    const settingsUrl = `https://${process.env.TEAMS_BOT_DOMAIN}/settings`;

    return {
      status: 200,
      body: {
        task: {
          type: "continue",
          value: {
            title: "Settings",
            height: 600,
            width: 500,
            url: settingsUrl,
          },
        },
      },
    };
  }

  /**
   * Handles incoming invoke activities, including task module fetch requests.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @returns {Promise<import('botbuilder').InvokeResponse>} The invoke response.
   */
  async onInvokeActivity(context) {
    if (context.activity.name === "task/fetch") {
      return await this.handleTaskModuleFetch(context);
    }
    return await super.onInvokeActivity(context);
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
