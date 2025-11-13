import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
} from "botbuilder";

/**
 * Configures and returns a Microsoft Bot Framework CloudAdapter for Teams bots.
 * Sets up authentication using environment variables and attaches a default error handler for turn errors.
 * @returns {CloudAdapter} Configured CloudAdapter instance for handling bot activities.
 */
export function configureAdapter() {
  // Create credentials factory from environment variables
  const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId,
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
