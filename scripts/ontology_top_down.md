Topdown

### How to run

```
npx env-cmd -- node scripts/ontology_top_down.js
```

### Overview

This script generates a SHACL ontology (ontology.ttl) and graph index
(index.jsonl) using a top-down approach - it starts with predefined Schema.org
vocabulary knowledge and applies it to observed data.

Step-by-Step Flow

1. Load Resources ([1/4])

- Loads all resources from ResourceIndex
- Filters out non-RDF resources (conversations, assistants, tool functions)

2. Process Resources ([2/5])

- Parses RDF Turtle content from each resource
- Tracks:
  - Type instances: Which subjects have which rdf:type
  - Type properties: Which properties are used for each type
  - Property object types: What types are linked via object properties
  - Schema property usage: Which Schema.org-defined properties are actually
    observed
  - Unknown types: Types without predefined schema definitions

3. LLM Enhancements ([3/5])

Three LLM powered steps:

a. Type Normalization (normalizeTypes)

- Maps discovered types to canonical Schema.org types
- Example: Individual → Person, Corporation → Organization
- Merges instances and properties from discovered types into canonical types

b. Schema Enrichment (enrichSchemas)

- For remaining unknown types, asks LLM if they're valid Schema.org types
- If so, adds their expected properties to SCHEMA_DEFINITIONS

c. Schema Validation (validateSchemas)

- Compares observed properties vs schema-defined properties
- Reports missing/extra properties per type

4. Generate SHACL TTL ([4/5])

- Creates SHACL NodeShape for each type with:
  - sh:targetClass pointing to the type
  - sh:property shapes for each property (schema-defined + discovered)
  - Type constraints (sh:class, sh:datatype) based on schema ranges or observed
    patterns
  - Usage statistics in comments

5. Write Output ([5/5])

- data/graphs/ontology.ttl - SHACL shapes
- data/graphs/index.jsonl - RDF quads per resource (with normalized types)
