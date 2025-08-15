# 🧬 Copilot-LD

Copilot-LD is an intelligent agent leveraging GitHub Copilot, linked data and
retrieval-augmented generation.

- 🎯 **Amazingly Accurate**: Chunking and similarity searches with linked data
- ⚡️ **Incredibly Fast**: Parallel vector retrieval using in-memory indices
- 🛡️ **Robustly Secure**: Network isolation, gRPC, HMAC auth, <10 MB containers
- ✨ **Elegantly Simple**: Plain JavaScript with no external dependencies

## 🏗️ Repository Structure

- **/services/**: gRPC microservices (agent, vector, scope, llm, history, text)
- **/extensions/**: Application adapters (copilot, teams, web)
- **/packages/**: Reusable, framework-agnostic libraries
- **/tools/**: Development and operational utilities
- **/proto/**: gRPC protocol buffer definitions
- **/data/**: Definitions, vectors, and scope data

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

### 3. Create GitHub token

```sh
node tools/token.js
```

### 4. Service authentication

Generate a shared secret for HMAC authentication between services:

```sh
node tools/secret.js
```

### 5. Prepare data directory

Create the necessary data directories with empty indices:

```sh
mkdir -p data/storage/{chunks,vectors,history}
echo "[]" > data/storage/{chunks,vectors,history}/index.json
```

### 6. Download knowledge data

```sh
node tools/download.js
```

### 7. Extract chunks and build vector indices

```sh
node tools/chunk.js
node tools/index.js
```

### 8. Start services

#### Option A: Local Development Environment

```sh
npm run dev
```

Access the services:

- **Web Extension**: `http://localhost:3000`
- **Copilot Extension**: `http://localhost:3001`

#### Option B: Production-Like Environment

For a production-like environment with an Application Load Balancer (ALB) and
S3-compatible storage:

```sh
# Generate SSL certificates for localhost
node tools/cert.js

# Uncomment all host and port variables in .env
sed -i '' -E '/(HOST|PORT)=/s/^/# /' .env

# Start all services including ALB and MinIO
docker compose up
```

This provides:

- **Application Load Balancer**: SSL termination and path-based routing through
  nginx
- **S3-compatible storage**: MinIO for scope, vectors, and chunks data
- **SSL encryption**: Self-signed certificates for localhost development

Access the services:

- **Web Extension**: `https://localhost/web`
- **Copilot Extension**: `https://localhost/copilot`
- **MinIO Console**: `http://localhost:9001`

## ⚡ Usage

After starting services with `npm run dev`, you can interact with the system
using available tools.

### Chat Tool

Interactive mode:

```sh
node tools/chat.js
> Hello
```

Piping for scripted testing:

```sh
echo "Hello" | node tools/chat.js
```

### Search Tool

Interactive mode:

```sh
node tools/search.js
> What is Kanban?
```

Piping for scripted testing:

```sh
echo "What is Kanban?" | node tools/search.js
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

Manual integration testing by using tools:

```sh
echo "test prompt" | node tools/chat.js
echo "search query" | node tools/search.js
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
