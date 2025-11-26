---
applyTo: "**"
---

# Documentation Instructions

## Purpose Declaration

This file defines simple documentation standards for this project to ensure that
`README.md` and all documentation guides in `docs/` remain current and
synchronized with all code changes across the platform.

## Core Principles

1. **Nine-File Documentation**: This project maintains `README.md`,
   `docs/index.md`, `docs/concepts.md`, `docs/architecture.md`,
   `docs/reference.md`, `docs/configuration.md`, `docs/processing.md`,
   `docs/development.md`, and `docs/deployment.md` as official documentation
2. **Domain-Specific Documentation**: Each piece of information must exist in
   exactly ONE place. Carefully consider which guide is the authoritative source
   for each topic and use cross-references to avoid duplication
3. **Single Source of Truth**: Configuration, processing, architectural
   concepts, and deployment procedures must be documented in their respective
   domain-specific guides with other guides referencing these authoritative
   sources
4. **Component Changelogs**: Each component in `extensions/`, `packages/`, and
   `services/` must maintain a simple `CHANGELOG.md` in descending chronological
   order
5. **Present Tense Only**: All documentation must describe the current state
   using simple present tense. Never reference previous states, past
   configurations, or what has changed (changelog files are the only exception)
6. **Synchronous Updates**: Documentation updates must accompany code changes in
   the same commit or pull request
7. **Simple Maintenance**: Keep documentation updates straightforward and
   focused on essential information
8. **Valid JavaScript Code Blocks**: All JavaScript code blocks in Markdown must
   be complete, valid, and pass ES linting with strict configuration
9. **🚨 CRITICAL: Spellcheck Strategy 🚨**: Use different approaches for
   different types of terms:
   - **Code Elements Only**: Format ONLY programming symbols (variable names,
     class names, method names, property names, function names), file paths,
     directory paths, and specific service/API names with inline markdown code
     blocks using backticks (`` `symbol` ``). Examples:
     `` `ProcessRequest()` ``, `` `VectorService` ``, `` `config.yml` ``,
     `` `@copilot-ld/libconfig` ``
   - **Everything Else**: Add ALL other terms to `.dictionary.txt` including:
     proper nouns (company/product names), technical terminology (microservices,
     gRPC, protobuf), domain concepts (embeddings, ontology), and standard
     English words
   - **Never mix approaches**: Don't add code symbols to dictionary, don't use
     backticks for technical concepts or terminology

## Implementation Requirements

### Documentation Files

This project maintains exactly nine main documentation files plus component
changelogs. Each file has a specific domain focus and serves as the
authoritative source for its subject matter:

#### README.md Requirements

- **Project Overview**: Clear description of what the project does
- **Quick Setup Instructions**: Essential steps to get started quickly
- **Usage Examples**: Basic examples of how to use the project
- **Links to Detailed Guides**: References to comprehensive documentation
- **Development Workflow**: How to contribute and develop locally

#### docs/index.md Requirements

- **Problem Statement**: What challenges does Copilot-LD address?
- **Solution Overview**: How does the platform solve these problems?
- **Key Capabilities**: What can users accomplish with Copilot-LD?
- **Use Cases**: Who is it for and when should they use it?
- **Getting Started Navigation**: Clear paths to relevant guides for different
  user types

#### docs/concepts.md Requirements

- **Core Concepts**: Explanation of linked data, RAG, microservices, and gRPC
- **Architectural Principles**: Why these design choices were made
- **System Capabilities**: What each component enables
- **Request Flow**: High-level walkthrough of how requests are processed
- **Offline vs Online**: Why processing is separated from runtime

#### docs/architecture.md Requirements

- **System Overview**: High-level component relationships and structure
- **Directory Structure**: Organization of services, packages, extensions, and
  scripts
- **Communication Patterns**: How components interact via gRPC and REST
- **Sequence Diagrams**: Visual representation of online and offline flows
- **Links to Reference**: Pointers to detailed implementation in Reference guide

#### docs/reference.md Requirements

- **Service Implementations**: Detailed descriptions of each service
- **Package Catalog**: Comprehensive package documentation
- **Code Generation**: Protocol Buffer workflow, commands, and patterns
- **Security Implementation**: Authentication mechanisms, threat model, security
  patterns
- **Docker Build Process**: Container architecture and build workflow
- **Tool System**: How tools extend the platform

#### docs/configuration.md Requirements

- **Configuration Overview**: Complete guide to environment variables and YAML
  configuration
- **Environment Variables**: Comprehensive table of all environment variables
  with descriptions, defaults, and examples
- **YAML Configuration**: Documentation of config.yml and assistants.yml
  structure and options
- **Deployment Scenarios**: Configuration differences between local, Docker, and
  AWS deployments
- **Security Guidelines**: Best practices for handling sensitive configuration
  values

#### docs/processing.md Requirements

- **Knowledge Base Processing**: Complete guide to processing HTML knowledge
  sources into searchable resources
- **Processing Pipeline**: Resource extraction, tool generation, and vector
  embedding creation workflows
- **Data Management**: Upload/download utilities and storage management
  procedures
- **HTML Structure Examples**: Authoritative examples of microdata markup and
  Schema.org usage patterns
- **Processing Troubleshooting**: Issues specific to offline processing
  workflows

#### docs/development.md Requirements

- **Development Setup**: Complete local development environment configuration
- **Development Workflow**: Running with `npm run dev` and local testing
- **Development Troubleshooting**: Issues specific to local development setup
- **Cross-References**: Links to Configuration Guide for setup details and
  Processing Guide for knowledge base preparation

#### docs/deployment.md Requirements

- **Production Deployment**: Docker Compose and AWS CloudFormation options
- **Infrastructure Requirements**: Prerequisites and dependencies
- **Security Configuration**: SSL certificates, secrets management
- **Operational Procedures**: Monitoring, scaling, and maintenance
- **Troubleshooting**: Common deployment issues and solutions

#### Component CHANGELOG.md Requirements

Each component in `extensions/`, `packages/`, and `services/` must maintain a
`CHANGELOG.md` file with this exact format:

```markdown
# Changelog

## 2025-01-02

- Fixed issue in `validateInput()` where `null` values caused errors
- Enhanced `APIClient` to support new `retryOptions` parameter
- Updated `README.md` with installation instructions

## 2025-01-01

- Added new `processData()` method to `DataProcessor` class
- Updated `config.yml` with new `timeout` setting
- Version bump to `v1.2.0`
```

**Format Rules**:

- Single top-level `# Changelog` heading
- Date headings in `YYYY-MM-DD` format using `## ` - **MUST use today's date
  when adding new entries**
- Simple bullet points for each change
- Descending chronological order (newest first)
- Updates must be added when component code changes
- **🚨 CRITICAL: Spellcheck Strategy 🚨**: ONLY programming symbols (classes,
  methods, variables, properties, functions), file paths, and specific
  service/API identifiers must be formatted with backticks: `` `ClassName` ``,
  `` `methodName()` ``, `` `fileName.js` ``, `` `VectorService` `` - **NEVER add
  code symbols to `.dictionary.txt`**. ALL other terms including technical
  terminology, domain concepts, proper nouns, and standard English words should
  be added to `.dictionary.txt` instead.

### Update Requirements

When making code changes, update documentation in the same commit:

#### Adding New Components

When adding services, packages, extensions, or scripts:

1. Create a `CHANGELOG.md` file in the component directory using the required
   format
2. **Determine Domain Ownership**: Carefully consider which documentation file
   should be the authoritative source for the new component
3. Update `docs/configuration.md` if the change adds new configuration options
4. Update `docs/architecture.md` to include the new component
5. Update `docs/processing.md` if the change affects knowledge base processing
   or data management workflows
6. Update `docs/development.md` if the change affects local development setup
7. Update `docs/deployment.md` if the change affects deployment procedures
8. Update `README.md` if the change affects quick setup or usage
9. **Add Cross-References**: Include references from other guides to the
   authoritative documentation instead of duplicating information
10. Ensure component descriptions are clear and accurate
11. If you add or change `.proto` files, document required `npm run codegen`
    steps in `docs/architecture.md` and verify generated files are committed
    when appropriate

#### Modifying Existing Components

When changing existing functionality:

1. Add entry to component's `CHANGELOG.md` with current date
2. **Identify Domain Owner**: Determine which documentation file is the
   authoritative source for the affected functionality
3. Update `docs/index.md` if the change affects problem statement, solution
   overview, or use cases
4. Update `docs/concepts.md` if the change affects core concepts or
   architectural principles
5. Update `docs/architecture.md` if the change affects high-level system
   structure
6. Update `docs/reference.md` if the change affects implementation details
7. Update `docs/configuration.md` if the change affects configuration options
8. Update `docs/processing.md` if the change affects knowledge processing or
   data management
9. Update `docs/development.md` if the change affects local development setup
10. Update `docs/deployment.md` if the change affects deployment procedures
11. Update `README.md` if the change affects quick setup or core usage
12. **Update Cross-References**: Verify that references from other guides still
    point to the correct authoritative sections
13. Verify all references remain accurate across all documentation files
14. If you modify `proto/*.proto`, update any code samples in the authoritative
    `docs/reference.md` and ensure references from other guides remain valid

### JavaScript Code Block Standards

All JavaScript code blocks must be complete, valid, and pass ES linting:

- **Complete Functions**: Include full function definitions with proper imports
- **Executable Examples**: Code must run without modification
- **No Placeholders**: Avoid `...`, `// TODO`, or incomplete implementations
- **ES Linting**: Use `const`/`let` appropriately, include proper imports,
  handle errors

**✅ CORRECT Example:**

```javascript
/* eslint-env node */
import { createServiceConfig } from "@copilot-ld/libconfig";

class ExampleService {
  constructor(config) {
    if (!config) throw new Error("config is required");
    this.config = config;
  }

  async processRequest(request) {
    const result = await this.performOperation(request);
    return { success: true, data: result };
  }

  async performOperation(request) {
    return `Processed: ${request.input}`;
  }
}
```

**❌ INCORRECT Example:**

```javascript
/* eslint-disable no-undef */
class ExampleService {
  processRequest(request) {
    // TODO: implement
    return result; // undefined variable
  }
}
```

## Best Practices

### Documentation Timing

- Update `README.md`, `docs/index.md`, `docs/concepts.md`,
  `docs/architecture.md`, `docs/reference.md`, `docs/configuration.md`,
  `docs/processing.md`, `docs/development.md`, and `docs/deployment.md` in the
  same commit as code changes
- **Domain-First Updates**: Always update the authoritative documentation file
  first, then update cross-references in other files
- Include documentation updates in pull request descriptions
- Reference specific documentation sections in commit messages
- Create documentation drafts before implementation begins
- Review documentation changes during code review process
- When `.proto` changes are included, call out the need to run `npm run codegen`
  in the PR description

### Documentation Quality

- Use present tense for current capabilities: "provides", "handles", "processes"
- **Never reference past states**: Document only what the system currently does,
  not what it used to do or what changed (except in changelog files)
- Be specific about system components and data flows
- Keep descriptions clear and concise
- Focus on essential information that helps users and developers
- Include version information for breaking changes
- Maintain consistent terminology across both files

### Cross-Reference Maintenance

- Verify all component references in `docs/architecture.md` match actual
  implementations
- Ensure setup instructions in `README.md` work with current code
- Validate that usage examples reflect current functionality
- Ensure configuration documentation in `docs/configuration.md` is complete and
  current
- Ensure development setup in `docs/development.md` is complete and accurate
- Verify deployment procedures in `docs/deployment.md` work with current
  infrastructure
- Check that all service names match proto definitions
- Verify port numbers and configuration options are current
- Ensure dependency lists are complete and accurate

### Documentation Validation

Before committing, verify:

1. `README.md` accurately describes current functionality
2. `docs/index.md` provides clear problem/solution overview and navigation
3. `docs/concepts.md` explains core concepts and architectural principles
4. `docs/architecture.md` shows high-level system structure
5. `docs/reference.md` contains detailed implementation documentation
6. `docs/configuration.md` contains complete configuration documentation
7. `docs/processing.md` provides complete processing pipeline documentation
8. `docs/development.md` contains complete development setup instructions
9. `docs/deployment.md` provides accurate deployment procedures
10. **No Information Duplication**: Each piece of information exists in exactly
    one authoritative location with appropriate cross-references
11. **Cross-References Work**: All links between documentation files point to
    valid sections and remain accurate
12. Setup and usage instructions are current and functional
13. Component descriptions match implementation
14. All external links are functional and relevant
15. Code examples compile and execute successfully
16. All JavaScript code blocks pass ES linting with strict configuration

### Documentation Maintenance Workflows

#### For New Feature Development

1. **Planning Phase**: Draft documentation changes before coding
2. **Implementation Phase**: Update documentation incrementally with code
3. **Testing Phase**: Validate documentation examples work as described
4. **Review Phase**: Include documentation in code review process
5. **Release Phase**: Final documentation review and publication

#### For Bug Fixes

1. **Identify Documentation Impact**: Determine if fix affects user behavior
2. **Update Relevant Sections**: Modify affected documentation sections
3. **Verify Examples**: Ensure code examples still work correctly
4. **Update Troubleshooting**: Add new known issues if applicable

#### For Refactoring

1. **Assess Documentation Scope**: Identify all affected documentation
2. **Update Component References**: Modify service and package names
3. **Revise Architecture Diagrams**: Update system interaction patterns
4. **Validate Cross-References**: Ensure all internal links remain valid

## Explicit Prohibitions

### Forbidden Documentation Practices

1. **DO NOT** duplicate information across multiple documentation files -
   establish a single authoritative source and reference it from other locations
2. **DO NOT** leave outdated references in `README.md`, `docs/architecture.md`,
   `docs/processing.md`, `docs/development.md`, or `docs/deployment.md`
3. **DO NOT** implement new components without carefully determining which
   documentation file should be the authoritative source
4. **DO NOT** create additional documentation files beyond the nine official
   files
5. **DO NOT** add detailed instructions to guides that should reference other
   domain-specific guides instead
6. **DO NOT** document implementation details that should be in code comments
7. **DO NOT** omit documentation updates when making functional changes
8. **DO NOT** create cross-references that bypass the authoritative
   documentation source

### Alternative Approaches

- Instead of duplicating information → Establish single authoritative sources
  with cross-references from other guides
- Instead of outdated references → Update documentation in the same commit as
  code changes
- Instead of missing documentation → Include documentation updates in every
  functional change
- Instead of additional files → Use the nine official documentation files for
  all documentation needs
- Instead of detailed instructions in wrong guide → Reference the
  domain-specific authoritative guide (e.g., Configuration Guide for setup,
  Processing Guide for knowledge base work)
- Instead of implementation details in docs → Keep high-level descriptions in
  documentation, details in code
- Instead of separate documentation commits → Bundle documentation with code
  changes

## Comprehensive Examples

### Complete Documentation Update Example

When adding a new service called `analysis`:

**docs/reference.md update:**

```markdown
### Analysis Service

**Purpose**: Processes text analysis requests using machine learning models
**Protocol**: gRPC using analysis.proto definitions **Dependencies**: Vector
Service for embeddings **State**: Stateless processing service

**Key Operations**:

- `AnalyzeText`: Processes text and returns analysis results
- `GetModels`: Returns available analysis models
```

**services/analysis/CHANGELOG.md update:**

```markdown
## 2025-10-18

- Added new `analysis` service with `AnalyzeText` and `GetModels` operations
- Integrated with Vector Service for embedding dependencies
```

### Component Modification Example

When modifying the vector service to add new functionality:

**docs/reference.md update:**

```markdown
### Vector Service

**Purpose**: Manages document embeddings and vector similarity searches
**Protocol**: gRPC using vector.proto definitions **State**: Stateless with
persistent vector storage

**Key Operations**:

- `CreateEmbedding`: Generates embeddings for text input
- `SearchSimilar`: Finds similar documents using vector search
- `UpdateIndex`: Refreshes the vector search index (NEW)
```

**services/vector/CHANGELOG.md update:**

```markdown
## 2025-10-16

- Added new `UpdateIndex` operation to the Vector Service
- Increased default `indexRefreshInterval` to 3600 seconds
```

### Documentation Synchronization Workflow

Complete development cycle example:

```bash
# 1. Plan and draft documentation
git checkout -b feature/sentiment-analysis
vim docs/architecture.md  # Add new component

# 2. Implement with documentation
npm run dev
git add . && git commit -m "feat: sentiment analysis with docs"

# 3. Validate before commit
npm run check

# 4. Submit PR with documentation changes
git push origin feature/sentiment-analysis
```
