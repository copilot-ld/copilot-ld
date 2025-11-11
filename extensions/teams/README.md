# Copilot-LD MS Teams App

Copilot-LD is an intelligent agent leveraging GitHub Copilot, linked data and
retrieval-augmented generation.

This is a MS Teams Extension to the Copilot-LD platform using
[Bot Framework](https://dev.botframework.com).

## 🚀 Setup

### 1. Configuration

Set up environment variables and service configuration:

```sh
cp .env{.example,}
```

For detailed configuration options, see the
[Configuration Guide](docs/configuration.html).

### 2. Install dependencies

```sh
npm install
```

### 3. Start services

#### Local Development Environment

Start the service:

```sh
npm start
```

Expose the local service publicly:

```sh
ngrok http 3978
```

Access the services:

- **Web Extension**: `http://localhost:3978/web`

## 👨‍💻 Development

### Testing

Run unit tests:

```sh
npm test
```

### Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is
a desktop application that allows bot developers to test and debug their bots on
localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.9.0 or greater from
  [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

### Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`

## 📚 Documentation

### Human Documentation

- [Bot Framework Documentation](https://docs.botframework.com)
- [Bot Basics](https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0)
- [Gathering Input Using Prompts](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-prompts?view=azure-bot-service-4.0)
- [Activity processing](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-activity-processing?view=azure-bot-service-4.0)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Azure Bot Service Documentation](https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0)
- [Azure CLI](https://docs.microsoft.com/cli/azure/?view=azure-cli-latest)
- [Azure Portal](https://portal.azure.com)
- [Channels and Bot Connector Service](https://docs.microsoft.com/en-us/azure/bot-service/bot-concepts?view=azure-bot-service-4.0)
- [Deploy your bot to Azure](https://aka.ms/azuredeployment)
