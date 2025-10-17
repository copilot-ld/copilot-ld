---
applyTo: "eval/**"
---

# Evaluation Content Instructions

## Purpose Declaration

This file defines the standards for creating, maintaining, and validating
evaluation content specifications in the `eval/` directory to ensure consistent
generation of BioNova pharmaceutical company demo content used for testing the
platform's vector search and graph traversal capabilities.

### Core Principles

1. **Separation of Concerns**: Each specification file has a distinct
   responsibility to minimize duplication
2. **Single Source of Truth**: Story narrative, structural requirements,
   validation criteria, and format specifications are maintained in separate
   files
3. **Format Independence**: Core entity definitions and test scenarios remain
   constant across format variations
4. **Comprehensive Validation**: All generated content must pass structural,
   scenario, and quality validation
5. **Consistent Output Structure**: Generated content follows standardized
   distribution patterns across formats

## Implementation Requirements

### Required File Structure

The `eval/` directory must maintain this structure:

```
eval/
  STORY.md            # BioNova narrative overview (WHO and WHY)
  SHAPE.md            # Entity definitions and relationships (WHAT to generate)
  EVAL.md             # Test scenarios and validation (HOW TO TEST)
  output/
    1/                # Unstructured and mixed media output
    2/                # HTML5 Microdata format output
    3/                # JSON-LD format output
    [future]/         # Additional format outputs
```

Format-specific prompt files are located in `.github/prompts/`:

```
.github/prompts/
  content-2.prompt.md # HTML5 Microdata format specifications
  content-3.prompt.md # JSON-LD format specifications
  content-*.prompt.md # Additional format specifications
```

### Core Specification Files

#### STORY.md Requirements

The `STORY.md` file is the authoritative source for narrative context and must
contain:

- **Company Identity**: BioNova as a pharmaceutical company
- **Industry Context**: Pharmaceutical drug development, manufacturing, and
  commercialization
- **Organizational Philosophy**: Four department structure (R&D, Manufacturing,
  Commercial, IT)
- **Business Model**: Drug discovery through commercialization value chain
- **Regulatory Environment**: FDA, GMP, HIPAA, ICH-GCP compliance frameworks
- **Strategic Initiatives**: Cross-functional programs spanning departments

#### SHAPE.md Requirements

The `SHAPE.md` file is the authoritative source for structural requirements and
must contain:

- **Entity Names and Quantities**: Complete lists of all entities to generate
  - Organizational hierarchy (people, departments, teams)
  - Product ecosystem (drugs, technology platforms, services)
  - Certification program (courses, prerequisites)
  - Policy framework (documents, categories)
- **Relationship Specifications**: All connections between entities
- **Distribution Requirements**: File counts and item distribution patterns
- **Quantitative Targets**: Specific counts (e.g., "60 people across 4
  departments")

#### EVAL.md Requirements

The `EVAL.md` file is the authoritative source for validation and must contain:

- **Evaluation Scenarios**: Complete set of test cases demonstrating vector vs.
  graph strengths
- **Test Queries**: Specific queries with expected behaviors
- **Validation Checklists**: Comprehensive validation criteria
- **Success Criteria**: Measurable outcomes for each approach
- **Quality Standards**: Requirements for generated content quality

#### Format Prompt Files

Format-specific prompt files in `.github/prompts/` must contain ONLY:

- **Output Location**: Specific directory path (e.g., `./eval/output/2/`)
- **Format Syntax**: Technical requirements for the format (HTML5, JSON-LD,
  etc.)
- **Encoding Patterns**: How to represent relationships in that format
- **Technical Implementation**: Format-specific encoding examples
- **References**: Links to `STORY.md`, `SHAPE.md` and `EVAL.md` for narrative,
  structural and validation requirements

Format specification files must NOT duplicate:

- Narrative content from `STORY.md`
- Entity lists from `SHAPE.md`
- Validation checklists from `EVAL.md`
- Scenario descriptions from `EVAL.md`

### Content Generation Requirements

When generating evaluation content:

1. **Read `STORY.md` first** to understand the BioNova narrative context
2. **Read `SHAPE.md` second** to understand complete structural requirements
3. **Review `EVAL.md`** to understand scenarios and validation criteria
4. **Follow specific prompt file** (e.g., `.github/prompts/content-2.prompt.md`)
   for format requirements
5. **Validate with `EVAL.md`** to verify output against all checklists

Generated content must:

- Match exact entity counts specified in `SHAPE.md`
- Include all relationships defined in `SHAPE.md`
- Support all test scenarios defined in `EVAL.md`
- Follow format requirements from applicable prompt file
- Pass all validation checklists from `EVAL.md`

### Output Organization Requirements

Each format output directory must:

- Contain exactly 15 files following distribution pattern from `SHAPE.md`
- Include 200-250 total items distributed across files
- Maintain consistent entity relationships
- Support both vector search and graph traversal queries

## Best Practices

### File Organization

- **Keep concerns separated**: Never duplicate content between `STORY.md`,
  `SHAPE.md`, `EVAL.md`, and prompt files
- **Use cross-references**: Link between files rather than duplicating
  information
- **Maintain parallel structure**: All prompt files should have identical
  section organization
- **Verify file paths**: Use correct paths (`eval/`, not `examples/knowledge/`)
  in all references

### Adding New Format Variations

To add a new format specification (e.g., `content-4.prompt.md` for RDF/XML):

1. Copy an existing prompt file as template
2. Update the output location to new directory
3. Replace format requirements section with new format syntax
4. Update relationship encoding examples for new format
5. Keep all references to `SHAPE.md` and `EVAL.md` unchanged
6. Create corresponding output directory under `eval/output/`

### Validation Workflow

Before committing generated content:

1. **Structural validation** using `SHAPE.md`:
   - Verify entity counts match specifications
   - Confirm all relationships are present
   - Check file distribution pattern

2. **Scenario validation** using `EVAL.md`:
   - Execute all test queries
   - Verify expected behaviors
   - Confirm both vector and graph traversal work

3. **Quality validation** using `EVAL.md`:
   - Apply all validation checklists
   - Verify content quality standards
   - Check format compliance

### Maintenance Patterns

When updating requirements:

- **Story changes** → Update `STORY.md` only, consider if content regeneration
  needed
- **Entity changes** → Update `SHAPE.md` only, then regenerate content
- **Scenario changes** → Update `EVAL.md` only, then re-validate content
- **Format changes** → Update specific prompt file only
- **Validation changes** → Update `EVAL.md` only, then re-validate all outputs

### Consistency Verification

Before committing changes to specification files, verify:

- No duplication exists between `STORY.md`, `SHAPE.md` and `EVAL.md`
- Prompt files reference (not duplicate) core specifications
- All prompt files maintain parallel structure
- File paths in all references are correct
- Output directories align with format specifications

## Explicit Prohibitions

### Forbidden Patterns

1. **DO NOT** duplicate entity lists across multiple specification files
2. **DO NOT** copy validation checklists into format-specific files
3. **DO NOT** include scenario descriptions in prompt files
4. **DO NOT** modify `SHAPE.md` to accommodate format-specific requirements
5. **DO NOT** create format outputs outside the `eval/output/` directory
   structure
6. **DO NOT** generate content without validating against all three core
   specification files
7. **DO NOT** mix structural requirements with format requirements
8. **DO NOT** create additional README files for format-specific directories

### Alternative Approaches

- Instead of duplicating entity lists → Reference `SHAPE.md` from format files
- Instead of copying validation checklists → Link to `EVAL.md` from generated
  content documentation
- Instead of embedding scenarios in format files → Reference `EVAL.md` test
  scenarios
- Instead of duplicating narrative → Reference `STORY.md` for context
- Instead of format-specific entity modifications → Keep entities
  format-independent in `SHAPE.md`
- Instead of scattered output directories → Use structured `eval/output/`
  hierarchy
- Instead of skipping validation → Always run complete validation workflow
- Instead of mixing concerns → Maintain strict separation between narrative
  (STORY.md), structure (SHAPE.md), and validation (EVAL.md) files

## Comprehensive Examples

### Complete Content Generation Workflow

```javascript
/* eslint-env node */
import { readFile } from "fs/promises";
import { validateStructure } from "./validators/structure.js";
import { validateScenarios } from "./validators/scenarios.js";
import { generateContent } from "./generators/content.js";

// 1. Load specifications
const story = await readFile("eval/STORY.md", "utf-8");
const shape = await readFile("eval/SHAPE.md", "utf-8");
const evalSpec = await readFile("eval/EVAL.md", "utf-8");
const formatSpec = await readFile(
  ".github/prompts/content-2.prompt.md",
  "utf-8",
);

// 2. Generate content
const content = await generateContent({
  narrative: story,
  structure: shape,
  format: formatSpec,
  outputDir: "./eval/output/2/",
});

// 3. Validate against specifications
const structureValid = await validateStructure(content, shape);
const scenariosValid = await validateScenarios(content, evalSpec);

if (!structureValid || !scenariosValid) {
  throw new Error("Generated content failed validation");
}

// 4. Output results
console.log("Content generated and validated successfully");
```

### Adding New Format Specification

When creating `content-4.prompt.md` for RDF/XML format:

````markdown
---
# content-4.prompt.md - RDF/XML Format Specification
---

## Output Location

Generated files must be placed in: `./eval/output/4/`

## Format Requirements

### RDF/XML Structure

All content must use RDF/XML syntax with proper namespace declarations:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:schema="http://schema.org/">
  <!-- Content here -->
</rdf:RDF>
```
````

### Entity Encoding

For complete entity lists and quantities, see: `eval/SHAPE.md`

Person entities must be encoded as:

```xml
<rdf:Description rdf:about="https://technova.example.com/person/sarah-chen">
  <rdf:type rdf:resource="http://schema.org/Person"/>
  <schema:name>Sarah Chen</schema:name>
  <schema:jobTitle>Chief Executive Officer</schema:jobTitle>
</rdf:Description>
```

## Validation

For complete validation checklists and test scenarios, see: `eval/EVAL.md`

Generated content must:

- Support all test queries defined in `EVAL.md`
- Pass structural validation from `SHAPE.md`
- Use valid RDF/XML syntax

````

### Validation Script Example

```javascript
/* eslint-env node */
import { readdir, readFile } from "fs/promises";
import { parseShape } from "./parsers/shape.js";
import { parseEval } from "./parsers/eval.js";

async function validateOutput(outputDir) {
  // Load specifications
  const shapeSpec = await parseShape("eval/SHAPE.md");
  const evalSpec = await parseEval("eval/EVAL.md");

  // Load generated files
  const files = await readdir(outputDir);

  // Validate structure
  if (files.length !== 15) {
    throw new Error(`Expected 15 files, found ${files.length}`);
  }

  // Validate entity counts
  let totalPeople = 0;
  for (const file of files) {
    const content = await readFile(`${outputDir}/${file}`, "utf-8");
    totalPeople += countEntities(content, "Person");
  }

  if (totalPeople !== shapeSpec.people.total) {
    throw new Error(
      `Expected ${shapeSpec.people.total} people, found ${totalPeople}`,
    );
  }

  // Validate scenarios
  for (const scenario of evalSpec.scenarios) {
    const results = await executeTestQuery(scenario.query, outputDir);
    if (!validateResults(results, scenario.expected)) {
      throw new Error(`Scenario "${scenario.name}" failed validation`);
    }
  }

  return { status: "valid", files: files.length, entities: totalPeople };
}

await validateOutput("./eval/output/2/");
````

### Maintenance Workflow Example

When adding a new certification course to `SHAPE.md`:

```markdown
## Before: SHAPE.md

### Certification Courses (10 courses)

- Cloud Foundations
- Advanced Kubernetes [...8 more courses...]

## After: SHAPE.md

### Certification Courses (11 courses)

- Cloud Foundations
- Advanced Kubernetes
- Security Essentials [NEW] [...8 more courses...]

## Required Actions:

1. Update SHAPE.md with new course (DONE)
2. Regenerate all content in eval/output/\* (PENDING)
3. Validate against EVAL.md scenarios (PENDING)
4. Update course count in distribution requirements (PENDING)
```

All format specifications (`content-*.prompt.md`) automatically inherit the new
course without modification because they reference `SHAPE.md` rather than
duplicating the course list.
