---
applyTo: "**"
---

# Documentation Instructions

## Purpose Declaration

This file defines simple documentation standards for this project to ensure that
`README.md` and `docs/architecture.html` remain current and synchronized with
all code changes across the platform.

## Core Principles

1. **Two-File Documentation**: This project maintains only `README.md` and
   `docs/architecture.html` as official documentation
2. **Component Changelogs**: Each component in `extensions/`, `packages/`, and
   `services/` must maintain a simple `CHANGELOG.md` in ascending chronological
   order
3. **Synchronous Updates**: Documentation updates must accompany code changes in
   the same commit or pull request
4. **Simple Maintenance**: Keep documentation updates straightforward and
   focused on essential information
5. **Valid JavaScript Code Blocks**: All JavaScript code blocks in Markdown must
   be complete, valid, and pass ES linting with strict configuration
6. **🚨 CRITICAL: Inline Markdown Formatting 🚨**: All symbols (variable names,
   class names, method names, property names), file names, directory names,
   service names, and technical terms must be formatted with inline markdown
   code blocks using backticks (`` `symbol` ``). This is MANDATORY and prevents
   spellcheck issues. NEVER add technical terms to `.spellcheck-dict.txt` - use
   backticks instead.

## Implementation Requirements

### Documentation Files

This project maintains exactly two main documentation files plus component
changelogs:

#### README.md Requirements

- **Project Overview**: Clear description of what the project does
- **Setup Instructions**: How to install and configure the project
- **Usage Examples**: Basic examples of how to use the project
- **Development Instructions**: Links to all instruction files for developers
- **Development Workflow**: How to contribute and develop locally

#### docs/architecture.html Requirements

- **System Overview**: High-level description of the system architecture
- **Component Structure**: Overview of services, packages, extensions, and tools
- **Communication Patterns**: How components interact with each other
- **Data Flow**: How information flows through the system

#### Component CHANGELOG.md Requirements

Each component in `extensions/`, `packages/`, and `services/` must maintain a
`CHANGELOG.md` file with this exact format:

```markdown
# Changelog

## 2025-01-01

- Added new `processData()` method to `DataProcessor` class
- Updated `config.yml` with new `timeout` setting
- Version bump to `v1.2.0`

## 2025-01-02

- Fixed issue in `validateInput()` where `null` values caused errors
- Enhanced `APIClient` to support new `retryOptions` parameter
- Updated `README.md` with installation instructions
```

**Format Rules**:

- Single top-level `# Changelog` heading
- Date headings in `YYYY-MM-DD` format using `## ` - **MUST use today's date
  when adding new entries**
- Simple bullet points for each change
- Ascending chronological order (oldest first)
- Updates must be added when component code changes
- **🚨 CRITICAL: Inline Markdown Formatting 🚨**: All symbols (classes, methods,
  variables, properties), file names, service names, and technical terms must be
  formatted with backticks: `` `ClassName` ``, `` `methodName()` ``,
  `` `fileName.js` ``, `` `ServiceName` `` - **NEVER add technical terms to
  `.spellcheck-dict.txt`**

### Update Requirements

When making code changes, update documentation in the same commit:

#### Adding New Components

When adding services, packages, extensions, or tools:

1. Create a `CHANGELOG.md` file in the component directory using the required
   format
2. Update `docs/architecture.html` to include the new component
3. Update `README.md` if the change affects setup or usage
4. Ensure component descriptions are clear and accurate

#### Modifying Existing Components

When changing existing functionality:

1. Add entry to component's `CHANGELOG.md` with current date
2. Update `docs/architecture.html` if the change affects system design
3. Update `README.md` if the change affects user interaction
4. Verify all references remain accurate

### JavaScript Code Block Standards

All JavaScript code blocks in documentation must meet strict quality standards:

#### Completeness Requirements

- **Complete Functions**: Include full function definitions with proper imports
- **Executable Examples**: Code must run without modification when dependencies
  are available
- **Context Inclusion**: Provide sufficient context for understanding the code's
  purpose
- **No Placeholders**: Avoid `...`, `// TODO`, or incomplete implementations

#### ES Linting Compliance

All JavaScript code blocks must pass ES linting with strict configuration:

- **Strict Mode**: Use `"use strict"` or ES modules
- **Proper Imports**: Include all necessary import statements
- **Variable Declarations**: Use `const`/`let` appropriately, avoid `var`
- **Function Definitions**: Use proper function syntax (arrow functions or
  function declarations)
- **Error Handling**: Include appropriate error handling for async operations

#### Example Standards

**✅ CORRECT - Complete and Valid:**

```javascript
/* eslint-env node */
import { Service } from "@copilot-ld/libservice";
import { Config } from "@copilot-ld/libconfig";

const config = new Config();
const service = new Service("example");

class ExampleService {
  constructor(config) {
    this.config = config;
  }

  async processRequest(request) {
    try {
      const result = await this.performOperation(request);
      return { success: true, data: result };
    } catch (error) {
      console.error("Processing error:", error);
      throw error;
    }
  }

  async performOperation(request) {
    return `Processed: ${request.input}`;
  }
}

export default ExampleService;
```

**❌ INCORRECT - Incomplete and Invalid:**

```javascript
/* eslint-disable no-undef */
// Missing imports and context
class ExampleService {
  // Incomplete method
  processRequest(request) {
    // TODO: implement
    return result; // undefined variable
  }
}
```

**✅ CORRECT - Configuration Example:**

```yaml
services:
  example:
    enabled: true
    port: 3000
    timeout: 30000
```

**❌ INCORRECT - Invalid Configuration:**

```yaml
services:
  example: # missing required fields
    enabled: yes # should be boolean
    port: "3000" # should be number
```

## Best Practices

### Documentation Timing

- Update `README.md` and `docs/architecture.html` in the same commit as code
  changes
- Include documentation updates in pull request descriptions
- Reference specific documentation sections in commit messages
- Create documentation drafts before implementation begins
- Review documentation changes during code review process

### Documentation Quality

- Use present tense for current capabilities: "provides", "handles", "processes"
- Be specific about system components and data flows
- Keep descriptions clear and concise
- Focus on essential information that helps users and developers
- Include version information for breaking changes
- Maintain consistent terminology across both files

### Cross-Reference Maintenance

- Verify all component references in `docs/architecture.html` match actual
  implementations
- Ensure setup instructions in `README.md` work with current code
- Validate that usage examples reflect current functionality
- Check that all service names match proto definitions
- Verify port numbers and configuration options are current
- Ensure dependency lists are complete and accurate

### Documentation Validation

Before committing, verify:

1. `README.md` accurately describes current functionality
2. `docs/architecture.html` reflects actual system design
3. Setup and usage instructions are current and functional
4. Component descriptions match implementation
5. All external links are functional and relevant
6. Code examples compile and execute successfully
7. All JavaScript code blocks pass ES linting with strict configuration

### Content Organization Guidelines

#### README.md Structure Requirements

- **Quick Start Section**: Essential commands for immediate setup
- **Prerequisites**: System requirements and dependencies
- **Installation**: Step-by-step setup instructions
- **Configuration**: Environment variables and config file setup
- **Usage Examples**: Common workflows and API usage
- **Development**: Contribution guidelines and local development setup
- **Troubleshooting**: Common issues and solutions

#### docs/architecture.html Structure Requirements

- **System Architecture**: High-level component diagram and overview
- **Service Definitions**: Each service with purpose, dependencies, and
  operations
- **Data Flow Diagrams**: Request/response patterns and information flow
- **Network Architecture**: Container networking and port configurations
- **Security Model**: Authentication, authorization, and data protection
- **Deployment Considerations**: Scaling, monitoring, and operational concerns

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

1. **DO NOT** leave outdated references in `README.md` or
   `docs/architecture.html`
2. **DO NOT** implement new components without updating documentation
3. **DO NOT** create additional documentation files beyond `README.md` and
   `docs/architecture.html`
4. **DO NOT** document implementation details that should be in code comments
5. **DO NOT** omit documentation updates when making functional changes

### Alternative Approaches

- Instead of outdated references → Update documentation in the same commit as
  code changes
- Instead of missing documentation → Include documentation updates in every
  functional change
- Instead of additional files → Use `README.md` for user information and
  `docs/architecture.html` for system design
- Instead of implementation details in docs → Keep high-level descriptions in
  documentation, details in code
- Instead of separate documentation commits → Bundle documentation with code
  changes

## Comprehensive Examples

### Complete Documentation Update Example

When adding a new service called `analysis`:

**docs/architecture.html update:**

```markdown
### Analysis Service

**Purpose**: Processes text analysis requests using machine learning models
**Protocol**: gRPC using analysis.proto definitions **Dependencies**: Vector
Service for embeddings **State**: Stateless processing service

**Key Operations**:

- `AnalyzeText`: Processes text and returns analysis results
- `GetModels`: Returns available analysis models
```

**README.md update (if affects usage):**

```markdown
## Available Services

- **Analysis**: Text analysis and processing
- **Vector**: Document embeddings and similarity
- **History**: Conversation and interaction tracking
```

### Component Modification Example

When modifying the vector service to add new functionality:

**docs/architecture.html update:**

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
## 2025-08-08

- Added new `UpdateIndex` operation to the Vector Service
- Increased default `indexRefreshInterval` to 3600 seconds
```

### Documentation Synchronization Workflow

#### Complete Development Cycle Example

1. **Feature Planning**:

   ```bash
   git checkout -b feature/sentiment-analysis
   # Draft documentation changes first
   vim docs/architecture.html  # Add new component
   vim services/example/CHANGELOG.md # Update changelog
   vim README.md # Update usage examples
   ```

2. **Implementation with Documentation**:

   ```bash
   # Implement feature
   npm run dev
   # Update documentation as code evolves
   git add . && git commit -m "feat: sentiment analysis with docs"
   ```

3. **Pre-commit Validation**:

   ```bash
   # Check documentation linting, formatting and spelling
   npm run check
   ```

4. **Pull Request Process**:
   - Include documentation changes in PR description
   - Reviewers validate both code and documentation
   - Merge only when both are approved and synchronized

### Simple Development Workflow

1. Make code changes to add/modify functionality
2. Update `docs/architecture.html` if system design changes
3. Update the component's `CHANGELOG.md` to describe changes
4. Update `README.md` if the project setup is impacted
5. Commit code and documentation together
6. Verify documentation accuracy in pull request

This approach keeps documentation simple, current, and focused on the two
essential files that users and developers need to understand and work with the
system.
