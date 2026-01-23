---
title: Microsoft Teams Extension
description: |
  The Microsoft Teams extension brings Copilot-LD's intelligent agent
  capabilities directly into Teams conversations. This guide covers
  architecture, configuration, deployment, and administration of the Teams bot.
toc: true
---

## Overview

The Teams extension integrates Copilot-LD with Microsoft Teams through the Bot
Framework, enabling natural language conversations with the platform's knowledge
graph and RAG capabilities. Users interact with the bot through Teams chats,
receiving intelligent responses grounded in the organization's linked data
knowledge base.

### Key Features

- **Multi-Tenant Architecture**: Isolated configurations per Teams tenant with
  encrypted storage
- **Bot Framework Integration**: Native Teams experience using Microsoft Bot
  Builder SDK
- **Persistent Conversations**: Maintains conversation state with resource-based
  tracking
- **Admin Configuration**: Settings panel for tenant administrators to configure
  agent connectivity
- **HTML Formatting**: Rich message formatting with markdown-to-HTML conversion
- **Static Tabs**: Built-in About, Messages, and Settings tabs for enhanced UX

## Architecture

The Teams extension operates as a stateless HTTP server that bridges Microsoft
Bot Framework activities with the Copilot-LD Agent service. Communication with
the agent occurs through the API extension, which exposes a REST endpoint for
Teams bot messages. Each tenant organization must deploy their own API extension
and agent service to maintain isolation and security.

### Components

**TeamsServer**: HTTP server handling Bot Framework webhook callbacks and static
content delivery. Manages routing for bot messages, configuration endpoints, and
tab content.

**CopilotLdBot**: Bot logic implementing ActivityHandler to process message
events. Retrieves tenant configuration, maintains conversation resource IDs, and
formats responses for Teams.

**TenantClientService**: Manages tenant-specific configurations including agent
host, port, and encrypted authentication secrets. Provides isolation between
different Teams tenants.

**TenantConfigRepository**: JSONL-based storage for tenant configurations with
automatic persistence to disk or S3. Each tenant's settings stored separately
under `teams-tenant-configs/`.

**TenantSecretEncryption**: Encrypts authentication tokens using AES-256-GCM
with tenant-specific keys derived from a master secret and tenant ID. Ensures
secrets cannot be decrypted across tenant boundaries.

**HtmlRenderer**: Serves static HTML, CSS, and JavaScript for Teams tabs
including About, Messages, and Settings pages.

### Secret Encryption

The Teams extension implements envelope encryption with tenant-specific key
derivation to securely store authentication tokens. This ensures that each
tenant's secrets are cryptographically isolated, even if stored in the same
repository.

**Master Key**: A 256-bit (32-byte) secret key configured via the
`TEAMS_SECRET_KEY` environment variable. This master key never directly encrypts
tenant secrets but serves as the root of trust for deriving tenant-specific
keys. The master key can be rotated using versioning—old versions are retained
to decrypt existing secrets, while new encryptions use the current version.

**Tenant Key Derivation**: For each encryption operation, a random 32-byte salt
is generated and combined with the master key and tenant ID using HKDF
(HMAC-based Key Derivation Function) with SHA-256. This produces a unique
256-bit encryption key bound to that specific tenant and salt. The derivation
uses the tenant ID as contextual information (`tenant-secret:{tenantId}`),
ensuring keys cannot be reused across tenants even with the same salt.

**Encryption Process**: Each secret is encrypted using AES-256-GCM
(Galois/Counter Mode) with:

- **Random Nonce**: 12-byte initialization vector generated per encryption
- **Authentication Tag**: 16-byte tag for authenticated encryption (prevents
  tampering)
- **Additional Authenticated Data (AAD)**: Includes tenant ID, key version, and
  timestamp
- **Key Material**: Derived tenant-specific key unique to this operation

The encrypted secret object contains: `ciphertext`, `nonce`, `authTag`,
`keySalt`, `aad`, `keyVersion`, `algorithm`, and `encryptedAt`. All components
are Base64-encoded for storage.

**Decryption Process**: To decrypt, the system:

1. Retrieves the master key for the specified `keyVersion`
2. Re-derives the tenant key using the stored `keySalt` and tenant ID
3. Validates the AAD and authentication tag before decrypting
4. Returns the plaintext secret or throws an error if authentication fails

**Key Rotation**: Master keys can be rotated without re-encrypting all secrets
immediately. The `rotate()` method decrypts with the old key version and
re-encrypts with the current version. Old master keys remain available via
`oldMasterKeys` configuration until all secrets are migrated.

**Security Properties**:

- **Tenant Isolation**: Each tenant's derived key is cryptographically unique
- **Forward Secrecy**: Compromising one tenant key doesn't affect others
- **Authentication**: GCM mode ensures tampering detection
- **Key Rotation**: Supports seamless master key updates
- **Memory Safety**: Sensitive key material is zeroed after use

### Request Flow

1. **Incoming Message**: Teams sends Bot Framework activity to `/api/messages`
2. **Tenant Lookup**: Extract tenant ID from JWT bearer token in request headers
3. **Configuration Retrieval**: Load tenant config (host, port, encrypted
   secret) from repository
4. **Authentication**: Decrypt tenant secret for API extension authentication
5. **Resource ID Resolution**: Retrieve or create conversation resource ID for
   state tracking
6. **API Extension Call**: HTTP POST to tenant's configured API extension at
   `/api/agent/teamsagent` endpoint with message, correlation ID, and auth token
7. **Agent Processing**: API extension forwards request to Agent service via
   gRPC for processing
8. **Response Formatting**: Convert markdown response to HTML and send back
   through Bot Framework
9. **Resource ID Update**: Store new resource ID if conversation state changed

### Multi-Tenant Isolation

Each Teams tenant maintains independent configuration:

- **Separate Agent**: Each tenant connects to their own private Copilot-LD
  instance
- **Encrypted Secrets**: Authentication tokens encrypted with tenant-specific
  keys
- **Isolated Storage**: Tenant configs and resource IDs stored in separate
  namespaces
- **Authorization**: Settings endpoints require tenant admin role verification

## Configuration

### Environment Variables

```bash
# Teams Extension Server
EXTENSION_TEAMS_HOST=localhost
EXTENSION_TEAMS_PORT=3978

# Teams Bot Framework
TEAMS_BOT_ID=your-bot-id-from-azure
TEAMS_BOT_PASSWORD=your-bot-password-from-azure
TEAMS_BOT_DOMAIN=your-public-domain.ngrok-free.dev

# Tenant Secret Encryption
TEAMS_SECRET_KEY=your-256-bit-secret-key-for-encryption
```

### Azure Bot Registration

Register the bot in Azure Bot Service to obtain credentials:

1. **Create Bot Registration**: Azure Portal → Bot Services → Create
2. **Configure Messaging Endpoint**: Set to
   `https://your-domain.com/api/messages`
3. **Generate Credentials**: Copy App ID (TEAMS_BOT_ID) and password
   (TEAMS_BOT_PASSWORD)
4. **Enable Teams Channel**: Add Microsoft Teams channel in bot configuration

### Teams App Manifest

The manifest (`extensions/teams/manifest/manifest.json`) defines bot
capabilities:

```json
{
  "manifestVersion": "1.24",
  "id": "unique-app-id",
  "bots": [
    {
      "botId": "${{TEAMS_BOT_ID}}",
      "scopes": ["personal", "team", "groupchat"]
    }
  ],
  "staticTabs": [
    {
      "entityId": "messages-tab-id",
      "name": "Messages",
      "contentUrl": "https://${{TEAMS_BOT_DOMAIN}}/messages"
    },
    {
      "entityId": "settings-tab-id",
      "name": "Settings",
      "contentUrl": "https://${{TEAMS_BOT_DOMAIN}}/settings"
    }
  ]
}
```

**Key Configuration Points**:

- `bots[].botId`: Must match `TEAMS_BOT_ID` from Azure registration
- `validDomains`: Include bot domain and `token.botframework.com`
- `webApplicationInfo`: Configure for Single Sign-On if needed
- `staticTabs`: Define content URLs for built-in tabs

### Tenant Configuration

Each Teams tenant configures their agent connection through the Settings tab:

**Host**: Hostname or IP address of the tenant's Copilot-LD agent (e.g.,
`agent.example.com`)

**Port**: Agent service port number (typically `3002`)

**Secret**: Authentication token for agent API calls (encrypted before storage)

Configurations are saved to `data/teams-tenant-configs/{tenantId}.jsonl` and
encrypted using the `TEAMS_SECRET_KEY`.

## Deployment

### Local Development

Start the Teams extension for local testing with ngrok:

```bash
# Start the service
cd extensions/teams
npm install
make rc-start

# In separate terminal, expose publicly
npm run ngrok
```

Copy the ngrok HTTPS URL and update:

- Azure Bot messaging endpoint
- `TEAMS_BOT_DOMAIN` environment variable
- Teams app manifest `validDomains` and tab URLs

### Bot Framework Emulator

Test bot interactions locally without Teams:

1. Download
   [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases)
2. Open Bot → Enter `http://localhost:3978/api/messages`
3. Provide `TEAMS_BOT_ID` and `TEAMS_BOT_PASSWORD` if required
4. Send test messages to verify bot responses

### Docker Deployment

The Teams extension uses the unified Dockerfile build process:

```bash
# Build Teams extension image
make docker-build

# Start Teams service with Docker Compose
make docker-up-teams
```

Configuration in `docker-compose.yml`:

```yaml
teams:
  build:
    context: .
    args:
      COMPONENT: extensions/teams
  ports:
    - "3978:3978"
  environment:
    - EXTENSION_TEAMS_HOST=0.0.0.0
    - EXTENSION_TEAMS_PORT=3978
    - TEAMS_BOT_ID=${TEAMS_BOT_ID}
    - TEAMS_BOT_PASSWORD=${TEAMS_BOT_PASSWORD}
    - TEAMS_SECRET_KEY=${TEAMS_SECRET_KEY}
```

### Production Considerations

**HTTPS Requirement**: Microsoft Bot Framework requires HTTPS endpoints. Use
load balancer with SSL termination or reverse proxy.

**Webhook Reliability**: Bot Framework expects 200 OK responses within 15
seconds. Implement timeout handling for long-running agent operations.

**Secret Management**: Store `TEAMS_SECRET_KEY` in secure secret management
service (AWS Secrets Manager, Azure Key Vault, etc.). Rotate encryption keys
periodically.

**Monitoring**: Track bot response times, error rates, and tenant configuration
changes. Enable Application Insights for Bot Framework telemetry.

## Administration

### Tenant Configuration Management

**Access Control**: Only users with the `Settings:Update` scope (tenant admins)
can modify configuration. Authorization validated via JWT token claims.

**Configuration API**:

```bash
# Get current configuration (requires admin auth)
GET /api/settings
Authorization: Bearer <teams-jwt-token>

# Save configuration (requires admin auth)
POST /api/settings
Authorization: Bearer <teams-jwt-token>
Content-Type: application/json

{
  "host": "agent.example.com",
  "port": 3002,
  "secret": "authentication-token"
}
```

**Settings Tab**: Provides web UI for configuration management accessible from
Teams app tabs. Automatically includes authentication token from Teams context.

### Resource ID Management

Conversation state tracked using resource IDs stored in
`data/teams-resource-ids/{tenantId}:{recipientId}.jsonl`:

```json
{
  "resourceId": "common.Conversation.uuid-v4",
  "timestamp": "2025-12-15T10:30:00Z"
}
```

Resource IDs enable the Agent service to maintain conversation continuity across
multiple messages. Each tenant-recipient pair gets a unique resource ID.

### Command Interface

The bot supports a `/configure` command (reserved for future admin
functionality):

```
/configure show     # Display current tenant configuration
/configure reset    # Clear tenant configuration
```

Currently, configuration is managed exclusively through the Settings tab web UI.

### Troubleshooting

**Bot Not Responding**:

- Verify messaging endpoint in Azure Bot configuration
- Check Bot Framework adapter credentials match Azure registration
- Confirm tenant configuration saved correctly
- Review logs for authentication or network errors

**Configuration Not Saving**:

- Ensure user has tenant admin role with `Settings:Update` scope
- Verify `TEAMS_SECRET_KEY` environment variable is set
- Check storage backend is accessible (local filesystem or S3)

**Authentication Failures**:

- Validate tenant secret is correctly encrypted/decrypted
- Confirm agent endpoint (host/port) is reachable from Teams extension
- Verify authentication token format matches agent expectations

**Resource ID Issues**:

- Check `teams-resource-ids` storage is writable
- Ensure resource ID format matches agent expectations
  (`common.Conversation.{uuid}`)
- Review correlation ID construction in logs

## API Reference

### Bot Endpoints

**POST /api/messages**: Bot Framework activity webhook. Accepts Bot Framework
Activity JSON and returns 200 OK. Processes message activities through
`CopilotLdBot` handler.

**GET /api/settings**: Retrieve tenant configuration. Requires admin
authorization. Returns `{host, port}` (secret not included).

**POST /api/settings**: Save tenant configuration. Requires admin authorization.
Accepts `{host, port, secret}` JSON body.

### Static Tab Endpoints

**GET /about**: Serves about.html static page with bot information

**GET /messages**: Serves messages.html conversation history interface

**GET /settings**: Serves settings.html configuration form for tenant admins

**GET /main.css**: Serves stylesheet for tab pages

**GET /settings.js**: Serves client-side JavaScript for settings form

### Agent Communication

Teams extension calls tenant's configured agent via HTTP POST:

```bash
POST https://{tenant-host}:{tenant-port}/api/agent/teamsagent
Content-Type: application/json
Authorization: Bearer {tenant-secret}

{
  "message": "user message text",
  "correlationId": "{tenantId}:{recipientId}:{resourceId}",
  "resourceId": "common.Conversation.uuid-or-null"
}
```

Response format:

```json
{
  "reply": {
    "messages": [
      {
        "role": "assistant",
        "content": "markdown response text"
      }
    ],
    "resource_id": "common.Conversation.uuid"
  }
}
```

## Development

### Project Structure

```
extensions/teams/
├── index.js                    # Entry point
├── server.js                   # TeamsServer class
├── package.json               # Dependencies
├── CHANGELOG.md               # Component changelog
├── lib/
│   ├── adapter/               # Bot Framework adapter config
│   ├── auth.js                # JWT parsing and authorization
│   ├── bot/
│   │   └── copilot-ld-bot.js # CopilotLdBot activity handler
│   ├── html/
│   │   ├── renderer.js        # Static file serving
│   │   ├── about.html         # About tab page
│   │   ├── messages.html      # Messages tab page
│   │   ├── settings.html      # Settings tab page
│   │   ├── settings.js        # Settings form logic
│   │   └── main.css           # Tab stylesheet
│   ├── http.js                # HTTP utilities
│   └── tenant/
│       ├── client-service.js  # Tenant config management
│       ├── config-repository.js # JSONL storage for configs
│       └── secret-encryption.js # AES-256-GCM encryption
├── manifest/
│   └── manifest.json          # Teams app manifest
└── test/
    └── bot/
        └── copilot-ld-bot.test.js # Unit tests
```

### Running Tests

```bash
cd extensions/teams
npm test
```

Tests cover:

- Bot message handling and formatting
- Tenant configuration storage and retrieval
- Secret encryption and decryption
- Resource ID management
- Authorization logic

### Adding Custom Tabs

1. **Create HTML File**: Add new page in `lib/html/`
2. **Register Route**: Add handler in `TeamsServer.#createHttpServer()`
3. **Update Manifest**: Add staticTab entry in `manifest/manifest.json`
4. **Deploy**: Rebuild and redeploy Teams app package

### Extending Bot Capabilities

Modify `CopilotLdBot` to add new features:

**Message Preprocessing**: Transform user input before sending to agent

**Response Postprocessing**: Format agent responses with custom logic

**Event Handlers**: Override ActivityHandler methods for `onMembersAdded()`,
`onMessageReaction()`, etc.

**Proactive Messaging**: Send unsolicited messages to users (requires
turnContext persistence)

## Security Considerations

### Authentication Flow

1. **Inbound**: Bot Framework validates request signatures automatically via
   adapter
2. **Authorization**: Admin endpoints verify JWT token contains
   `Settings:Update` scope
3. **Outbound**: Encrypted tenant secret included as bearer token in agent
   requests
4. **Encryption**: AES-256-GCM with tenant-specific keys prevents cross-tenant
   decryption

### Best Practices

**Secret Rotation**: Implement periodic rotation of `TEAMS_SECRET_KEY` with
re-encryption of stored secrets

**HTTPS Only**: Never expose bot endpoints over plain HTTP in production

**Input Validation**: Sanitize user messages before passing to agent to prevent
injection attacks

**Rate Limiting**: Implement per-tenant rate limits to prevent abuse

**Audit Logging**: Log all configuration changes with timestamp and admin
identity

**Network Isolation**: Restrict outbound agent connections to approved
tenant-configured endpoints

## Integration Examples

### Custom Agent Endpoints

Configure tenant to use different agent endpoints per environment:

**Development**: `host=localhost`, `port=3002`

**Staging**: `host=staging-agent.example.com`, `port=3002`

**Production**: `host=agent.example.com`, `port=3002`

### Multi-Region Deployment

Deploy Teams extension in multiple regions with shared configuration:

- Use S3 storage (`STORAGE_TYPE=s3`) for cross-region tenant config sync
- Configure region-specific agent endpoints per tenant
- Implement geo-routing to nearest agent instance

### Teams App Customization

**Branding**: Update `manifest.json` icons (outline.png, color.png) and
accentColor

**Descriptions**: Modify short/full descriptions to reflect
organization-specific use cases

**Permissions**: Adjust required permissions based on bot capabilities

**Scopes**: Limit to `personal` only if team/groupchat not needed

## References

### Microsoft Documentation

- [Bot Framework Documentation](https://docs.botframework.com)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction)
- [Teams App Manifest](https://docs.microsoft.com/microsoftteams/platform/resources/schema/manifest-schema)
- [Bot Activity Processing](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-activity-processing)

### Copilot-LD Documentation

- [Configuration Guide](/configuration/) - Environment variables and YAML
  configuration
- [Architecture Guide](/architecture/) - Platform architecture and component
  relationships
- [Reference Guide](/reference/) - Implementation details and API reference
- [Deployment Guide](/deployment/) - Docker and AWS deployment instructions
