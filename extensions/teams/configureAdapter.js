import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
} from "botbuilder";

/**
 * Configures and returns a Microsoft Bot Framework CloudAdapter for Teams bots.
 * Sets up authentication using extension configuration and attaches a default error handler for turn errors.
 * @param {object} extensionConfig - Extension configuration
 * @returns {CloudAdapter} Configured CloudAdapter instance for handling bot activities.
 */
export function configureAdapter(extensionConfig) {
  if (!extensionConfig) throw new Error("extensionConfig is required");

  // Create credentials factory from extension configuration
  const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: extensionConfig.microsoft_app_id,
    MicrosoftAppPassword: extensionConfig.microsoft_app_password,
    MicrosoftAppType: extensionConfig.microsoft_app_type,
    MicrosoftAppTenantId: extensionConfig.microsoft_app_tenant_id,
  });

  // Create bot framework authentication using credentials
  const botFrameworkAuthentication =
    createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

  /**
   * Handles errors that occur during a bot turn by logging and notifying the user.
   * @param {import('botbuilder').TurnContext} context - The turn context for the activity.
   * @param {Error} error - The error that occurred during the turn.
   * @returns {Promise<void>}
   */
  const onTurnErrorHandler = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    await context.sendTraceActivity(
      "OnTurnError Trace",
      `${error}`,
      "https://www.botframework.com/schemas/error",
      "TurnError",
    );

    await context.sendActivity("The bot encountered an error or bug.");
    await context.sendActivity(
      "To continue to run this bot, please fix the bot source code.",
    );
  };

  // Create the CloudAdapter and attach the error handler
  const adapter = new CloudAdapter(botFrameworkAuthentication);
  adapter.onTurnError = onTurnErrorHandler;

  return adapter;
}
