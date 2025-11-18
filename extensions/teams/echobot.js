import { ActivityHandler, MessageFactory } from "botbuilder";

/**
 * EchoBot is a simple Microsoft Bot Framework bot that replies with the same message it receives and welcomes new members.
 * @augments ActivityHandler
 */
export class EchoBot extends ActivityHandler {
  /**
   * Creates a new EchoBot instance and sets up message and member event handlers.
   */
  constructor() {
    super();
    this.onMessage(this.handleMessage.bind(this));
    this.onMembersAdded(this.handleMembersAdded.bind(this));
  }

  /**
   * Handles incoming message activities by echoing the user's message back to them.
   * @param {import('botbuilder').TurnContext} context - The turn context for the incoming activity.
   * @param {Function} next - The next middleware function in the pipeline.
   * @returns {Promise<void>}
   */
  async handleMessage(context, next) {
    const replyText = `Echo: ${context.activity.text}`;
    await context.sendActivity(MessageFactory.text(replyText, replyText));
    await next();
  }

  /**
   * Welcomes new members added to the conversation.
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
