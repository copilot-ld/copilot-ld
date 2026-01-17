# 🧬 Copilot-LD

Copilot-LD is an intelligent agent leveraging GitHub Copilot, linked data and
retrieval-augmented generation.

- 🎯 **Amazingly Accurate**: Chunking and similarity searches with linked data
- ⚡️ **Incredibly Fast**: Parallel vector retrieval using in-memory indices
- 🛡️ **Robustly Secure**: Network isolation, gRPC, HMAC auth, <10 MB containers
- ✨ **Elegantly Simple**: Plain JavaScript with no external dependencies

## 🏗️ Repository Structure

- **/services/**: gRPC microservices (`agent`, `graph`, `llm`, `memory`, `tool`,
  `vector`)
- **/extensions/**: Application adapters (teams, ui, web)
- **/packages/**: Reusable, framework-agnostic libraries
- **/scripts/**: Development and operational utilities
- **/proto/**: Authoritative Protocol Buffer source schemas (copied into
  `packages/libtype/generated/proto/` during codegen)
- **/tools/**: Optional protobuf definitions for custom tools that extend the
  core system (not part of the base platform)
- **/data/**: Knowledge base, vectors, and resource data

## 🚀 Setup

### 1. Configuration

Set up environment variables and service configuration:

```sh
# Base configuration (required)
cp .env.example .env

# Local development networking
cp .env.local.example .env.local

# Storage backend (local filesystem)
cp .env.storage.local.example .env.storage.local

# JSON/YAML configuration
cp config/config.example.json config/config.json
cp config/assistants.example.yml config/assistants.yml
cp config/tools.example.yml config/tools.yml
```

For detailed configuration options, see the
[Configuration Guide](docs/configuration.html).

### 2. Install dependencies

```sh
npm install
```

### 3. Initialize data directories

Initialize the necessary data directories with empty indices:

```sh
make init
```

### 4. Generate code from Protocol Buffers

```sh
make codegen
```

This generates service interfaces and type definitions from the Protocol Buffer
schemas. See [Code Generation Details](docs/architecture.html#code-generation)
for more information.

### 5. Authentication and secrets

Get a token from your OpenAI-compatible LLM provider and set LLM_TOKEN in `.env`
To use GitHub Copilot as the LLM backend, run:

```sh
# Load environment for scripts
set -a && source .env && set +a

# Generate a GitHub token and set GITHUB_TOKEN in .env
node scripts/gh-token.js

# Then manually copy GITHUB_TOKEN to LLM_TOKEN in .env for LLM API access
```

Then generate the secret used for internal service communication:

```sh
# Generate service authentication secret
node scripts/secret.js
```

### 6. Prepare knowledge base

A knowledge base with HTML microdata must be available at `./data/knowledge/`.
See the [Processing Guide](docs/processing.html) for complete knowledge base
setup instructions including HTML structure examples and processing workflows.

### 7. Process all resources and create indices

```sh
make process
```

### 8. Start services

#### Option A: Local Development Environment

```sh
# Load environment files
set -a && source .env && source .env.local && source .env.storage.local && set +a

# Start services
npm run dev
```

Access the services:

- **UI Extension**: `http://localhost:3000/ui`

#### Option B: Production-Like Environment

For a production-like environment with an Application Load Balancer (ALB) and
S3-compatible storage, first generate SSL certificates and prepare Docker
environment files:

```sh
# Generate SSL certificates
node scripts/cert.js

# Copy Docker environment file
cp .env.docker.example .env.docker

# Copy MinIO storage configuration
cp .env.storage.minio.example .env.storage.minio
# Edit .env.storage.minio with your desired passwords

# Start all services
docker compose \
  --env-file .env \
  --env-file .env.docker \
  --env-file .env.storage.minio \
  up
```

This provides SSL termination, path-based routing, and S3-compatible storage.
See the [Configuration Guide](docs/configuration.html) for detailed setup
options.

Access the services:

- **UI Extension**: `https://localhost/ui`
- **MinIO Console**: `http://localhost:9001`

## 📖 Detailed Guides

For comprehensive setup and deployment information:

- **[Development Setup](docs/development.html)**: Complete development
  environment configuration with detailed troubleshooting
- **[Deployment Guide](docs/deployment.html)**: Production deployment with
  Docker Compose or AWS CloudFormation

## ⚡ Usage

After starting services with `npm run dev`, you can interact with the system
using CLI tools via Make.

### Chat Script

Interactive mode:

```sh
make cli-chat
> Hello
```

Piping for scripted testing:

```sh
echo "Hello" | make cli-chat
```

### Search Script

Interactive mode:

```sh
make cli-search
> What is Kanban?
```

Piping for scripted testing:

```sh
echo "What is Kanban?" | make cli-search
```

### Web Components

Add chat interfaces to any web page using the `@copilot-ld/libchat` components:

```html
<!-- Collapsible drawer (bottom-right corner) -->
<agent-drawer data-api="/web/api" data-name="Agent"></agent-drawer>
<script type="module" src="/ui/libchat/drawer.js"></script>

<!-- Full-page chat interface -->
<agent-chat data-name="Agent"></agent-chat>
<script type="module" src="/ui/libchat/chat.js"></script>
```

See [`packages/libchat/README.md`](packages/libchat/README.md) for theming, API
documentation, and framework integration examples.

## 👨‍💻 Development

### Code Quality

Run all quality checks or automatically fix linting and formatting issues:

```sh
npm run check
npm run check:fix
```

### Testing

Run unit tests:

```sh
npm test
```

Manual integration testing by using CLI tools:

```sh
echo "test prompt" | make cli-chat
echo "search query" | make cli-search
```

### Adding New Features

- Add new services in `/services` with schemas in `/proto`
- Add reusable logic in `/packages`
- Update root-level documentation for changes

## 📚 Documentation

### Human Documentation

- [Configuration Guide](docs/configuration.html): Environment variables and YAML
  configuration
- [Architecture Overview](docs/architecture.html): System design and structure
- [Development Setup](docs/development.html): Local development and
  configuration
- [Deployment Guide](docs/deployment.html): Docker Compose and AWS
  CloudFormation deployment

### AI Instructions

General AI instructions:

- [GitHub Copilot](.github/copilot-instructions.md): Summary of all instructions

AI instructions for specific domains:

- [Architecture Instructions](.github/instructions/architecture.instructions.md):
  Microservices-based, gRPC-enabled platform design with service organization
  patterns
- [CLI Tools Instructions](.github/instructions/cli-tools.instructions.md):
  Development utilities for interacting with platform capabilities through
  command-line interfaces
- [Documentation Instructions](.github/instructions/documentation.instructions.md):
  JSDoc standards for interface-based documentation contracts with IDE support
- [Performance Instructions](.github/instructions/performance.instructions.md):
  Performance testing using @copilot-ld/libperf for consistent validation
- [Security Instructions](.github/instructions/security.instructions.md):
  Security architecture for defense-in-depth through network isolation and
  secure communication
