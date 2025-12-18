# Ontology Top-Down Processing Flow

This document explains how `process:graphs` works with LLM-enhanced ontology
generation, synonym detection, and entity merging.

## Example Resources

**Resource 1** (from webpage about John):

```turtle
ex:john-123 rdf:type schema:Person .
ex:john-123 schema:name "John Smith" .
ex:john-123 schema:worksFor ex:acme-ltd-456 .

ex:acme-ltd-456 rdf:type schema:Organization .
ex:acme-ltd-456 schema:name "Acme Ltd" .
```

**Resource 2** (from webpage about Jane):

```turtle
ex:jane-789 rdf:type schema:Person .
ex:jane-789 schema:name "Jane Doe" .
ex:jane-789 schema:worksFor ex:acme-000 .

ex:acme-000 rdf:type schema:Organization .
ex:acme-000 schema:name "Acme" .
```

---

## Step-by-Step Flow

### 1. `process(actor)` - Entry Point

```
packages/libgraph/processor/graph.js:325
```

```javascript
await this.initialize(); // Load schema-definitions.json
```

**State after:**

```javascript
this.#schemaDefinitions = {
  Person: {
    aliases: [],
    examples: [],
    props: { name: "Text", worksFor: "Organization" },
  },
  Organization: { aliases: [], examples: [], props: { name: "Text" } },
};
```

---

### 2. `processItem(item)` - For Each Resource

```
packages/libgraph/processor/graph.js:76
```

```javascript
// Parse RDF content into quads
quads = this.#rdfToQuads(item.resource.content);

// Sort quads - rdf:type first (critical for OntologyProcessor)
quads.sort(...);  // Type assertions come first

// Add to graph index
await this.#targetIndex.add(item.identifier, quads);

// Process each quad through OntologyProcessor
for (const quad of quads) {
  this.#ontologyProcessor.process(quad);
}
```

---

### 3. `OntologyProcessor.process(quad)` - Quad Processing

```
packages/libgraph/processor/ontology.js:52
```

**Processing `ex:john-123 rdf:type schema:Person`:**

```javascript
// Records type assertion
this.#typeInstances.set("schema:Person", Set(["ex:john-123"]));
this.#subjectTypes.set("ex:john-123", Set(["schema:Person"]));
```

**Processing `ex:john-123 schema:name "John Smith"`:**

```javascript
// Captures entity name for examples
this.#recordEntityName("ex:john-123", "John Smith");

// State after:
this.#entityNames.set("ex:john-123", "John Smith");
this.#typeExamples.set("schema:Person", Set(["John Smith"]));
```

**After processing both resources:**

```javascript
this.#typeInstances = Map {
  "schema:Person" => Set(["ex:john-123", "ex:jane-789"]),
  "schema:Organization" => Set(["ex:acme-ltd-456", "ex:acme-000"])
}

this.#entityNames = Map {
  "ex:john-123" => "John Smith",
  "ex:jane-789" => "Jane Doe",
  "ex:acme-ltd-456" => "Acme Ltd",
  "ex:acme-000" => "Acme"
}

this.#typeExamples = Map {
  "schema:Person" => Set(["John Smith", "Jane Doe"]),
  "schema:Organization" => Set(["Acme Ltd", "Acme"])
}
```

---

### 4. `saveOntology()` - Finalization

```
packages/libgraph/processor/graph.js:229
```

```javascript
// Run LLM finalization (type normalization, enrichment)
typeMapping = await this.#ontologyProcessor.finalize(this.#llm);

// Run synonym detection
await this.#detectAndMergeSynonyms();
```

---

### 5. `#detectAndMergeSynonyms()` - Find Synonyms

```
packages/libgraph/processor/graph.js:315
```

```javascript
// Build reverse map: name -> IRIs
nameToIRI = Map {
  "John Smith" => ["ex:john-123"],
  "Jane Doe" => ["ex:jane-789"],
  "Acme Ltd" => ["ex:acme-ltd-456"],
  "Acme" => ["ex:acme-000"]
}

// For Organization type with 2+ examples
exampleNames = ["Acme Ltd", "Acme"];
```

**LLM Call (`detectSynonyms`):**

```
packages/libgraph/processor/llm-normalizer.js:229
```

```javascript
// Prompt sent to LLM:
`Analyze these Organization entities and identify synonyms:
- "Acme Ltd"
- "Acme"

Return JSON: {"merges": [{"canonical": "...", "aliases": [...], "confidence": 0.9}]}`

// LLM Response:
{ "merges": [{ "canonical": "Acme Ltd", "aliases": ["Acme"], "confidence": 0.95 }] }
```

---

### 6. `#buildEntityMergeMap()` - Create IRI Mapping

```
packages/libgraph/processor/graph.js:291
```

```javascript
// From merge result:
canonical = "Acme Ltd"  ->  canonicalIRI = "ex:acme-ltd-456"
alias = "Acme"          ->  aliasIRI = "ex:acme-000"

// Build merge map:
this.#entityMergeMap = Map {
  "ex:acme-000" => "ex:acme-ltd-456"
}
```

---

### 7. `#applyEntityMerging()` - Update Graph Index

```
packages/libgraph/processor/graph.js:356
```

**Before (index.jsonl):**

```json
{"id": "resource-1", "quads": [
  {"subject": {"value": "ex:john-123"}, "predicate": {"value": "schema:worksFor"}, "object": {"value": "ex:acme-ltd-456"}}
]}
{"id": "resource-2", "quads": [
  {"subject": {"value": "ex:jane-789"}, "predicate": {"value": "schema:worksFor"}, "object": {"value": "ex:acme-000"}},
  {"subject": {"value": "ex:acme-000"}, "predicate": {"value": "schema:name"}, "object": {"value": "Acme"}}
]}
```

**After (index.jsonl):**

```json
{"id": "resource-1", "quads": [
  {"subject": {"value": "ex:john-123"}, "predicate": {"value": "schema:worksFor"}, "object": {"value": "ex:acme-ltd-456"}}
]}
{"id": "resource-2", "quads": [
  {"subject": {"value": "ex:jane-789"}, "predicate": {"value": "schema:worksFor"}, "object": {"value": "ex:acme-ltd-456"}},
  {"subject": {"value": "ex:acme-ltd-456"}, "predicate": {"value": "schema:name"}, "object": {"value": "Acme"}}
]}
```

Note: `ex:acme-000` references are replaced with `ex:acme-ltd-456` (the
canonical entity).

---

### 8. `#saveSchemaUpdates()` - Persist Schema

```
packages/libgraph/processor/graph.js:423
```

**Before (schema-definitions.json):**

```json
{
  "Organization": { "aliases": [], "examples": [], "props": {...} }
}
```

**After (schema-definitions.json):**

```json
{
  "Organization": {
    "aliases": ["Acme"],
    "examples": ["Acme Ltd", "Acme"],
    "props": {...}
  }
}
```

---

### 9. `serialize()` - Generate Ontology TTL

```
packages/libgraph/serializer.js:26
```

**Output (ontology.ttl):**

```turtle
schema:OrganizationShape a sh:NodeShape ;
    sh:targetClass schema:Organization ;
    sh:name "Organization" ;
    skos:altLabel "Acme" ;
    sh:property [...] .
```

---

## Summary Table

| Step | File                  | What Happens                        |
| ---- | --------------------- | ----------------------------------- |
| 1    | graph.js:325          | Load schema-definitions.json        |
| 2    | graph.js:76           | Parse quads, add to index           |
| 3    | ontology.js:52        | Track types, capture entity names   |
| 4    | graph.js:229          | Start finalization                  |
| 5    | llm-normalizer.js:229 | LLM detects "Acme" = "Acme Ltd"     |
| 6    | graph.js:291          | Map ex:acme-000 -> ex:acme-ltd-456  |
| 7    | graph.js:356          | Update index.jsonl with merged IRIs |
| 8    | graph.js:423          | Save aliases/examples to schema     |
| 9    | serializer.js:26      | Output skos:altLabel in TTL         |

---

## Data Flow Diagram

```
                              process:graphs
                                    |
                                    v
┌─────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZE                                                    │
│    Load schema-definitions.json from data/schemas/              │
│    Sets up OntologyProcessor with schema knowledge              │
└─────────────────────────────────────────────────────────────────┘
                                    |
                                    v
┌─────────────────────────────────────────────────────────────────┐
│ 2. PROCESS RESOURCES                                             │
│    For each resource:                                           │
│    - Parse RDF quads from content                               │
│    - Sort quads (rdf:type first)                                │
│    - Add to graph index (index.jsonl)                           │
│    - Feed quads to OntologyProcessor                            │
│      - Track type instances                                     │
│      - Capture entity names (schema:name values)                │
│      - Build typeExamples map                                   │
└─────────────────────────────────────────────────────────────────┘
                                    |
                                    v
┌─────────────────────────────────────────────────────────────────┐
│ 3. LLM FINALIZATION                                              │
│    - Type normalization (e.g., "Individual" -> "Person")        │
│    - Schema enrichment for unknown types                        │
│    - Apply type mapping to index                                │
└─────────────────────────────────────────────────────────────────┘
                                    |
                                    v
┌─────────────────────────────────────────────────────────────────┐
│ 4. SYNONYM DETECTION                                             │
│    For each type with 2+ entity examples:                       │
│    - Send entity names to LLM                                   │
│    - LLM identifies synonyms (e.g., "Acme" = "Acme Ltd")        │
│    - Build entity merge map (alias IRI -> canonical IRI)        │
└─────────────────────────────────────────────────────────────────┘
                                    |
                                    v
┌─────────────────────────────────────────────────────────────────┐
│ 5. ENTITY MERGING                                                │
│    Update index.jsonl:                                          │
│    - Replace alias IRIs with canonical IRIs                     │
│    - Both as subjects and objects in triples                    │
│    Result: Duplicate entities consolidated                      │
└─────────────────────────────────────────────────────────────────┘
                                    |
                                    v
┌─────────────────────────────────────────────────────────────────┐
│ 6. SAVE OUTPUTS                                                  │
│    - Generate ontology.ttl with skos:altLabel for aliases       │
│    - Update schema-definitions.json with discovered             │
│      aliases and examples for future NER guidance               │
└─────────────────────────────────────────────────────────────────┘
                                    |
                                    v
                           NEXT BATCH BENEFITS
                    - Updated schema improves NER extraction
                    - Aliases help normalize future entities
                    - Examples provide context for LLM
```

---

## Files Modified

| File                                   | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `data/graphs/index.jsonl`              | Graph data with merged entity IRIs          |
| `data/graphs/ontology.ttl`             | SHACL shapes with skos:altLabel for aliases |
| `data/schemas/schema-definitions.json` | Updated with aliases and examples           |
