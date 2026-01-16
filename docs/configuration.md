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

- **Environment Variables** (`config/.env`): Runtime configuration for services,
  networking, and authentication
- **JSON Configuration** (`config/*.json` and `config/*.yml`): Service behavior,
  tool definitions, and assistant configurations

## Environment Variables

### Initial Setup

Create your environment configuration:

```bash
cp .env.example .env
cp config/config.example.json config/config.json
cp config/assistants.example.yml config/assistants.yml
cp config/tools.example.yml config/tools.yml
```

### Service Networking

Configure service host and port settings. When using Docker Compose, comment out
these variables to use container networking:

#### Extension Services

```bash
# UI Extension (User Interface)
EXTENSION_UI_HOST=localhost
EXTENSION_UI_PORT=3000

# Web API Extension
EXTENSION_WEB_HOST=localhost
EXTENSION_WEB_PORT=3001

# GitHub API Token for repository operations
```

#### Core Services

```bash
# Agent Service (Main Orchestrator)
SERVICE_AGENT_HOST=localhost
SERVICE_AGENT_PORT=3002

# Memory Service (Conversation Storage)
SERVICE_MEMORY_HOST=localhost
SERVICE_MEMORY_PORT=3003

# LLM Service (Language Model Interface)
SERVICE_LLM_HOST=localhost
SERVICE_LLM_PORT=3004

# Vector Service (Embedding Search)
SERVICE_VECTOR_HOST=localhost
SERVICE_VECTOR_PORT=3005

# Graph Service (RDF Graph Queries)
SERVICE_GRAPH_HOST=localhost
SERVICE_GRAPH_PORT=3006

# Tool Service (Function Calls)
SERVICE_TOOL_HOST=localhost
SERVICE_TOOL_PORT=3007

# Trace Service (Observability Endpoints)
SERVICE_TRACE_HOST=localhost
SERVICE_TRACE_PORT=3008
```

#### Example Services

Example tool service configuration:

```bash
# Hash Tool Service (Example)
SERVICE_HASH_HOST=localhost
SERVICE_HASH_PORT=3009
```

### GitHub Authentication

Configure GitHub OAuth for user authentication:

```bash
# GitHub Client ID (20-character string)
GITHUB_CLIENT_ID=your_client_id_here
```

Configure LLM API access:

```bash
# LLM API Token
LLM_TOKEN=your_llm_api_token_here

# LLM API Base URL (optional, defaults to GitHub Copilot API)
LLM_BASE_URL=https://api.githubcopilot.com
```

#### Token Generation

Get a token from your OpenAI-compatible LLM provider and set `LLM_TOKEN` in your
`.env` file. For GitHub Copilot users:

```bash
# Set GITHUB_CLIENT_ID first, then run:
node scripts/gh-token.js
```

This command authenticates with GitHub using OAuth device flow and saves the
token to `GITHUB_TOKEN` in your `.env` file. Copy this value to `LLM_TOKEN`.

### Service Secret

Generate shared secrets for inter-service authentication

```bash
# Service Secret (32-character string)
SERVICE_SECRET=your_generated_secret_here
```

#### Secret Generation

```bash
# Generate and automatically update config/.env
node scripts/secret.js
```

### Storage Configuration

Configure storage backends for data persistence. Supports local filesystem and
S3-compatible storage:

#### Local Storage (Default)

Use local filesystem (default behavior, no configuration needed):

```bash
STORAGE_TYPE=local
```

#### S3-Compatible Storage

Configure S3 or S3-compatible storage. `S3_BUCKET_ROLE_ARN` is used for local
development and CI/CD, while `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are
used for MinIO or direct S3 access:

```bash
STORAGE_TYPE=s3

S3_REGION=us-east-1
S3_BUCKET_NAME=copilot-ld
S3_BUCKET_ROLE_ARN=arn:aws:iam::xxxxxxxxxxxx:xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

### Development Options

```bash
# Enable debug logging for all components
DEBUG=*

# Or enable for specific components
DEBUG=agent
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
      "assistant": "software_dev_expert",
      "permanent_tools": ["get_ontology", "search_content", "query_by_pattern"],
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

### Assistant Configuration (`assistants.yml`)

Defines AI assistant personas with their system prompts and available tools.

```yaml
software_dev_expert:
  tools:
    - get_ontology
    - get_subjects
    - query_by_pattern
    - search
  content: |
    You are a software development expert with deep knowledge of:
    - Software architecture patterns and principles
    - Code quality and maintainability best practices
    - Security considerations in software development
```

Each assistant has:

- `tools`: Array of tool function names available to this assistant
- `content`: System prompt defining the assistant's persona and capabilities

## Runtime Configuration

### Docker Compose Environment

When using Docker Compose, comment out host and port variables to use container
networking. This example uses GNU `sed`:

```bash
sed -i -E '/(HOST|PORT)=/s/^/# /' config/.env
docker compose up
```

### Development vs Production

#### Development Configuration

- Set explicit host/port variables for direct service access
- Use local storage or MinIO for data persistence
- Enable debug logging with `DEBUG=*`
- Use self-signed certificates for SSL

#### Production Configuration

- Use container networking (comment out host/port variables)
- Configure S3-compatible storage with proper credentials
- Disable debug logging or set specific namespaces
- Use valid TLS certificates from trusted CA
- Store secrets in AWS Secrets Manager or similar

## Environment Variable Reference

| Variable                | Purpose                                            | Default                                   | Required           |
| ----------------------- | -------------------------------------------------- | ----------------------------------------- | ------------------ |
| `LLM_TOKEN`             | LLM API access token                               | -                                         | Yes                |
| `LLM_BASE_URL`          | LLM API base URL                                   | `https://api.githubcopilot.com`           | No                 |
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
