# 🧬 Copilot-LD

Copilot-LD is an intelligent agent leveraging GitHub Copilot, linked data and
retrieval-augmented generation.

- 🎯 **Amazingly Accurate**: Chunking and similarity searches with linked data
- ⚡️ **Incredibly Fast**: Parallel vector retrieval using in-memory indices
- 🛡️ **Robustly Secure**: Network isolation, gRPC, HMAC auth, <10 MB containers
- ✨ **Elegantly Simple**: Plain JavaScript with no external dependencies

## 🏗️ Repository Structure

- **/services/**: gRPC microservices (`agent`, `llm`, `memory`, `vector`)
- **/extensions/**: Application adapters (copilot, teams, web)
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
```

For detailed configuration options, see the
[Configuration Guide](docs/configuration.html).

### 2. Install dependencies

```sh
npm install
```

### 3. Generate code from Protocol Buffers

```sh
mkdir generated
npm run codegen
```

This generates service interfaces and type definitions from the Protocol Buffer
schemas. See [Code Generation Details](docs/architecture.html#code-generation)
for more information.

### 4. Authentication and secrets

```sh
# Set GITHUB_CLIENT_ID in .env, then generate token
node scripts/token.js

# Generate service authentication secret
node scripts/secret.js
```

### 5. Prepare data directory

Create the necessary data directories with empty indices:

```sh
mkdir -p data/{memories,policies,resources,vectors}
```

### 6. Prepare knowledge base

A knowledge base with HTML microdata must be available at `./data/knowledge/`.
See the [Processing Guide](docs/processing.html) for complete knowledge base
setup instructions including HTML structure examples and processing workflows.

### 7. Process resources and create vector embeddings

```sh
npm run process:resources
npm run process:tools
npm run process:vectors
```

### 8. Start services

#### Option A: Local Development Environment

```sh
npm run dev
```

Access the services:

- **Web Extension**: `http://localhost:3000/web`
- **Copilot Extension**: `http://localhost:3001/copilot`

#### Option B: Production-Like Environment

For a production-like environment with an Application Load Balancer (ALB) and
S3-compatible storage:

```sh
# Generate SSL certificates for localhost
node scripts/cert.js

# Comment out host and port variables in .env (GNU sed)
sed -i -E '/(HOST|PORT)=/s/^/# /' .env

# Start all services including ALB and MinIO
docker compose up
```

This provides SSL termination, path-based routing, and S3-compatible storage.
See the [Configuration Guide](docs/configuration.html) for detailed setup
options.

Access the services:

- **Web Extension**: `https://localhost/web`
- **Copilot Extension**: `https://localhost/copilot`
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
node scripts/chat.js
> Hello
```

Piping for scripted testing:

```sh
echo "Hello" | node scripts/chat.js
```

### Search Script

Interactive mode:

```sh
node scripts/search.js
> What is Kanban?
```

Piping for scripted testing:

```sh
echo "What is Kanban?" | node scripts/search.js
```

Command-line flags for non-interactive runs (handled by the internal `Repl`
state):

```sh
# Limit results and set a minimum similarity threshold
echo "testing" | node scripts/search.js --limit 10 --threshold 0.25

# Target the descriptor index instead of content
echo "find pipeline tasks" | node scripts/search.js --index descriptor --limit 5
```

## 👨‍💻 Development

### Code Quality

```sh
npm run check        # Check linting and formatting
npm run check:fix    # Automatically fix linting and formatting issues
```

### Testing

Run unit tests:

```sh
npm test
```

Manual integration testing by using scripts:

```sh
echo "test prompt" | node scripts/chat.js
echo "search query" | node scripts/search.js --limit 3 --threshold 0.2
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
