---
title: Configuration Guide
description: |
  Comprehensive configuration guide for environment variables and YAML settings
  across all Copilot-LD components.
toc: true
---

## Prerequisites

- Node.js 22.0.0 or later
- Git
- GitHub account for authentication and API access

## Configuration Files

The Copilot-LD platform uses two primary configuration approaches:

- **Environment Variables** (`.env` files): Runtime configuration for services,
  networking, and authentication
- **JSON/YAML Configuration** (`config/*.json`, `config/*.yml`, and
  `config/agents/`): Service behavior, tool definitions, and agent
  configurations

## Environment Variables

### File Organization

Environment variables are organized into multiple files by concern:

| File                    | Purpose                                |
| ----------------------- | -------------------------------------- |
| `.env`                  | Base configuration (API keys, secrets) |
| `.env.local`            | Local development networking           |
| `.env.docker`           | Docker Compose proxy settings          |
| `.env.storage.local`    | Local filesystem storage               |
| `.env.storage.minio`    | MinIO S3-compatible storage            |
| `.env.storage.supabase` | Supabase auth and storage              |

### Initial Setup

Create your environment configuration from example files:

```bash
# Base configuration (required)
cp .env.example .env

# Local development networking (for npm run dev)
cp .env.local.example .env.local

# Docker Compose (for docker compose up)
cp .env.docker.example .env.docker

# Storage backend (choose one)
cp .env.storage.local.example .env.storage.local      # Local filesystem
cp .env.storage.minio.example .env.storage.minio      # MinIO
cp .env.storage.supabase.example .env.storage.supabase # Supabase

# JSON/YAML configuration
cp config/config.example.json config/config.json
cp config/tools.example.yml config/tools.yml
```

### Usage Patterns

#### Local Development (Local Storage)

```bash
# Load environment files
set -a
source .env
source .env.local
source .env.storage.local
set +a

# Start services
npm run dev
```

#### Local Development (MinIO Storage)

```bash
set -a
source .env
source .env.local
source .env.storage.minio
set +a

npm run dev
```

#### Docker Compose (MinIO Storage)

```bash
docker compose \
  --env-file .env \
  --env-file .env.docker \
  --env-file .env.storage.minio \
  up
```

#### Docker Compose (Supabase Storage)

```bash
docker compose \
  --env-file .env \
  --env-file .env.docker \
  --env-file .env.storage.supabase \
  up
```

### Base Configuration (.env)

The base configuration file contains API credentials and secrets required for
all deployment modes:

```bash
# API Credentials
LLM_TOKEN=your_github_token_with_models_scope
GITHUB_TOKEN=your_github_token
GITHUB_CLIENT_ID=your_client_id
# GitHub Models base URL - API endpoints are organized as:
# - /catalog/models - List available models
# - /inference/chat/completions - Chat completions
# - /inference/embeddings - Embeddings
LLM_BASE_URL=https://models.github.ai

# Service Authentication
SERVICE_SECRET=your_generated_secret
JWT_SECRET=your_jwt_secret

# Debug (optional)
DEBUG=*
```

#### GitHub Models Token Generation

Copilot-LD uses GitHub Models for LLM API access. To generate a token with the
required `models` scope:

```bash
# Set GITHUB_CLIENT_ID first, then run:
node scripts/env-github.js
```

This command authenticates with GitHub using OAuth device flow, requests the
`models` scope, and automatically saves both `GITHUB_TOKEN` and `LLM_TOKEN` to
your `.env` file. The token is configured to use GitHub Models API by default:

- **Base URL**: `https://models.github.ai`
- **Model Catalog**: `GET /catalog/models` - List all available models
- **Completions**: `POST /inference/chat/completions` - Chat completions
- **Embeddings**: `POST /inference/embeddings` - Text embeddings
- **Required Scope**: `models`
- **Available Models**: Visit https://github.com/marketplace/models for the
  complete list

To use a different LLM provider (e.g., OpenAI):

```bash
LLM_TOKEN=your_openai_api_key
LLM_BASE_URL=https://api.openai.com/v1
```

#### Secret Generation

```bash
# Generate and automatically update .env
node scripts/secret.js
```

### Service Networking (.env.local)

Configure service host and port settings for local development. Do NOT load this
file when using Docker Compose—containers use internal DNS for service
discovery.

#### Extension Services

```bash
EXTENSION_UI_HOST=localhost
EXTENSION_UI_PORT=3000

EXTENSION_WEB_HOST=localhost
EXTENSION_WEB_PORT=3001
EXTENSION_WEB_URL=http://localhost:3001/web/api
```

#### Core Services

```bash
SERVICE_AGENT_HOST=localhost
SERVICE_AGENT_PORT=3002

SERVICE_MEMORY_HOST=localhost
SERVICE_MEMORY_PORT=3003

SERVICE_LLM_HOST=localhost
SERVICE_LLM_PORT=3004

SERVICE_VECTOR_HOST=localhost
SERVICE_VECTOR_PORT=3005

SERVICE_GRAPH_HOST=localhost
SERVICE_GRAPH_PORT=3006

SERVICE_TOOL_HOST=localhost
SERVICE_TOOL_PORT=3007

SERVICE_TRACE_HOST=localhost
SERVICE_TRACE_PORT=3008
```

### Docker Proxy (.env.docker)

Proxy configuration for Docker containers to access external APIs:

```bash
HTTPS_PROXY=http://gateway.copilot-ld.local:3128
HTTP_PROXY=http://gateway.copilot-ld.local:3128
NO_PROXY=localhost,127.0.0.1,*.copilot-ld.local
```

### Storage Backends

#### Local Storage (.env.storage.local)

Use local filesystem (default behavior, minimal configuration):

```bash
STORAGE_TYPE=local
```

#### MinIO Storage (.env.storage.minio)

S3-compatible object storage with MinIO:

```bash
STORAGE_TYPE=s3
S3_REGION=us-east-1
S3_BUCKET_NAME=copilot-ld

MINIO_ENDPOINT=http://storage.copilot-ld.local:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your_password

AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=your_password
```

#### Supabase Storage (.env.storage.supabase)

Authentication and S3-compatible storage with Supabase:

```bash
STORAGE_TYPE=s3
S3_REGION=local
S3_BUCKET_NAME=copilot-ld

# Database
SUPABASE_DB_PASSWORD=your_database_password

# JWT (shared by Auth and Storage)
SUPABASE_JWT_SECRET=your_jwt_secret

# Auth service keys
SUPABASE_ANON_KEY=your_anon_key_jwt
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_jwt

# Auth settings
SUPABASE_SITE_URL=http://localhost:3000
SUPABASE_DISABLE_SIGNUP=false

# Storage S3 protocol
SUPABASE_S3_ACCESS_KEY=your_s3_access_key
SUPABASE_S3_SECRET_KEY=your_s3_secret_key

# AWS SDK credentials
AWS_ACCESS_KEY_ID=your_s3_access_key
AWS_SECRET_ACCESS_KEY=your_s3_secret_key

# Enable auth in web extension
EXTENSION_WEB_AUTH_ENABLED=true
```

## JSON and YAML Configuration

### Service Configuration (`config.json`)

Defines service parameters, process supervision, and available tools in JSON
format.

#### Process Supervision

The `init` section configures the process supervision system (`svscan` and
`rc`):

```json
{
  "init": {
    "log_dir": "data/logs",
    "shutdown_timeout": 3000,
    "services": [
      {
        "name": "agent",
        "command": "npx env-cmd -- npm run dev -w @copilot-ld/agent"
      }
    ]
  }
}
```

- **`log_dir`**: Directory for service logs (default: `data/logs`)
- **`shutdown_timeout`**: Maximum milliseconds to wait for graceful shutdown
  (default: 3000)
- **`services`**: Array of services to supervise with `name` and `command`
  properties

#### Service Parameters

The `service` section defines service-specific configuration:

```json
{
  "service": {
    "agent": {
      "agent": "knowledge_graph_agent",
      "tools": ["get_ontology", "search_content", "query_by_pattern"],
      "threshold": 0.25,
      "temperature": 0.25,
      "budget": {
        "tokens": 90000,
        "allocation": {
          "tools": 0.1,
          "resources": 0.1,
          "results": 0.8
        }
      }
    },
    "tool": {
      "endpoints": {
        "get_ontology": {
          "method": "graph.Graph.GetOntology",
          "request": "graph.OntologyRequest"
        },
        "query_by_pattern": {
          "method": "graph.Graph.QueryByPattern",
          "request": "graph.PatternQuery"
        },
        "search_content": {
          "method": "vector.Vector.SearchContent",
          "request": "vector.TextQuery"
        }
      }
    }
  }
}
```

### Tool Configuration (`tools.yml`)

Defines tool metadata in YAML format:

```yaml
sha256_hash:
  purpose: |
    Generate a deterministic SHA-256 cryptographic hash of input text for
    security, verification, or identification purposes.
  applicability: |
    SEQUENCING: Independent utility - no sequencing requirements.
    Use ONLY when user explicitly requests SHA-256 hashing functionality.
    DO NOT use for search, content analysis, or similarity detection.
    Reserved for security, verification, and identification use cases.
  instructions: |
    Input: Text string in 'input' field to be hashed.
    Output: Deterministic 64-character hexadecimal SHA-256 hash string.
    Hash is cryptographically secure and suitable for verification purposes.
  evaluation: |
    Returns exactly 64-character hexadecimal string representing the SHA-256
    hash of the input text.
```

### Agent Configuration (`config/agents/`)

Agents are defined as individual `.agent.md` files in the `config/agents/`
directory. Each file uses frontmatter for metadata and markdown for the system
prompt.

```markdown
---
name: knowledge_graph_agent
description: "An expert knowledge graph agent for querying information."
temperature: 0.3
tools:
  - get_ontology
  - get_subjects
  - search_content
  - query_by_pattern
infer: true
handoffs: []
---

You are an expert knowledge graph agent that queries and retrieves information.

## CHAIN OF THOUGHT

Explain your reasoning before taking any action...
```

Each agent file has:

- **Frontmatter** (YAML between `---` markers):
  - `name`: Agent identifier (matches filename without `.agent.md`)
  - `description`: Brief description of the agent's purpose
  - `temperature`: LLM temperature setting (0.0-1.0)
  - `tools`: Optional array of tool function names
  - `infer`: Whether this agent can be invoked as a sub-agent
  - `handoffs`: Optional array of handoff configurations

- **Markdown Body**: System prompt defining the agent's persona and behavior

#### Handoff Configuration

Handoffs define how an agent can transfer control to another agent:

```yaml
handoffs:
  - label: "Code Review"
    agent: code_review_agent
    prompt: "Please review the code we discussed."
```

Each handoff has:

- `label`: Human-readable label for the handoff
- `agent`: Target agent name (without path or extension)
- `prompt`: Message injected when handoff occurs

## Runtime Configuration

### Variable Precedence

When loading multiple `.env` files, later files override earlier ones. Load
files in this order:

1. `.env` (base credentials and secrets)
2. `.env.local` OR `.env.docker` (networking mode)
3. `.env.storage.*` (storage backend)

### Development vs Production

#### Development Configuration

- Load `.env.local` for direct service access
- Use local storage or MinIO for data persistence
- Enable debug logging with `DEBUG=*`
- Use self-signed certificates for SSL

#### Production Configuration

- Load `.env.docker` for container networking
- Configure S3-compatible storage with proper credentials
- Disable debug logging or set specific namespaces
- Use valid TLS certificates from trusted CA
- Store secrets in AWS Secrets Manager or similar

## Environment Variable Reference

| Variable                | Purpose                                            | Default                                   | Required           |
| ----------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------ |
| `LLM_TOKEN`             | LLM API access token                               | -                                         | Yes                |
| `LLM_BASE_URL`          | LLM API base URL                                   | `https://models.github.ai`                | No                 |
| `GITHUB_CLIENT_ID`      | GitHub OAuth application client ID                 | -                                         | OAuth only         |
| `SERVICE_SECRET`        | HMAC secret for service authentication             | -                                         | Yes                |
| `JWT_SECRET`            | HS256 secret for JWT authentication                | -                                         | Extensions only    |
| `STORAGE_TYPE`          | Storage backend type                               | `local`                                   | No                 |
| `S3_BUCKET_NAME`        | S3 bucket name for data storage                    | `copilot-ld`                              | S3 or MinIO        |
| `S3_BUCKET_ROLE_ARN`    | S3 bucket role ARN for local development and CI/CD | `arn:aws:iam::123456789012:role/S3Access` | Local/CI only      |
| `AWS_ACCESS_KEY_ID`     | AWS access key ID for S3 operations                | -                                         | MinIO or direct S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key for S3 operations            | -                                         | MinIO or direct S3 |
| `S3_ENDPOINT`           | S3-compatible endpoint URL                         | AWS S3                                    | MinIO only         |
| `MINIO_ROOT_USER`       | MinIO administrator username                       | -                                         | MinIO only         |
| `MINIO_ROOT_PASSWORD`   | MinIO administrator password                       | -                                         | MinIO only         |
| `AWS_REGION`            | AWS region for S3 operations                       | -                                         | S3 only            |
| `DEBUG`                 | Debug logging configuration                        | Disabled                                  | No                 |

## SSL Certificate Configuration

For HTTPS support in Docker Compose deployments:

### Generate Self-Signed Certificates

```bash
# Generate certificates for localhost development
node scripts/cert.js
```

### Use Production Certificates

```bash
# Copy your production certificates
cp your-cert.crt data/cert/localhost.crt
cp your-cert.key data/cert/localhost.key
```

## Next Steps

Once configuration is complete, proceed to:

- [Processing Guide](/processing/) - Transform HTML knowledge into searchable
  resources
- [Deployment Guide](/deployment/) - Launch with Docker Compose or AWS
  CloudFormation
- [Development Guide](/development/) - Run locally with live reloading
