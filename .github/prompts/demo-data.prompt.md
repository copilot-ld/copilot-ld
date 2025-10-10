# Demo Content Generation Prompt

## Objective

Generate a comprehensive set of HTML files containing structured microdata
elements using Schema.org vocabulary. The content should demonstrate scenarios
where vector similarity search and graph-based queries excel at different tasks,
showcasing the complementary nature of both approaches.

The files must be placed under: `./examples/<title>/`

## Technical Requirements

### HTML Structure

- Create 15-20 HTML files with embedded microdata elements
- All microdata must use standard Schema.org types and properties with 100%
  accuracy
- Use proper HTML5 semantic markup with microdata attributes (`itemscope`,
  `itemtype`, `itemprop`)
- Each file should contain 10-15 related microdata items for optimal processing

### Microdata Distribution

Generate approximately 200-250 microdata items with deliberate design for
testing both search approaches:

#### Vector Search Optimized Content (80-100 items)

Content with rich textual descriptions for semantic similarity:

- `TechArticle` (20-25): Technical documentation with detailed explanations
- `BlogPosting` (15-20): Blog posts about industry trends and best practices
- `FAQPage` (10-15): Frequently asked questions with comprehensive answers
- `Review` (10-15): Product reviews with detailed analysis
- `Comment` (25-30): User comments and discussions on articles

#### Graph Search Optimized Content (80-100 items)

Content with complex structural relationships:

- `Person` (25-30): Employees with organizational roles and team relationships
- `Organization` (8-10): Hierarchical company structure with subsidiaries
- `Event` (15-20): Conferences, meetings, and training sessions with attendees
- `Project` (10-15): Multi-team projects with dependencies and deliverables
- `Role` (20-25): Job positions with reporting structures and responsibilities

#### Hybrid Content (40-50 items)

Content valuable for both approaches:

- `Product` (10-12): Products with descriptions AND relationships to
  teams/people
- `Service` (8-10): Services with detailed features AND organizational providers
- `Course` (8-10): Training with content descriptions AND prerequisite chains
- `HowTo` (8-10): Guides with step descriptions AND tool/product dependencies
- `Policy` (6-8): Policies with full text AND enforcement relationships

## Content Scenarios

### Scenario 1: Technical Knowledge Base

**Vector Search Strength**: Finding conceptually similar content

#### Content Design

- Create articles about "containerization", "orchestration", and "microservices"
- Write them with different terminology but similar concepts
- Include troubleshooting guides that describe similar problems differently
- Add FAQ entries that answer related questions using varied language

**Test Cases**:

- Query: "How to scale applications" should find articles about Kubernetes,
  Docker Swarm, and auto-scaling
- Query: "Database performance issues" should find articles about indexing,
  query optimization, and caching

### Scenario 2: Organizational Intelligence

**Graph Search Strength**: Traversing explicit relationships

#### Content Design

Create **TechNova Solutions** with complex structure:

**Organizational Hierarchy**:

```
TechNova Solutions (HQ)
├── TechNova Cloud Division
│   ├── Infrastructure Team (8 people)
│   └── Platform Team (6 people)
├── TechNova AI Labs
│   ├── Research Team (5 people)
│   └── Applied ML Team (7 people)
└── TechNova Enterprise Services
    ├── Consulting Team (10 people)
    └── Support Team (8 people)
```

**Cross-Functional Relationships**:

- **Project Alpha**: Involves 3 people from Cloud, 2 from AI Labs
- **Project Beta**: Involves 2 from Enterprise, 1 from Cloud
- **Training Initiative**: Led by AI Labs, attended by all divisions

**Test Cases**:

- Graph: "Find all people who report to the CTO" (requires traversing reporting
  chain)
- Graph: "Find all projects involving the AI Labs division" (requires
  relationship traversal)
- Graph: "Find all people who attended Event X AND work in Division Y" (complex
  intersection)

### Scenario 3: Product Ecosystem

**Both Approaches Needed**: Semantic search for features, graph for dependencies

#### Product Network

Create interconnected products with dependencies:

**Products**:

- **DataFlow Engine**: Core data processing platform
- **StreamAnalyzer**: Real-time analytics (requires DataFlow Engine)
- **PredictiveInsights**: ML predictions (requires StreamAnalyzer + MLToolkit)
- **MLToolkit**: Machine learning library
- **CloudSync**: Data synchronization (integrates with all products)

**Documentation**:

- Architecture guides for each product
- Integration tutorials between products
- Performance optimization articles
- Migration guides from competitors

**Test Cases**:

- Vector: "How to process streaming data" finds relevant articles across
  products
- Graph: "What products depend on DataFlow Engine?" requires dependency
  traversal
- Hybrid: "Find all documentation for products that integrate with CloudSync"

### Scenario 4: Learning and Certification

**Demonstrating Path Dependencies**

#### Course Structure

Create certification paths with prerequisites:

**Certification Tracks**:

1. **Cloud Architect Path**:
   - Foundation: Cloud Basics (no prerequisites)
   - Intermediate: Container Orchestration (requires Cloud Basics)
   - Advanced: Multi-Cloud Architecture (requires Container Orchestration)
   - Certification Exam (requires all three courses)

2. **Data Engineer Path**:
   - Foundation: Data Fundamentals
   - Intermediate: ETL Pipelines (requires Data Fundamentals)
   - Advanced: Real-time Processing (requires ETL Pipelines)
   - Certification Exam (requires all three courses)

**Test Cases**:

- Graph: "What courses must I complete before taking Multi-Cloud Architecture?"
- Graph: "Find all people certified in Cloud Architecture"
- Vector: "Find content about data pipeline optimization"

### Scenario 5: Policy and Compliance

**Complex Rule Dependencies**

#### Policy Framework

Create interrelated policies:

**Policy Hierarchy**:

- **Master Security Policy**
  - Data Protection Policy
    - Customer Data Handling Procedures
    - Employee Data Guidelines
  - Access Control Policy
    - Authentication Standards
    - Authorization Matrix
  - Incident Response Policy
    - Security Breach Protocol
    - Recovery Procedures

**Cross-References**:

- GDPR Compliance references Data Protection and Access Control
- SOC2 Compliance references all security policies
- Development Standards reference Security and Data Protection

**Test Cases**:

- Graph: "Find all policies that must be followed for GDPR compliance"
- Graph: "What policies does the Data Protection Policy depend on?"
- Vector: "Find content about data encryption requirements"

## Implementation Guidelines

### Semantic Diversity for Vector Testing

- Use synonyms and varied terminology for similar concepts
- Write descriptions at different technical levels (beginner to expert)
- Include regional variations in terminology (e.g., "lift" vs "elevator")
- Create content with overlapping but distinct focus areas

### Structural Complexity for Graph Testing

- Create multi-hop relationships (A→B→C→D)
- Implement bidirectional relationships (manager/reports, prerequisite/enables)
- Design circular dependencies where appropriate (cross-team collaborations)
- Build hierarchical structures at least 4 levels deep
- Create many-to-many relationships (people to projects, products to features)

### Unique Naming Convention

Use distinctive prefixes to ensure originality:

- People: First names from mythology (Ajax, Athena, Orion, Luna)
- Products: Astronomical terms (Nebula, Pulsar, Quasar, Cosmos)
- Projects: Greek letters (Alpha, Beta, Gamma, Delta)
- Divisions: Descriptive compounds (CloudForge, DataStream, AICore)

### Content Distribution Strategy

- **High-connectivity nodes**: 3-4 people/products that connect to many others
- **Isolated clusters**: 2-3 groups of tightly connected items with weak
  external links
- **Bridge items**: 5-6 items that connect otherwise separate clusters
- **Depth variation**: Some paths 2 hops deep, others requiring 5+ hops

## Quality Validation

### Vector Search Validation

- [ ] Semantically similar content uses different vocabulary
- [ ] Technical concepts are explained at multiple abstraction levels
- [ ] Related topics are distributed across different documents
- [ ] Content includes both specific details and general concepts

### Graph Search Validation

- [ ] All relationships are explicitly defined through microdata properties
- [ ] Hierarchical structures span multiple documents
- [ ] Circular and bidirectional relationships are properly implemented
- [ ] Path queries require 3+ hops for meaningful results
- [ ] Intersection queries involve multiple relationship types

### Combined Validation

- [ ] Some queries benefit from vector search alone
- [ ] Some queries require graph traversal alone
- [ ] Some queries need both approaches for complete results
- [ ] Content demonstrates clear use cases for each approach

Generate content that clearly demonstrates when to use vector similarity search
(for conceptual discovery) versus graph queries (for relationship traversal),
making the complementary value of both approaches evident through practical
examples.
