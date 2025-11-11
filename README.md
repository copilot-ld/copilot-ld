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
- **/extensions/**: Application adapters (teams, web)
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
cp .env{.example,}
cp config/config{.example,}.json
cp config/assistants{.example,}.yml
cp config/tools{.example,}.yml
```

### 2. Install dependencies

```sh
npm install
```

### 3. Initialize data directories

Initialize the necessary data directories with empty indices:

```sh
npm run data:init
```

### 4. Generate code from Protocol Buffers

```sh
npm run codegen
```

This generates service interfaces and type definitions from the Protocol Buffer
schemas. See [Code Generation Details](docs/architecture.html#code-generation)
for more information.

### 5. Authentication and secrets

```sh
# Set GITHUB_CLIENT_ID in .env, then generate token
npx env-cmd -- node scripts/token.js

# Generate service authentication secret
node scripts/secret.js
```

### 6. Prepare knowledge base

A knowledge base with HTML microdata must be available at `./data/knowledge/`.
See the [Processing Guide](docs/processing.html) for complete knowledge base
setup instructions including HTML structure examples and processing workflows.

### 7. Process all resources and create indices

```sh
npm run process
```

### 8. Start services

#### Option A: Local Development Environment

```sh
npm run dev
```

Access the services:

- **Web Extension**: `http://localhost:3001/web`

#### Option B: Production-Like Environment

For a production-like environment with an Application Load Balancer (ALB) and
S3-compatible storage, first generate SSL certificates and comment out host and
port variables in `.env` (using GNU `sed`), then start all services including
ALB and MinIO:

```sh
node scripts/cert.js
sed -i -E '/(HOST|PORT)=/s/^/# /' .env
docker compose up
```

This provides SSL termination, path-based routing, and S3-compatible storage.
See the [Configuration Guide](docs/configuration.html) for detailed setup
options.

Access the services:

- **Web Extension**: `https://localhost/web`
- **MinIO Console**: `http://localhost:9001`

## 📖 Detailed Guides

For comprehensive setup and deployment information:

- **[Development Setup](docs/development.html)**: Complete development
  environment configuration with detailed troubleshooting
- **[Deployment Guide](docs/deployment.html)**: Production deployment with
  Docker Compose or AWS CloudFormation

## ⚡ Usage

After starting services with `npm run dev`, you can interact with the system
using available scripts.

### Chat Script

Interactive mode:

```sh
npm run chat
> Hello
```

Piping for scripted testing:

```sh
echo "Hello" | npm run chat
```

### Search Script

Interactive mode:

```sh
npm run search
> What is Kanban?
```

Piping for scripted testing:

```sh
echo "What is Kanban?" | npm run search
```

Command-line flags can be used for non-interactive runs to limit results and set
a minimum similarity threshold, or target the descriptor index instead of
content:

```sh
echo "testing" | npm run search -- --limit 10 --threshold 0.25
echo "find pipeline tasks" | npm run search -- --index descriptor --limit 5
```

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

Manual integration testing by using scripts:

```sh
echo "test prompt" | npm run chat
echo "search query" | npm run search -- --limit 3 --threshold 0.2
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
- [Documentation Instructions](.github/instructions/documentation.instructions.md):
  JSDoc standards for interface-based documentation contracts with IDE support
- [Performance Instructions](.github/instructions/performance.instructions.md):
  Performance testing using @copilot-ld/libperf for consistent validation
- [Security Instructions](.github/instructions/security.instructions.md):
  Security architecture for defense-in-depth through network isolation and
  secure communication
- [Testing Instructions](.github/instructions/testing.instructions.md): Testing
  standards using Node.js built-in framework for maintainable tests
