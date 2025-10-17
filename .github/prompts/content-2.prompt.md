# Structured Eval Content - HTML5 with Microdata

## Purpose

This file defines HTML format requirements for generating BioNova pharmaceutical
company demo content. All generated content must follow the structural
specifications in `SHAPE.md`, align with the narrative context in `STORY.md`,
and support the evaluation scenarios defined in `EVAL.md`.

**Output Location**: `./eval/output/2/`

## HTML Format Requirements

### Microdata Implementation

Use HTML5 semantic markup with embedded microdata:

```html
<div itemscope itemtype="https://schema.org/Person">
  <span itemprop="name">Apollo</span>
  <span itemprop="jobTitle">CEO</span>
  <div itemprop="worksFor" itemscope itemtype="https://schema.org/Organization">
    <span itemprop="name">BioNova</span>
  </div>
</div>
```

**Requirements**:

- Use `itemscope`, `itemtype`, and `itemprop` attributes
- Use `itemid` to assign a stable IRI to every top-level entity (e.g.,
  `itemid="https://bionova.example/id/person/apollo"`). Nested entities SHOULD
  also include `itemid` when they represent reusable concepts that may be
  referenced across files
- Reuse identical `itemid` IRIs for the same real-world entity across different
  files to enable cross-file graph stitching
- All Schema.org types and properties must be 100% accurate
- Nested microdata for relationships (use nested `itemscope` elements)
- Proper HTML5 semantic elements (`article`, `section`, `header`, etc.)

### `itemid` Usage and Cross-File References

Assign globally unique IRIs using a consistent base (recommend:
`https://bionova.example/id/`). Pattern suggestions:

```text
Person:        https://bionova.example/id/person/{slug}
Organization:  https://bionova.example/id/org/{slug}
Drug:          https://bionova.example/id/drug/{slug}
Project:       https://bionova.example/id/project/{slug}
ClinicalTrial: https://bionova.example/id/trial/{slug}
Course:        https://bionova.example/id/course/{slug}
Policy:        https://bionova.example/id/policy/{slug}
Platform:      https://bionova.example/id/platform/{slug}
```

Example including `itemid` IRIs:

```html
<article
  itemscope
  itemtype="https://schema.org/Person"
  itemid="https://bionova.example/id/person/apollo"
>
  <header>
    <h1 itemprop="name">Apollo</h1>
    <p>
      <span itemprop="jobTitle">CEO</span> of
      <span
        itemprop="worksFor"
        itemscope
        itemtype="https://schema.org/Organization"
        itemid="https://bionova.example/id/org/bionova"
        ><span itemprop="name">BioNova</span></span
      >
    </p>
  </header>
</article>
```

Validation rules:

- Every top-level item MUST have `itemid`
- IRIs MUST be lowercase slugs after the type segment (use hyphens for
  multi-word)
- No duplicate IRIs for distinct entities
- Cross-file references MUST exactly match canonical IRIs

### Relationship Encoding

Encode relationships using nested microdata structures:

```html
<!-- Organizational hierarchy -->
<div itemscope itemtype="https://schema.org/Person">
  <span itemprop="name">Poseidon</span>
  <div itemprop="worksFor" itemscope itemtype="https://schema.org/Organization">
    <span itemprop="name">BioNova Commercial</span>
    <div
      itemprop="parentOrganization"
      itemscope
      itemtype="https://schema.org/Organization"
    >
      <span itemprop="name">BioNova</span>
    </div>
  </div>
</div>

<!-- Drug development pipeline -->
<div itemscope itemtype="https://schema.org/Drug">
  <span itemprop="name">Immunex-Plus</span>
  <div
    itemprop="prescriptionStatus"
    itemscope
    itemtype="https://schema.org/DrugPrescriptionStatus"
  >
    <span itemprop="name"
      >Pre-clinical (requires Immunex and Cardiozen approval)</span
    >
  </div>
</div>
```

Add `itemid` IRIs to relationship examples to ensure resolvable graph
references:

```html
<div
  itemscope
  itemtype="https://schema.org/Person"
  itemid="https://bionova.example/id/person/poseidon"
>
  <span itemprop="name">Poseidon</span>
  <div
    itemprop="worksFor"
    itemscope
    itemtype="https://schema.org/Organization"
    itemid="https://bionova.example/id/org/bionova-commercial"
  >
    <span itemprop="name">BioNova Commercial</span>
    <div
      itemprop="parentOrganization"
      itemscope
      itemtype="https://schema.org/Organization"
      itemid="https://bionova.example/id/org/bionova"
    >
      <span itemprop="name">BioNova</span>
    </div>
  </div>
</div>

<div
  itemscope
  itemtype="https://schema.org/Drug"
  itemid="https://bionova.example/id/drug/immunex-plus"
>
  <span itemprop="name">Immunex-Plus</span>
  <div
    itemprop="prescriptionStatus"
    itemscope
    itemtype="https://schema.org/DrugPrescriptionStatus"
    itemid="https://bionova.example/id/status/immunex-plus/pre-clinical"
  >
    <span itemprop="name"
      >Pre-clinical (requires Immunex and Cardiozen approval)</span
    >
  </div>
</div>
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

### Task Planning Requirement

Before beginning content generation for this output set, the agent MUST invoke
the task planning tool to decompose the large content creation effort into many
small, trackable tasks. Requirements:

1. Create an initial task list that covers: file creation order, entity grouping
   per file, relationship encoding checks, validation passes (structure,
   scenario coverage, quality), and final review.
2. Each task should be narrowly scoped (e.g., "Draft organizational file 1:
   leadership hierarchy" rather than generic "Write org files").
3. Mark exactly one task in progress at a time; update status immediately upon
   completion before starting the next.
4. Include explicit tasks for: cross-referencing `SHAPE.md` counts, ensuring
   Schema.org property accuracy, verifying `itemid` IRI uniqueness and
   correctness, and running post-generation validation against `EVAL.md`
   checklists.
5. Add a final task for summarizing completion and any follow-up improvement
   opportunities.
6. Revise the task list if new subtasks emerge (always maintain an up-to-date
   plan).

Do NOT proceed with file writing until the initial task list is created and
displayed. This planning step is mandatory to ensure systematic, high-quality
generation.
