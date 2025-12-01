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
   * @param {import('@copilot-ld/libconfig').Config} config - The extension configuration object.
   * @param {import('./tenant-config-repository.js').TenantConfigRepository} tenantConfigRepository - Repository for tenant configuration lookup.
   * @param {import('./tenant-secret-encryption.js').TenantSecretEncryption} tenantSecretEncryption - Encryption service for decrypting tenant secrets.
   */
  constructor(config, tenantConfigRepository, tenantSecretEncryption) {
    super();
    if (!config) throw new Error("config is required");
    if (!tenantConfigRepository)
      throw new Error("tenantConfigRepository is required");
    if (!tenantSecretEncryption)
      throw new Error("tenantSecretEncryption is required");
    this.config = config;
    this.tenantConfigRepository = tenantConfigRepository;
    this.tenantSecretEncryption = tenantSecretEncryption;
    this.onMessage(this.handleMessage.bind(this));
    this.onMembersAdded(this.handleMembersAdded.bind(this));
    /**
     * Map of resource IDs keyed by tenantId:recipientId for conversation tracking.
     * @type {Map<string, string>}
     */
    this.resourceIds = new Map();
  }

  /**
   * Handles incoming message activities using the Teams Agent API, sends user input through HTTP to a private agent service, and replies with the response.
   * Maintains conversation state using resource IDs and formats responses for Teams.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @param {Function} next - The next middleware function in the pipeline.
   * @returns {Promise<void>}
   */
  async handleMessage(context, next) {
    if (this.#isConfigureCommand(context.activity.text)) {
      await this.handleConfigureCommand(context);
      await next();
      return;
    }

    const tenantId = context.activity.conversation.tenantId;
    const recipientId = context.activity.recipient.id;
    const tenantRecipientKey = `${tenantId}:${recipientId}`;

    const resourceId = this.getResourceId(tenantId, recipientId);

    console.log(
      `New message received (API): TenantId: ${tenantId}, RecipientId: ${recipientId}, ResourceId: ${resourceId}`,
    );
    console.log(`Message: ${context.activity.text}`);

    try {
      const tenantConfig = await this.tenantConfigRepository.get(tenantId);

      if (!tenantConfig) {
        console.error("No configuration found for tenant:", tenantId);
        await context.sendActivity(
          MessageFactory.text(
            "I am not configured to talk to your private Copilot-LD agent yet. Please contact your administrator to configure me using the /configure command.",
          ),
        );
        await next();
        return;
      }

      const authToken = this.tenantSecretEncryption.decrypt(
        tenantId,
        tenantConfig.encryptedSecret,
      );

      const response = await this.#callTeamsAgent(
        context.activity.text,
        resourceId,
        tenantConfig.host,
        tenantConfig.port,
        authToken,
      );

      console.log(
        `Teams Agent request completed for tenant/recipient: ${tenantRecipientKey}`,
      );

      const replyContent = response.reply?.choices?.[0]?.message?.content;
      const newResourceId = response.reply?.resource_id;

      if (newResourceId) {
        this.#setResourceId(tenantId, recipientId, newResourceId);
      }

      if (replyContent) {
        await context.sendActivity(
          MessageFactory.text(String(replyContent), String(replyContent)),
        );
      } else {
        await context.sendActivity(
          MessageFactory.text(
            "I received your message but couldn't generate a response.",
          ),
        );
      }
    } catch (error) {
      console.error("Error calling Teams Agent:", error);
      console.error("Error stack:", error.stack);
      await context.sendActivity(
        MessageFactory.text(
          "Sorry, I encountered an error processing your request. Please try again.",
        ),
      );
    }

    await next();
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
  #setResourceId(tenantId, recipientId, resourceId) {
    const key = `${tenantId}:${recipientId}`;
    this.resourceIds.set(key, resourceId);
  }

  /**
   * Checks if the message text is a configure command.
   * @param {string} text - The message text to check.
   * @returns {boolean} True if the text is a configure command.
   */
  #isConfigureCommand(text) {
    const normalizedText = text?.trim().toLowerCase();
    return (
      normalizedText === "configure" ||
      normalizedText === "/configure" ||
      normalizedText === "settings" ||
      normalizedText === "/settings"
    );
  }

  /**
   * Calls the Teams Agent service with a message and authentication.
   * @param {string} message - The user message to send.
   * @param {string|null} resourceId - The resource ID for conversation tracking.
   * @param {string} host - The host address of the Teams Agent service.
   * @param {number} port - The port number of the Teams Agent service.
   * @param {string} authToken - The authentication token for the Teams Agent service.
   * @returns {Promise<object>} The response from the Teams Agent service.
   */
  async #callTeamsAgent(message, resourceId, host, port, authToken) {
    const url = `http://${host}:${port}/api/messages`;

    const requestBody = {
      message,
      resourceId,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Teams Agent request failed: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
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
