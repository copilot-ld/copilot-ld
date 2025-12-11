Overview of ontology_bottom_up.js

### How to run

```
npx env-cmd -- node scripts/ontology_bottom_up.js
```

This script generates a SHACL ontology (ontology.ttl) using a bottom-up
approach - it discovers entity types and synonyms purely from observed data
patterns, without predefined schema knowledge.

Step-by-Step Flow

1. Load Graph Data ([1/7])

- Reads data/graphs/index.jsonl (or custom input file)
- Parses each line as JSON containing RDF quads

2. Analyze Entity Types and Properties ([2/7])

- Extracts rdf:type assertions to build class counts
- Tracks predicate usage and frequencies
- Groups entity instances by type for signature analysis

3. Find Synonyms by Entity Signatures ([3/7])

- Builds "signatures" for entities based on their property patterns
- Entities with identical property patterns are likely synonyms
- Example: If two entities have the same predicates/values, their type labels
  may be synonyms

4. Compute Embeddings for Semantic Similarity ([4/7])

- Uses LLM embeddings API to vectorize class and predicate names
- Normalizes vectors for cosine similarity calculation
- Finds synonym candidates where similarity ≥ threshold (default 0.7)
- Applies semantic suffix filtering to prevent false positives (e.g.,
  "Organization" vs "Trial" won't be grouped)

5. Merge Synonym Sets ([5/7])

- Combines signature-based synonyms (more reliable) with similarity-based
  synonyms
- Creates unified candidate groups for validation

6. LLM Validation and Refinement ([6/7])

- Sends synonym candidates to LLM for validation
- LLM groups terms that are truly interchangeable
- Separates terms that look similar but have different meanings

7. Build Output Ontology ([7/7])

- Generates SHACL TTL with:
  - sh:NodeShape for each canonical type
  - skos:altLabel for discovered synonyms
  - sh:property shapes with usage counts
- Writes to data/graphs/ontology.ttl
