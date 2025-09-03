---
applyTo: "**/*.instructions.md"
---

# Instructions for Instructions

## Purpose Declaration

This file defines the mandatory content architecture and formatting standards
for all GitHub Copilot instruction files in this project to ensure consistent,
comprehensive, and conflict-free guidance across all instruction sets.

## Core Principles

1. **Standardized Structure**: All instruction files must follow the exact
   six-section architecture without deviation
2. **YAML Frontmatter Required**: Every instruction file must begin with applyTo
   pattern specification
3. **Hierarchical Organization**: Use consistent H1/H2/H3 heading structure for
   predictable navigation
4. **Zero Ambiguity**: Every instruction must be measurable and verifiable with
   specific compliance criteria
5. **Complete Coverage**: Every rule must include comprehensive examples
   demonstrating correct implementation
6. **Optimal Length**: Instruction files must be 350-400 lines for clear,
   comprehensive, yet detailed guidance

## Implementation Requirements

### Required File Structure

Every instruction file must contain these sections in exact order:

```markdown
---
applyTo: "pattern"
---

# [Topic] Instructions

## Purpose Declaration

## Core Principles

## Implementation Requirements

## Best Practices

## Explicit Prohibitions

## Comprehensive Examples
```

### YAML Frontmatter Requirements

All instruction files must begin with frontmatter specifying their scope:

```yaml
---
applyTo: "**/*.test.js" # For specific file patterns
---
# OR
---
applyTo: "**" # For all files
---
```

### Content Architecture Requirements

Every instruction file must contain these sections in order:

#### Section 1: Purpose Declaration

- **Requirement**: Single sentence defining scope and relationship to other
  instructions
- **Length**: 3-5 lines for concise scope definition

#### Section 2: Core Principles

- **Requirement**: Non-negotiable fundamental rules overriding all other
  considerations
- **Length**: 20-30 lines (5-7 numbered principles with enforcement criteria)

#### Section 3: Implementation Requirements

- **Requirement**: Mandatory patterns, structures, and configurations
- **Length**: 120-150 lines including 4-5 major subsections with code examples

#### Section 4: Best Practices

- **Requirement**: Recommended approaches and quality standards with rationale
- **Length**: 80-100 lines with 3-4 focused subsections

#### Section 5: Explicit Prohibitions

- **Requirement**: Clear "DO NOT" statements with explanations and alternatives
- **Length**: 50-70 lines covering 10-12 specific prohibitions

#### Section 6: Comprehensive Examples

- **Requirement**: Annotated code samples demonstrating major rules and patterns
- **Length**: 90-130 lines with 3-4 examples demonstrating key concepts

## Best Practices

### Content Quality Standards

- **Eliminate Ambiguity**: Use specific conditions instead of vague language
- **Define Technical Terms**: Provide clear definitions for domain-specific
  terminology
- **Use Consistent Vocabulary**: Maintain identical terminology across
  instruction files
- **Specify Measurable Outcomes**: Every instruction must have verifiable
  compliance criteria

### Example Standards

- **Complete Rule Coverage**: Every guideline must include annotated examples
- **Progressive Complexity**: Begin with basic cases, advance to complex
  scenarios
- **Error Demonstration**: Show common violations and corrections
- **Real-World Context**: Provide examples from actual development scenarios
- **Consistent Comparison Markup**: Use ✅ **CORRECT** and ❌ **INCORRECT**
  emojis to mark code examples showing proper vs improper patterns

### Format Enforcement

#### Markdown Structure

- **Heading Hierarchy**: H1 for major sections, H2 for subsections, H3 for
  details

### Format Enforcement

- **Heading Hierarchy**: H1 for major sections, H2 for subsections, H3 for
  details
- **List Formatting**: Numbered lists for sequential processes, bullets for
  options
- **Code Block Requirements**: All code must specify language for syntax
  highlighting
- **Comparison Pattern Standards**: When showing correct vs incorrect examples,
  use **✅ CORRECT - [description]:** and **❌ INCORRECT - [description]:**
  formatting for consistent visual distinction
- **Link Standards**: External references must include descriptive text

### Section Organization

- **Implementation Requirements**: Required Patterns, Configuration Standards,
  File Organization
- **Best Practices**: Recommended Approaches, Guidelines, Integration Patterns
- **Explicit Prohibitions**: Forbidden Practices with alternatives
- **Comprehensive Examples**: Complete implementations, progressive complexity
  demonstrations

## Explicit Prohibitions

### Forbidden Content Patterns

1. **DO NOT** use vague or conditional language ("might," "could," "sometimes")
   without specific criteria
2. **DO NOT** create instruction files without YAML frontmatter specifying
   applyTo patterns
3. **DO NOT** deviate from the six-section architecture (Purpose, Principles,
   Implementation Requirements, Best Practices, Prohibitions, Examples)
4. **DO NOT** omit examples for any rule or guideline specified
5. **DO NOT** create duplicate or conflicting guidance between instruction files
6. **DO NOT** use generic examples that don't reflect actual codebase patterns
7. **DO NOT** reference external tools or frameworks without specifying exact
   versions or constraints

### Alternative Approaches

- Instead of vague language → Use specific conditions and measurable criteria
- Instead of missing frontmatter → Always include applyTo pattern specification
- Instead of custom structures → Follow the standardized six-section
  architecture
- Instead of rule-only documentation → Provide comprehensive examples for every
  guideline
- Instead of conflicting guidance → Coordinate between instruction files and
  establish clear precedence
- Instead of generic examples → Use patterns that mirror actual project
  implementations

## Comprehensive Examples

### Complete Instruction File Template

````markdown
---
applyTo: "**/*.example.js"
---

# Example Instructions

## Purpose Declaration

This file defines comprehensive [domain] standards for [pattern] to ensure
[outcomes].

## Core Principles

1. **[Principle Name]**: [Specific requirement] - [Enforcement mechanism]
2. **[Principle Name]**: [Specific requirement] - [Enforcement mechanism]

## Implementation Requirements

### [Category] Requirements

[Mandatory patterns with examples]

## Best Practices

### [Category] Guidelines

[Recommended approaches with rationale]

## Explicit Prohibitions

1. **DO NOT** [specific action] - [reason and alternative]

## Comprehensive Examples

### Complete [Use Case] Example

```javascript
// Annotated complete implementation
```
````

### Section Length Compliance

The optimal length guidelines ensure comprehensive coverage:

- **Purpose Declaration** (3-5 lines): Clear scope definition
- **Core Principles** (20-30 lines): Fundamental rules with enforcement
- **Implementation Requirements** (120-150 lines): Detailed mandatory patterns
- **Best Practices** (80-100 lines): Recommended approaches
- **Explicit Prohibitions** (50-70 lines): Forbidden patterns with alternatives
- **Comprehensive Examples** (90-130 lines): Progressive demonstrations

This structure provides complete guidance while maintaining readability through
the 350-400 line target.

## Best Practices

### [Category] Guidelines

[Recommended approaches with rationale]

```javascript
// Preferred pattern
const example = "recommended approach";
```

## Explicit Prohibitions

### Forbidden [Category] Practices

1. **DO NOT** [specific action] - [reason and alternative]

## Comprehensive Examples

### Complete [Use Case] Example

```javascript
// Annotated complete implementation
```

````

## Best Practices

### [Category] Guidelines

[Recommended approaches with rationale]

```javascript
// Preferred pattern
const example = "recommended approach";
````

## Explicit Prohibitions

### Forbidden [Category] Practices

1. **DO NOT** [specific action] - [reason and alternative]

## Comprehensive Examples

### Complete [Use Case] Example

```javascript
// Annotated complete implementation
```

````

### Architecture-Specific Instruction Example

```markdown
---
applyTo: "services/**/*.js"
---

# Service Development Instructions

## Purpose Declaration

This file defines service implementation standards for all gRPC services in this platform to ensure consistent microservices architecture adherence and proper service isolation.

## Core Principles

1. **Service Isolation**: Each service must be completely independent with no shared state
2. **gRPC Communication**: All inter-service communication must use Protocol Buffers
3. **Error Handling**: Services must implement comprehensive error recovery patterns
4. **Performance Standards**: Services must meet response time and throughput requirements

## Implementation Requirements

### Service Structure Requirements

Generated bases and clients must be used. Extend the generated `*Base` and implement typed RPCs:

```javascript
/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { vector } from "@copilot-ld/libtype";
import { VectorBase } from "./service.js";

class ExampleService extends VectorBase {
  /** @param {vector.QueryItemsRequest} req */
  async QueryItems(req) {
    return { identifiers: [] };
  }
}

await new ExampleService(await ServiceConfig.create("vector"), null).start();
```

### Configuration Requirements

Use `ServiceConfig.create(name, defaults?)` to construct and load service configuration.

## Best Practices

### Error Handling Patterns

Implement structured error responses with appropriate status codes:

```javascript
callback(new Error(`Service error: ${error.message}`));
```

### Logging Standards

Use `this.debug(message, context)` from the base `Service` class.

## Explicit Prohibitions

1. **DO NOT** expose service ports to host network - use internal Docker networks only
2. **DO NOT** maintain state between requests - implement stateless processing
3. **DO NOT** use direct HTTP communication - use gRPC for all inter-service calls

## Comprehensive Examples

### Complete Service Implementation

```javascript
/* eslint-env node */
import { ServiceConfig } from "@copilot-ld/libconfig";
import { ExampleBase } from "./service.js";

class ExampleService extends ExampleBase {
  async ProcessRequest(req) {
    return { status: "success", data: req.query };
  }
}

await new ExampleService(await ServiceConfig.create("example"))
  .start();
```
```

### Code Example Comparison Pattern

When demonstrating correct vs incorrect patterns, use consistent emoji markup:

**✅ CORRECT - Dependency injection with explicit validation:**

```javascript
class Service {
  constructor(dependency) {
    if (!dependency) throw new Error("dependency is required");
    this.dependency = dependency;
  }
}
```

**❌ INCORRECT - Object destructuring in constructor:**

```javascript
class Service {
  constructor({ dependency }) {
    // This pattern is forbidden
    this.dependency = dependency;
  }
}
```

This pattern provides clear visual distinction between acceptable and forbidden approaches, enabling developers to quickly identify proper implementation patterns.

### Real-World Application Example

This instruction file itself demonstrates the prescribed architecture:

1. **YAML Frontmatter**: Specifies `applyTo: "**/*.instructions.md"`
2. **Purpose Declaration**: Single sentence defining scope and relationships
3. **Core Principles**: 6 numbered, enforceable principles with clear enforcement criteria
4. **Implementation Requirements**: Mandatory file structure, frontmatter, and content architecture
5. **Best Practices**: Content quality standards and formatting guidelines with specific requirements
6. **Explicit Prohibitions**: 7 specific forbidden patterns with detailed alternatives
7. **Comprehensive Examples**: Complete template and real-world demonstration with progressive complexity

### Section Length Compliance

The optimal length guidelines ensure each section provides comprehensive coverage:

- **Purpose Declaration** (3-5 lines): Clear scope definition without ambiguity
- **Core Principles** (20-30 lines): Fundamental rules with enforcement mechanisms
- **Implementation Requirements** (120-150 lines): Detailed mandatory patterns and structures
- **Best Practices** (80-100 lines): Recommended approaches with clear rationale
- **Explicit Prohibitions** (50-70 lines): Specific forbidden patterns with alternatives
- **Comprehensive Examples** (90-130 lines): Progressive demonstrations of key concepts

This structure provides developers with complete guidance while maintaining readability and avoiding information overload through the 350-400 line target.
````
