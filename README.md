# 🤖 Copilot-LD

An intelligent chat agent leveraging GitHub Copilot and Linked Data, built with
Node.js, gRPC microservices and retrieval-augmented generation (RAG) techniques.

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
cp .env.example .env
cp config.example.yml config.yml
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

### 5. Download knowledge data

```sh
node tools/download.js
```

### 6. Extract chunks and build vector indices

```sh
node tools/chunk.js
node tools/index.js
```

### 7. Start services

```sh
npm run dev
```

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
> security vulnerabilities
```

Piping for scripted testing:

```sh
echo "docker security" | node tools/search.js
```

### Extension Endpoints

- **Web Extension**: `http://localhost:3000`
- **Copilot Extension**: `http://localhost:3001`

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
