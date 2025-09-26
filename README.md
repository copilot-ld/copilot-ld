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

### 1. Environment configuration

```sh
cp config/.env{.example,}
cp config/config{.example,}.yml
```

### 2. Install dependencies

```sh
npm install
```

### 3. Generate code from Protocol Buffers

```sh
npm run codegen
```

This generates service interfaces and type definitions from the Protocol Buffer
schemas. See [Code Generation Details](docs/architecture.html#code-generation)
for more information.

### 4. Create GitHub token

First, set your `GITHUB_CLIENT_ID` in `config/.env`, then generate a token via
OAuth Device Flow:

```sh
node scripts/token.js
```

The tool writes the token to `config/.ghtoken` so services can read it. As an
alternative, you can set `GITHUB_TOKEN` in `config/.env`.

### 5. Service authentication

Generate a shared secret for HMAC authentication between services:

```sh
node scripts/secret.js
```

### 6. Prepare data directory

Create the necessary data directories with empty indices:

```sh
mkdir -p data/storage/{memories,policies,resources,vectors}
```

### 7. Download knowledge data

```sh
node scripts/download.js
```

### 8. Process resources and create vector embeddings

```sh
node scripts/resources.js
node scripts/tools.js
node scripts/vectors.js
```

### 9. Start services

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

# Comment out host and port variables in config/.env (GNU sed)
sed -i -E '/(HOST|PORT)=/s/^/# /' config/.env

# Start all services including ALB and MinIO
docker compose up
```

This provides:

- **Application Load Balancer**: SSL termination and path-based routing through
  nginx
- **S3-compatible storage**: MinIO for resources, vectors, and policies data
- **SSL encryption**: Self-signed certificates for localhost development

Access the services:

- **Web Extension**: `https://localhost/web`
- **Copilot Extension**: `https://localhost/copilot`
- **MinIO Console**: `http://localhost:9001`

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

- [Architecture Overview](docs/architecture.html): System design and structure

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
