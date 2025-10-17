# BioNova Demo Content Evaluation Scenarios

This document defines evaluation scenarios for testing and validating the
BioNova pharmaceutical company demo content. Each scenario demonstrates specific
strengths of vector search, graph traversal, or hybrid approaches.

**Story Context**: See `STORY.md` for the complete BioNova narrative overview.

**Important**: All entity names, structures, and relationships referenced here
come from `SHAPE.md`. These scenarios focus on **what to test** and **expected
behaviors**, not on structural details.

## Overview

The seven scenarios below demonstrate the complementary nature of vector
similarity search and graph-based queries in the pharmaceutical domain:

- **Scenario 1**: Vector search for scientific knowledge discovery
- **Scenario 2**: Graph traversal for organizational relationships
- **Scenario 3**: Hybrid approach for drug development pipelines
- **Scenario 4**: Graph traversal for certification learning paths
- **Scenario 5**: Hybrid approach for regulatory compliance
- **Scenario 6**: Hybrid approach for technology platform ecosystem
- **Scenario 7**: Error handling and edge cases

## Scenario 1: Scientific Knowledge Base (Vector Search)

**Objective**: Demonstrate semantic similarity search across diverse
pharmaceutical and scientific content.

### Content Design Approach

Create scientific articles using varied vocabulary for similar concepts:

- Write about drug mechanisms, pharmacokinetics, and therapeutic effects using
  different terminology
- Develop clinical study reports that describe similar outcomes with different
  language
- Create FAQ entries with varied phrasing for related regulatory and clinical
  questions
- Use different abstraction levels (patient education vs. scientific research
  depth)

### Example Test Prompts

**Prompt 1: Drug Formulation Optimization**

```sh
echo "How to optimize drug formulation" | npm run -s chat
```

Expected results should include content about:

- Pharmaceutical development processes
- Bioavailability optimization techniques
- Drug delivery system design
- Formulation chemistry concepts

**Prompt 2: Clinical Trial Safety Management**

```sh
echo "Managing adverse events in clinical trials" | npm run -s chat
```

Expected results should include content about:

- Pharmacovigilance procedures
- Patient safety protocols
- Clinical trial monitoring
- Adverse event reporting requirements

**Prompt 3: Synonym-Based Discovery**

```sh
echo "cancer treatment options" | npm run -s chat
```

Expected results should include content about:

- Oncology therapies and medications
- Tumor treatment approaches
- Cancer drug development
- Therapeutic interventions for malignancies

Note: This tests semantic similarity across synonyms (cancer/oncology/tumor,
treatment/therapy/medication)

**Prompt 4: Abstraction Level Handling**

```sh
echo "How do drugs work in the body?" | npm run -s chat
```

vs.

```sh
echo "Explain the pharmacokinetics and pharmacodynamics of monoclonal antibodies" | npm run -s chat
```

Expected results:

- First query should return patient-education level content about drug
  mechanisms
- Second query should return research-level pharmacological details
- Both should retrieve semantically relevant content at appropriate depth
- System should handle both general and specific abstraction levels

### Success Criteria

- Semantically similar content is discoverable despite different vocabulary
- Results span multiple scientific abstraction levels
- Prompts return relevant content from different document types (scholarly
  articles, FAQs, blog posts)

## Scenario 2: Organizational Intelligence (Graph Traversal)

**Objective**: Demonstrate relationship traversal through pharmaceutical
organizational structures.

### Content Design Approach

Use the organizational hierarchy from SHAPE.md to create traversable
relationships:

- Implement proper `worksFor`, `member`, and reporting relationships
- Connect people across departments through project membership
- Link events to attendees from multiple departments
- Create multi-hop relationship chains (HQ → Department → Team → Individual)

### Example Test Prompts

**Prompt 1: Organizational Reporting Chain**

```sh
echo "Find all people who report to the Chief Scientific Officer" | npm run -s chat
```

Expected results should include:

- Direct reports to CSO (department heads in R&D)
- Complete reporting hierarchy traversal
- Names and roles of all personnel in the chain

**Prompt 2: Project Team Membership**

```sh
echo "Find all projects involving the R&D Drug Discovery team" | npm run -s chat
```

Expected results should include:

- All projects with Drug Discovery team members
- Cross-functional project relationships
- Project names and team connections

**Prompt 3: Cross-Department Event Participation**

```sh
echo "Find attendees of GMP Training who work in Manufacturing" | npm run -s chat
```

Expected results should include:

- Manufacturing department personnel who attended GMP Training
- Department and event relationship intersection
- Attendee names and manufacturing roles

**Prompt 4: Multi-Department Dependency Chain**

```sh
echo "Find all people involved in projects that depend on the MolecularForge platform" | npm run -s chat
```

Expected results should include:

- All projects using platforms that depend on MolecularForge
- Team members from those projects across multiple departments
- Should traverse: Platform → Dependent Platforms → Projects → People
- Multi-hop relationship chain (3-4 levels deep)

**Prompt 5: Service Provider Discovery**

```sh
echo "What services does BioNova offer to external clients?" | npm run -s chat
```

Expected results should include:

- Contract Manufacturing Services (CMO capabilities)
- Clinical Trial Conduct Services (CRO capabilities)
- Regulatory Consulting Services
- Provider departments and service capabilities
- Service descriptions and offerings

**Prompt 6: Platform Usage Mapping**

```sh
echo "Which teams use the MolecularForge platform?" | npm run -s chat
```

Expected results should include:

- R&D Drug Discovery Team (primary users)
- Dependent platforms that require MolecularForge
- Cross-department technology integration
- Team names and platform dependencies

**Prompt 7: Medical Organization Network**

```sh
echo "List all clinical trial sites and their locations" | npm run -s chat
```

Expected results should include:

- Medical organizations conducting trials
- Geographic locations of trial sites
- Associated clinical trials at each site
- Organizational affiliations

### Success Criteria

- Organizational hierarchy is fully traversable
- Cross-functional relationships (projects, events) connect different
  departments
- Multi-hop queries return correct results across relationship chains
- Intersection queries work across multiple relationship types
- Managed services are discoverable and properly described
- Platform usage relationships link teams to technology
- Medical organizations are connected to clinical trials

## Scenario 3: Drug Development Pipeline (Hybrid Approach)

**Objective**: Demonstrate when both vector search and graph traversal are
needed for pharmaceutical product information.

### Content Design Approach

Create drug documentation that combines rich clinical descriptions with explicit
pipeline relationships:

- Write detailed mechanism of action descriptions with therapeutic depth
  (vector-searchable)
- Implement drug development pipeline relationships from SHAPE.md
  (graph-traversable)
- Create clinical trial protocols that explain both scientific concepts and
  connections
- Include pharmacological content with drug-drug interaction references

### Example Test Prompts

**Prompt 1: Vector Search - Drug Mechanism of Action**

```sh
echo "How does the drug work for cardiovascular disease" | npm run -s chat
```

Expected results should include:

- Cardiovascular drug mechanisms
- Therapeutic effects on heart disease
- Clinical efficacy descriptions
- Pharmacological action pathways

**Prompt 2: Graph Traversal - Pipeline Dependencies**

```sh
echo "What drugs depend on successful Phase III trials of Oncora?" | npm run -s chat
```

Expected results should include:

- Drugs with pipeline dependencies on Oncora
- Development stage relationships
- Clinical trial connections

**Prompt 3: Hybrid - Oncology Pipeline Documentation**

```sh
echo "Find clinical documentation for drugs in the oncology pipeline" | npm run -s chat
```

Expected results should include:

- Clinical documents for oncology drugs (vector search)
- Pipeline relationships showing oncology focus (graph traversal)
- Combined semantic and structural information

**Prompt 4: Complex Drug Dependency Query**

```sh
echo "What clinical evidence supports drugs required for Immunex-Plus development?" | npm run -s chat
```

Expected results should include:

- Clinical data for both Immunex AND Cardiozen (graph dependency traversal)
- Semantic search through clinical trial descriptions and study reports
- Combination therapy rationale and scientific evidence
- Multi-drug dependency relationships

### Success Criteria

- Drug mechanisms and clinical effects are discoverable through semantic search
- Drug pipeline dependencies are traversable through graph relationships
- Clinical documentation is linked to drugs through proper relationships
- Hybrid queries successfully combine both search approaches

## Scenario 4: Certification Learning Paths (Graph Traversal)

**Objective**: Demonstrate prerequisite chain traversal in pharmaceutical
certification programs.

### Content Design Approach

Use the certification tracks from SHAPE.md to create prerequisite chains:

- Implement `coursePrerequisites` relationships between courses
- Create course descriptions with learning objectives (vector-searchable)
- Link courses to their providers (department relationships)
- Build multi-level prerequisite paths (Foundation → Intermediate → Advanced →
  Certification)

### Example Test Prompts

**Prompt 1: Course Prerequisites**

```sh
echo "What courses must I complete before Regulatory Affairs and FDA Submissions?" | npm run -s chat
```

Expected results should include:

- All prerequisite courses in the chain
- Course names and sequence order
- Complete prerequisite path from foundation to target course

**Prompt 2: Certification Track Courses**

```sh
echo "Find all courses in the Manufacturing Excellence certification track" | npm run -s chat
```

Expected results should include:

- All courses in the Manufacturing Excellence track
- Prerequisite relationships between courses
- Complete certification path

**Prompt 3: Vector Search - GMP Training Content**

```sh
echo "Find content about GMP compliance training" | npm run -s chat
```

Expected results should include:

- Course descriptions mentioning GMP compliance
- Training materials about Good Manufacturing Practices
- Regulatory compliance content

### Success Criteria

- Prerequisite chains are fully traversable
- Multiple prerequisite paths work correctly (parallel prerequisites)
- Course content is searchable while relationships are traversable
- Certification requirements can be determined through graph queries

## Scenario 5: Regulatory Compliance (Hybrid Approach)

**Objective**: Demonstrate hierarchical policy relationships with searchable
pharmaceutical compliance content.

### Content Design Approach

Use the policy framework from SHAPE.md to create a compliance hierarchy:

- Implement `isPartOf` and `citation` relationships between policies
- Write comprehensive policy text covering FDA, GMP, HIPAA requirements
  (vector-searchable)
- Create cross-references between policies and compliance frameworks
- Build 3-level hierarchy (Master QMS → Category → Specific Procedures)

### Example Test Prompts

**Prompt 1: Graph Traversal - FDA Compliance Policies**

```sh
echo "Find all policies required for FDA compliance" | npm run -s chat
```

Expected results should include:

- Master policies citing FDA requirements
- All dependent policies in the hierarchy
- Complete compliance framework

**Prompt 2: Graph Traversal - Policy Dependencies**

```sh
echo "What policies does Clinical Trial Policy depend on?" | npm run -s chat
```

Expected results should include:

- Policies that Clinical Trial Policy references
- Hierarchical policy relationships
- Citations and dependencies

**Prompt 3: Vector Search - Patient Data Protection**

```sh
echo "Find content about patient data protection requirements" | npm run -s chat
```

Expected results should include:

- HIPAA compliance policy content
- Patient privacy protection procedures
- Data security requirements

### Success Criteria

- Policy hierarchy is fully traversable (3 levels deep)
- Compliance frameworks correctly reference required policies (FDA, GMP, HIPAA,
  ICH-GCP)
- Policy content is searchable for specific regulatory requirements
- Hierarchical relationships and cross-references work correctly

## Scenario 6: Technology Platform Ecosystem (Hybrid Approach)

**Objective**: Demonstrate technology platform dependencies and capabilities in
pharmaceutical IT context.

### Content Design Approach

Create platform documentation that combines technical capabilities with
integration relationships:

- Write detailed platform capability descriptions (AI drug discovery, clinical
  trial management) (vector-searchable)
- Implement platform dependency relationships from SHAPE.md (graph-traversable)
- Create integration guides that explain both platform features and dependencies
- Include use cases connecting IT platforms to R&D, Manufacturing, and
  Commercial operations

### Example Test Prompts

**Prompt 1: Vector Search - AI Platform Capabilities**

```sh
echo "How to use AI for molecular modeling" | npm run -s chat
```

Expected results should include:

- MolecularForge platform capabilities
- AI-driven drug discovery features
- Molecular modeling techniques

**Prompt 2: Graph Traversal - Platform Dependencies**

```sh
echo "What platforms depend on MolecularForge?" | npm run -s chat
```

Expected results should include:

- Platforms with dependencies on MolecularForge
- Integration relationships
- Dependency graph connections

**Prompt 3: Hybrid - Clinical Trial Platforms**

```sh
echo "Find documentation for platforms supporting clinical trial management" | npm run -s chat
```

Expected results should include:

- Platform descriptions with clinical trial features (vector search)
- Platform relationships and integrations (graph traversal)
- Complete platform ecosystem information

### Success Criteria

- Platform capabilities and features are discoverable through semantic search
- Platform dependencies are traversable through graph relationships
- Platform documentation is linked to using departments and projects
- Hybrid queries successfully combine technical search with relationship
  traversal

## Scenario 7: Error Handling and Edge Cases

**Objective**: Demonstrate graceful handling of invalid queries, non-existent
entities, and ambiguous references to ensure system reliability.

### Content Design Approach

Create test cases that challenge the system's robustness:

- Test queries for entities that don't exist in the dataset
- Test ambiguous queries that could match multiple relationship types
- Test queries with incomplete or malformed input
- Verify no hallucination or fabrication of non-existent information

### Example Test Prompts

**Test 1: Non-existent Entity Query**

```sh
echo "Find information about drug XYZ-999" | npm run -s chat
```

Expected results:

- System should indicate no matching drug found
- No fabrication of information about non-existent drug
- Possibly suggest similar existing drugs if vector search finds partial matches
- Clear indication that XYZ-999 is not in the knowledge base

**Test 2: Ambiguous Relationship Query**

```sh
echo "Find all connections to Apollo" | npm run -s chat
```

Expected results:

- Should handle multiple relationship types (CEO role, organizational
  relationships, project involvement)
- Return comprehensive results covering different connection types
- Clearly categorize different relationship types in response
- No omission of valid relationships due to ambiguity

**Test 3: Empty or Invalid Query**

```sh
echo "" | npm run -s chat
```

Expected results:

- Graceful error handling with helpful message
- No system crash or timeout
- Guidance on how to formulate valid queries
- No fabricated or placeholder responses

**Test 4: Relationship Type Confusion**

```sh
echo "What drugs does Chronos work on?" | npm run -s chat
```

Expected results:

- Correctly identify Chronos as person (not a drug)
- Find projects involving Chronos that relate to drugs
- Traverse: Person → Projects → Drugs (if applicable)
- Clear distinction between working on projects vs working on drugs directly

**Test 5: Non-existent Relationship Query**

```sh
echo "Find all people who report to Demeter" | npm run -s chat
```

Expected results:

- Correctly identify that Demeter is a Manager (not a Director)
- Return team members if Demeter has direct reports
- If no direct reports, clearly state this without fabrication
- No creation of non-existent reporting relationships

**Test 6: Circular Dependency Detection**

```sh
echo "What platforms depend on ManufacturingOS and what does ManufacturingOS depend on?" | npm run -s chat
```

Expected results:

- ManufacturingOS shows dependencies on ProcessControl + BioAnalyzer (correct
  direction)
- No platforms should show ManufacturingOS as a dependency (no circular refs)
- Clear dependency direction maintained (A requires B, not B requires A)
- No infinite loop in graph traversal
- System handles bidirectional queries without confusion

**Test 7: Self-Referential Query**

```sh
echo "What are the prerequisites for the Master Quality Management System Policy?" | npm run -s chat
```

Expected results:

- Correctly identify Master QMS as the top-level policy (no prerequisites)
- Should not return itself as a prerequisite
- May show what policies depend on it (reverse relationship)
- Clear indication it's the root of the policy hierarchy
- No circular or self-referential relationships returned

### Success Criteria

- Non-existent entities return clear "not found" responses without hallucination
- Ambiguous queries are handled by exploring all relevant relationship types
- Invalid or empty queries produce helpful error messages
- Relationship type confusion is resolved through proper entity typing
- System never fabricates information to fill gaps in knowledge
- Edge cases demonstrate robust error handling and user guidance

## Quantitative Success Metrics

When evaluating the effectiveness of the evaluation system, use these
quantitative benchmarks to ensure consistent quality across all scenarios:

### Vector Search Precision

- **Target**: ≥70% of top-10 results semantically relevant per query
- **Measurement Protocol**:
  1. Execute all Scenario 1 vector search prompts (Prompts 1-4)
  2. For each prompt, extract top 10 results from agent response
  3. Human evaluator scores each result: 1 (relevant) or 0 (not relevant)
  4. Calculate precision = (relevant results / 10) per query
  5. Overall precision = average across all Scenario 1 queries
- **Per-Query Threshold**: If any single query drops below 60%, investigate that
  query's embedding quality or result ranking
- **Pass Criteria**: Average precision across all Scenario 1 queries ≥70%
- **Documentation**: Record precision scores in evaluation report with format:
  ```
  Vector Search Precision Results:
  - Prompt 1: 8/10 (80%)
  - Prompt 2: 7/10 (70%)
  - Prompt 3: 9/10 (90%)
  - Prompt 4: 6/10 (60%)
  Overall: 30/40 (75%) - PASS
  ```

### Graph Traversal Accuracy

- **Target**: 100% of defined relationships in SHAPE.md must be traversable and
  return correct results
- **Measurement Protocol**:
  1. Execute all Scenario 2, 4 graph traversal prompts (Prompts 1-7 from
     Scenario 2, Prompts 1-4 from Scenario 4)
  2. For each prompt, verify:
     - All expected entities are returned
     - No incorrect entities are returned
     - Relationship directions are correct (e.g., reports-to vs. manages)
     - Multi-hop paths are complete
  3. Calculate accuracy = (correct queries / total queries) × 100%
- **Relationship Type Coverage**: Test all relationship types documented in
  SHAPE.md:
  - Organizational: `worksFor`, `member`, `reportsTo`, `manages`
  - Project: `participatesIn`, `leadBy`
  - Educational: `prerequisite`, `enables`
  - Technical: `dependsOn`, `requires`, `uses`
  - Clinical: `isPartOf`, `conductedAt`
  - Content: `citation`, `mentions`
- **Pass Criteria**: 100% accuracy (any missing or incorrect relationship is a
  structural defect)
- **Documentation**: Record failed queries with specific relationship gaps:
  ```
  Graph Traversal Accuracy Results:
  - Scenario 2 Prompt 1: PASS (all 4 direct reports found)
  - Scenario 2 Prompt 2: FAIL (missing Project Beta membership)
  - ...
  Overall: 10/11 (91%) - FAIL (requires 100%)
  Failed Relationships: Project Beta → Drug Discovery Team (member)
  ```

### Response Time

- **Target**: Queries complete within 5 seconds for standard complexity
- **Measurement Protocol**:
  1. Record start time before issuing prompt
  2. Record end time when complete response is returned
  3. Calculate elapsed time
  4. Categorize queries:
     - Simple: Single-hop graph queries, basic vector searches
     - Standard: Multi-hop graph queries (2-3 hops), semantic searches with
       multiple results
     - Complex: 4+ hop graph queries, hybrid vector+graph queries
- **Thresholds**:
  - Simple queries: <2 seconds (target), <5 seconds (acceptable)
  - Standard queries: <5 seconds (target), <10 seconds (acceptable)
  - Complex queries: <10 seconds (target), <20 seconds (acceptable)
- **Pass Criteria**: 90% of queries complete within target times
- **Documentation**: Record response times by category:
  ```
  Response Time Results:
  Simple (N=8):   Avg 1.2s, Max 3.1s - 100% within target
  Standard (N=12): Avg 4.3s, Max 8.7s - 92% within target
  Complex (N=5):  Avg 12.4s, Max 18.2s - 80% within target
  Overall: 23/25 (92%) within target - PASS
  ```

### Hybrid Query Balance

- **Target**: Results should include items from both vector (≥30%) and graph
  (≥30%) approaches
- **Measurement**: Count sources of results - semantic search vs relationship
  traversal
- **Threshold**: Imbalance below 20% from either approach suggests incomplete
  hybrid execution

### Content Coverage

- **Target**: Test queries should exercise all major entity types (people,
  projects, drugs, platforms, courses, policies)
- **Measurement**: Track which entities appear in test results
- **Threshold**: Any entity type with <50% coverage indicates insufficient test
  diversity

### Relationship Depth

- **Target**: Multi-hop queries should successfully traverse 3-5 relationship
  levels
- **Measurement**: Analyze query execution paths for hop count
- **Threshold**: Queries failing at <3 hops indicate graph traversal limitations

## Validation Guidelines

When evaluating demo content against these scenarios, use the following
comprehensive checklists:

### Evaluation Reporting Format

### Evaluation Reporting Format

For each scenario, provide:

#### 1. Result Header

Use the heading: `### Scenario N Result: PASS` or `### Scenario N Result: FAIL`

#### 2. Evidence Summary (1-3 sentences)

**For PASS**:

- List 2-3 concrete retrieved items validating success
- Reference specific entities by name (e.g., "Retrieved Oncora drug details",
  "Traversed Zeus→Minerva→Thoth reporting chain")
- Optionally note edge cases validated or notable strengths

**For FAIL**:

- List minimal blocking deficiencies first (missing entities, incorrect
  relationships, non-compliant naming)
- Reference expected vs. actual results
- Note secondary quality issues separately (style, depth, formatting)

#### 3. Failure Diagnostic (FAIL only)

When a scenario fails, immediately perform diagnostic analysis before proceeding
to subsequent scenarios (if the failure could cascade):

**Diagnostic Steps**:

1. Open and inspect `data/dev.log` for the time window covering the failed
   prompt execution
2. Extract:
   - The exact user prompt issued
   - Sequence of agent actions (retrieval steps, graph queries, vector searches,
     tool/plugin calls) as logged
   - Any warnings, empty result sets, or fallback paths
3. Determine root cause classification (choose one):
   - **Content Gap**: Missing or incomplete source data
   - **Relationship Gap**: Expected edge/predicate absent
   - **Indexing/Processing Gap**: Item exists but not embedded / not in graph
   - **Query Parsing / Intent Gap**: Prompt misunderstood or misrouted
   - **Ranking / Fusion Gap**: Relevant items retrieved but deprioritized
   - **Hallucination**: Answer includes unsupported claims
4. Capture 1-3 representative log lines illustrating the failure mechanism
5. Recommend focused remediation action (e.g., "Add missing policy nodes and
   re-run process:graphs", "Include coursePrerequisites linkage for DATA-301",
   "Regenerate embeddings for products-drugs.html")
6. Re-run the same prompt after remediation (if applied within session) to
   confirm resolution; update scenario status if it transitions to PASS

**Diagnostic Template**:

```
Failure Diagnostic:
Prompt: <exact text>
Root Cause: <classification from list above>
Key Log Lines:
  - <timestamp> <log excerpt>
  - <timestamp> <log excerpt>
Remediation: <planned or executed action>
Retest Status: <pending|pass|fail>
```

**Note**: If multiple scenarios fail for the same underlying structural issue,
create the detailed Failure Diagnostic for the first occurrence and
cross-reference it from subsequent failures instead of duplicating log excerpts.

### Structural Compliance (validate against SHAPE.md)

- [ ] All entity names match exactly (use exact names from SHAPE.md)
- [ ] Entity counts are correct (140 people, 12 projects, 7 drugs, 12 platforms,
      12 courses, 13 policies - verify all against SHAPE.md)
- [ ] All hierarchies and relationships match SHAPE.md specifications
- [ ] Project memberships, course prerequisites, and policy hierarchies are
      correct
- [ ] File distribution follows SHAPE.md requirements (20 files: 2 org + 3
      product + 6 knowledge + 1 cert + 1 policy + 3 clinical + 4 tech)

### Scenario Support (validate test prompts)

- [ ] All test prompts from EVAL.md scenarios return expected results
- [ ] Vector search scenarios demonstrate semantic similarity effectively
- [ ] Graph traversal scenarios show proper relationship navigation
- [ ] Hybrid scenarios successfully combine both approaches

### Vector Search Quality

- [ ] Semantically similar content uses different vocabulary
- [ ] Scientific and pharmaceutical concepts explained at multiple abstraction
      levels
- [ ] Related topics distributed across documents
- [ ] Content includes both specific clinical details and general therapeutic
      concepts
- [ ] Semantic diversity techniques applied (synonyms, varied pharmaceutical
      terminology)
- [ ] Multiple abstraction levels present (patient-facing to research-level)

### Graph Traversal Quality

- [ ] All relationships explicitly defined through microdata properties
- [ ] Hierarchical structures match SHAPE.md depth requirements (organizational,
      drug pipeline, policy)
- [ ] Path queries can traverse all specified relationship chains
- [ ] High-connectivity nodes (from SHAPE.md) are properly connected (CSO, CTO,
      key platforms)
- [ ] Bidirectional relationships implemented where specified
- [ ] Multi-hop relationship chains work correctly (3-5 hops) across departments
      and products

### Technical Correctness

- [ ] No duplicate `itemid`/`@id` IRIs across all files (each entity has unique
      identifier)
- [ ] All referenced entities exist in the dataset (no broken references)
- [ ] Bidirectional relationships are consistent (if A→B exists, verify B→A
      exists where expected)
- [ ] No orphaned entities (every item has ≥1 relationship except HQ/CEO root
      nodes)
- [ ] All IRIs follow canonical pattern
      (https://bionova.example/id/{type}/{slug})
- [ ] Cross-file references use identical IRIs (e.g., same person referenced in
      org and project files)
- [ ] No circular dependencies in prerequisite/dependency chains (courses,
      policies, platforms)
- [ ] Self-referential relationships are intentional and valid (e.g., platform
      integrates with itself)
- [ ] Relationship directions are correct and unambiguous (reportsTo vs.
      manages, requires vs. enables)

### Hybrid Content Quality

- [ ] Some prompts benefit from vector search alone (scientific knowledge
      discovery)
- [ ] Some prompts require graph traversal alone (organizational reporting, drug
      pipeline)
- [ ] Some prompts need both approaches for complete results (platform
      capabilities + dependencies)
- [ ] Clear use cases demonstrate each approach's value in pharmaceutical
      context
- [ ] Rich clinical/scientific descriptions combined with structural
      relationships
- [ ] Dependencies and hierarchies properly linked (drugs, platforms, policies,
      certifications)

### Content Diversity and Distribution

- [ ] 100-120 vector-optimized items with rich pharmaceutical/scientific text
      descriptions
- [ ] 100-120 graph-optimized items with structural relationships
- [ ] 50-60 hybrid items valuable for both approaches
- [ ] Total 500-600 microdata items across all files
- [ ] Items per file: 25-30 related microdata items

## Usage Notes

These scenarios should be used to:

1. **Guide content creation**: Ensure generated content supports all test
   prompts
2. **Validate implementations**: Verify that both vector search and graph
   prompts work correctly
3. **Demonstrate capabilities**: Show when to use each approach through concrete
   pharmaceutical examples
4. **Test quality**: Ensure content meets semantic diversity and relationship
   clarity requirements

All structural details (entity names, counts, relationships) are defined in
SHAPE.md. All narrative context is provided in STORY.md. This file focuses
purely on evaluation criteria and expected search behaviors in the BioNova
pharmaceutical domain.
