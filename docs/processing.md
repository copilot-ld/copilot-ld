---
title: Processing Guide
description: |
  Complete guide to processing knowledge bases, resources, tools, and vectors
  in Copilot-LD. This covers the offline pipeline that transforms raw knowledge
  into searchable, embedded content.
toc: true
---

## Prerequisites

- [Configuration Guide](/configuration/) completed
- Basic understanding of HTML microdata. See
  [Using Microdata in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Microdata)
  on MDN Web Docs.

## Overview

The Copilot-LD processing pipeline transforms your knowledge base into
searchable resources, tool definitions, and vector embeddings. The system
processes assistants, HTML content, tools, and vectors automatically in the
correct sequence.

## 1. Processing All Data

Process assistants, knowledge base content, tools, and vectors with a single
command. The system handles all stages automatically:

```bash
npm run process
```

## 2. Knowledge Base Structure

Copilot-LD uses HTML files with structured microdata to organize knowledge. This
approach provides semantic context and enables accurate content extraction.

### HTML with Microdata

Knowledge files should use HTML5 microdata with Schema.org vocabularies to
structure content:

```html
<html>
  <head>
    <title>Security Best Practices</title>
  </head>
  <body>
    <article itemscope itemtype="http://schema.org/Article">
      <h1 itemprop="headline">Docker Security Best Practices</h1>
      <div itemprop="articleBody">
        <p>
          Always use specific image tags instead of 'latest' to ensure
          reproducible builds.
        </p>
        <p>
          Implement multi-stage builds to reduce attack surface and image size.
        </p>
        <p>Run containers as non-root users whenever possible.</p>
      </div>
    </article>

    <article itemscope itemtype="http://schema.org/Article">
      <h1 itemprop="headline">Container Registry Security</h1>
      <div itemprop="articleBody">
        <p>Scan container images for vulnerabilities before deployment.</p>
        <p>Use private registries for proprietary or sensitive applications.</p>
      </div>
    </article>
  </body>
</html>
```

### Schema.org Types

The processing pipeline works with any Schema.org types. Common examples
include:

- [`Article`](https://schema.org/Article): Technical articles, best practices,
  guides
- [`HowTo`](https://schema.org/HowTo): Step-by-step procedures and tutorials
- [`FAQPage`](https://schema.org/FAQPage): Frequently asked questions
- [`TechArticle`](https://schema.org/TechArticle): Technical documentation

You can use any Schema.org type that fits your content structure and semantic
needs.

### Example Knowledge Base

Copilot-LD includes example knowledge files to demonstrate the HTML microdata
structure:

```bash
# Copy example knowledge base to your data directory
cp -r examples/knowledge data/
```

## 3. Resource Processing

The resource processor extracts structured content from HTML files and creates
searchable resources stored in the `data/resources/` directory. This happens
automatically when you run `npm run process`.

### Custom CSS Selectors

By default, the processor looks for `[itemscope]` elements. For advanced usage,
you can run the underlying script directly with custom selectors:

```bash
# Process only article elements
node scripts/resources.js --selector "article[itemscope]"

# Process multiple content types
node scripts/resources.js --selector "[itemtype*='Article'], [itemtype*='HowTo']"
```

### Output Structure

Resource processing creates individual JSON files in `data/resources/` with
Copilot-LD (CLD) identifiers. The directory structure includes:

- Individual message resources: `common.Message.{hash}.json`
- Assistant configurations: `common.Assistant.{name}.json`
- Conversation metadata: `common.Conversation.{uuid}.json`
- Tool definitions: `tool.ToolFunction.{name}.json`

```bash
data/resources/
├── common.Message.{hash}.json
├── common.Assistant.{name}.json
└── common.Conversation.{uuid}.json
├── tool.ToolFunction.{name}.json
```

#### Resource Format

Each extracted resource contains:

- **Identifier**: Unique resource ID based on content hash
- **Content**: Extracted text content from the HTML element
- **Metadata**: Schema.org type, source file, extraction timestamp
- **Descriptor**: AI-generated description of the content's purpose and
  applicability

### Assistant Processing

The resource processor also processes assistant configurations, creating
resources for each defined assistant persona. This enables the system to search
and select appropriate assistants based on context.

## 4. Tool Processing

Tool processing generates OpenAI-compatible JSON schemas from Protocol Buffer
definitions, enabling dynamic tool registration and validation. This happens
automatically when you run `npm run process`.

### Protocol Buffer Tool Definitions

Tools are defined using Protocol Buffer messages that describe their parameters
and functionality. The tool processor scans `tools/` directory for `*.proto`
files:

```protobuf
// examples/tools/hash.proto
syntax = "proto3";

package hash;

service Hash {
  rpc Sha256(HashRequest) returns (HashResponse);
  rpc Md5(HashRequest) returns (HashResponse);
}

message HashRequest {
  string input = 1;
}

message HashResponse {
  string hash = 1;
  string algorithm = 2;
}
```

### JSON Schema Generation

The tool processor converts Protocol Buffer definitions into OpenAI-compatible
JSON schemas that can be used for LLM tool calling. Each RPC method in the
service definition becomes a separate tool function:

```json
{
  "type": "object",
  "properties": {
    "input": {
      "type": "string",
      "description": "input field"
    }
  },
  "required": ["input"]
}
```

### Tool Configuration

Generated tool schemas are stored as individual JSON files in `data/resources/`
with the pattern `tool.ToolFunction.{name}.json` and automatically registered
with the Tool service during startup. Each tool entry includes:

- **Tool Name**: Method name from the Protocol Buffer service (e.g.,
  `sha256_hash`, `md5_hash`)
- **Parameters Schema**: JSON schema for validating tool parameters
- **Purpose Description**: AI-generated description of tool functionality
- **Usage Instructions**: Detailed instructions for proper tool usage
- **Applicability Guidelines**: When and when not to use the tool

#### Example Tool Resource

The hash tool generates separate resources for each RPC method. Here's the
generated `sha256_hash` tool resource:

```json
{
  "id": {
    "type": "tool.ToolFunction",
    "name": "sha256_hash"
  },
  "descriptor": {
    "tokens": 89,
    "purpose": "Create deterministic SHA-256 hash of input text.",
    "instructions": "Input: Text string in 'input' field. Output: 64-character hexadecimal SHA-256 hash.",
    "applicability": "Use ONLY when user explicitly requests SHA-256 hashing. DO NOT use for search or content analysis.",
    "evaluation": "Returns exactly 64-character hexadecimal string."
  },
  "name": "sha256_hash",
  "parameters": {
    "type": "object",
    "properties": {
      "input": {
        "type": "string",
        "description": "input field"
      }
    },
    "required": ["input"]
  }
}
```

## 5. Vector Processing

Vector processing creates embeddings of resource content and descriptors for
efficient similarity search and retrieval-augmented generation. This happens
automatically when you run `npm run process`.

### Embedding Strategy

The vector processor creates two types of embeddings:

#### Content Embeddings

- **Purpose**: Direct semantic search of actual content
- **Source**: Full text content extracted from HTML elements
- **Use Case**: Finding specific information, facts, and detailed explanations

#### Descriptor Embeddings

- **Purpose**: Conceptual and categorical search
- **Source**: AI-generated descriptions of content purpose and applicability
- **Use Case**: Finding relevant content types, methodologies, and approaches

### Vector Storage

Embeddings are stored in `data/vectors/` as JSONL files:

- `content.jsonl`: Content-based embeddings
- `descriptors.jsonl`: Descriptor-based embeddings

```bash
data/vectors/
├── content.jsonl
└── descriptors.jsonl
```

Each vector entry contains:

- **Identifier**: Links back to the original resource
- **Embedding**: 1536-dimensional vector from OpenAI text-embedding-3-small

## 6. Data Management Utilities

Copilot-LD includes utilities for managing processed data across development and
deployment environments. These commands require that the
[Deployment Guide](/deployment/) be completed first for proper S3 configuration.

### Upload Processed Data

Upload all processed data from local storage to S3-compatible remote storage:

```bash
npm run upload
```

#### Upload Process

The upload utility synchronizes these storage areas:

- **config/**: Configuration files and secrets
- **generated/**: Generated code and Protocol Buffer artifacts
- **memories/**: Conversation history and chat memories
- **resources/**: Processed knowledge base resources
- **vectors/**: Embedding indices for semantic search

#### S3 Configuration Requirements

Upload requires S3-compatible storage configuration. See the
[Storage Configuration](/configuration/) section in the Configuration Guide for
complete setup details including environment variables and MinIO options.

### Download Processed Data

Download pre-processed data bundle from remote storage:

```bash
npm run download
```

#### Download Process

The download utility retrieves and extracts a `bundle.tar.gz` archive containing
generated code and processed data. This is useful for:

- **Quick Setup**: Skip processing steps with pre-processed data
- **CI/CD Pipelines**: Download consistent data sets for automated deployments
- **Team Synchronization**: Share processed knowledge base across team members

#### Bundle Configuration

Configure the download source in `config/config.json`:

```yaml
tool:
  download:
    owner: "your-organization"
    repo: "your-knowledge-repository"
```

### Data Management Workflow

Typical workflow for managing processed data across environments:

#### Development Environment

```bash
# Process knowledge base locally
npm run process

# Upload processed data to S3
npm run upload
```

#### Production Environment

Download pre-processed data bundle or synchronize from S3 if using the
upload/download pattern, then deploy with processed data available:

```bash
npm run download
```

### Storage Monitoring

Monitor data storage usage and processing status:

```bash
# Check local storage sizes
du -sh data/*/

# Monitor S3 bucket usage (if using AWS)
aws s3 ls s3://your-copilot-ld-bucket --recursive --human-readable --summarize

# Check resource count by type
ls data/resources/ | grep "Message" | wc -l
ls data/resources/ | grep "ToolFunction" | wc -l
ls data/resources/ | grep "Assistant" | wc -l
```

## 7. Querying Processed Data

Query the extracted graph data using the query script. Queries use the format
`<subject> <predicate> <object>` where any field can be replaced with `?` as a
wildcard:

```bash
# Interactive mode
npm run query

# Pipe queries
echo "? headline ?" | npm run query
echo '? name "Agile Values"' | npm run query
echo "#agile-manifesto ? ?" | npm run query
```

### Common Query Patterns

Find resources of a certain type:

```bash
echo "? http://www.w3.org/1999/02/22-rdf-syntax-ns#type TechArticle" | npm run query
```

Find resources using the type shorthand:

```bash
echo "? type DefinedTerm" | npm run query
```

Find all resources with any title:

```bash
echo "? http://purl.org/dc/terms/title ?" | npm run query
```

### Query Tips

- Use quotes for multi-word strings: `"Working software"`
- Use `/limit 10` to control result count
- Reference HTML element IDs directly: `#agile-manifesto`

## Next Steps

Once processing is complete, proceed to:

- [Deployment Guide](/deployment/) - Launch with Docker Compose or AWS
  CloudFormation
- [Development Guide](/development/) - Run locally with live reloading
