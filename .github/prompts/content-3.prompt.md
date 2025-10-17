# Structured Eval Content - JSON-LD Format

## Purpose

This file defines JSON-LD format requirements for generating BioNova
pharmaceutical company demo content. All generated content must follow the
structural specifications in `SHAPE.md`, align with the narrative context in
`STORY.md`, and support the evaluation scenarios defined in `EVAL.md`.

**Output Location**: `./eval/output/3/`

## JSON-LD Format Requirements

### JSON-LD Implementation

Use standalone JSON-LD files with proper `@context` and `@type` declarations:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Apollo",
  "jobTitle": "CEO",
  "worksFor": {
    "@type": "Organization",
    "name": "BioNova"
  }
}
```

**Requirements**:

- Use `@context`, `@type`, and standard Schema.org property names
- Use `@id` to assign a stable IRI for every entity that should be referenced
  across files (top-level and nested reusable entities). Prefer a consistent
  base IRI (e.g., `https://bionova.example/id/person/apollo`).
- Reuse the same `@id` for the same real-world entity in all files where it
  appears
- All Schema.org types and properties must be 100% accurate
- Nested objects for relationships (use nested JSON objects)
- Proper JSON syntax with valid structure

### `@id` Usage and Cross-File Referencing

Adopt a canonical IRI pattern (recommended base: `https://bionova.example/id/`):

```text
Person:        https://bionova.example/id/person/{slug}
Organization:  https://bionova.example/id/org/{slug}
Drug:          https://bionova.example/id/drug/{slug}
Project:       https://bionova.example/id/project/{slug}
ClinicalTrial: https://bionova.example/id/trial/{slug}
Course:        https://bionova.example/id/course/{slug}
Policy:        https://bionova.example/id/policy/{slug}
Platform:      https://bionova.example/id/platform/{slug}
Status:        https://bionova.example/id/status/{slug}
```

Example with canonical `@id` values:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://bionova.example/id/person/apollo",
      "name": "Apollo",
      "jobTitle": "CEO",
      "worksFor": {
        "@type": "Organization",
        "@id": "https://bionova.example/id/org/bionova",
        "name": "BioNova"
      }
    },
    {
      "@type": "Person",
      "@id": "https://bionova.example/id/person/zeus",
      "name": "Zeus",
      "jobTitle": "CTO",
      "worksFor": { "@id": "https://bionova.example/id/org/bionova" }
    }
  ]
}
```

Validation rules:

- All top-level entities MUST have `@id`
- Slugs MUST be lowercase, hyphen-separated
- No duplicate `@id` values for distinct entities
- Cross-file references MUST reuse identical IRIs
- Nested entities SHOULD include `@id` if they may be referenced elsewhere

### Relationship Encoding

Encode relationships using nested JSON-LD structures:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Poseidon",
  "worksFor": {
    "@type": "Organization",
    "name": "BioNova Commercial",
    "parentOrganization": {
      "@type": "Organization",
      "name": "BioNova"
    }
  }
}
```

For arrays of related items:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://bionova.example/id/person/apollo",
      "name": "Apollo",
      "jobTitle": "CEO"
    },
    {
      "@type": "Person",
      "@id": "https://bionova.example/id/person/zeus",
      "name": "Zeus",
      "jobTitle": "CTO"
    }
  ]
}
```

Add canonical `@id` references to relationship examples:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://bionova.example/id/person/poseidon",
      "name": "Poseidon",
      "worksFor": {
        "@type": "Organization",
        "@id": "https://bionova.example/id/org/bionova-commercial",
        "name": "BioNova Commercial",
        "parentOrganization": {
          "@type": "Organization",
          "@id": "https://bionova.example/id/org/bionova",
          "name": "BioNova"
        }
      }
    },
    {
      "@type": "Drug",
      "@id": "https://bionova.example/id/drug/immunex-plus",
      "name": "Immunex-Plus",
      "prescriptionStatus": {
        "@type": "DrugPrescriptionStatus",
        "@id": "https://bionova.example/id/status/immunex-plus/pre-clinical",
        "name": "Pre-clinical (requires Immunex and Cardiozen approval)"
      }
    }
  ]
}
```

## Content Generation Guidelines

### Before You Start

1. Read `STORY.md` for the complete BioNova narrative context
2. Read `SHAPE.md` thoroughly - it defines all entities, quantities, and
   relationships
3. Review `EVAL.md` - it defines the evaluation scenarios and validation
   criteria
4. Understand the output format requirements in this file

### Writing Approach

Follow the content quality guidelines defined in `EVAL.md`:

- **Vector-optimized content**: Use semantic diversity techniques (see EVAL.md
  validation guidelines)
- **Graph-optimized content**: Implement explicit relationships (see EVAL.md
  validation guidelines)
- **Hybrid content**: Combine both approaches (see EVAL.md validation
  guidelines)

### Validation

After generating content, validate against the checklists in `EVAL.md`:

- Structural compliance with SHAPE.md
- Scenario support for all test queries in EVAL.md
- Content quality standards from EVAL.md validation guidelines
- Valid JSON syntax

### Task Planning Requirement

Before starting JSON-LD content generation, the agent MUST use the task planning
tool to break down the complete output set into granular tasks. Requirements:

1. Initial plan must enumerate tasks for: selecting entity groups per file,
   drafting each JSON-LD file, validating Schema.org types/properties,
   relationship nesting checks, running scenario validation, and final
   consistency review.
2. Tasks must be fine-grained (e.g., "Create product-suite.jsonld with 12
   entities" instead of "Write product files").
3. Only one task may be in progress; update its status immediately upon
   completion before moving on.
4. Include dedicated tasks for verifying counts against `SHAPE.md`, ensuring
   property accuracy, verifying `@id` uniqueness and canonical pattern
   adherence, and performing JSON syntax validation.
5. Include a concluding task to summarize outcomes and note any recommended
   enhancements.
6. Evolve the task list as needed—add new subtasks when discoveries occur.

The agent must not generate any file content until the initial detailed task
plan is produced and visible. This planning step is mandatory for controlled,
high-quality generation.
