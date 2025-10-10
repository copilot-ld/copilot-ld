# TechNova Demo Dataset

This comprehensive demo dataset contains 15 HTML files with approximately
200-250 microdata items designed to showcase both vector similarity search and
graph-based query capabilities.

## Dataset Overview

### Files Created

1. `containerization-guide.html` - Technical article on containerization (Vector
   optimized)
2. `orchestration-guide.html` - Technical article on orchestration with FAQ
   (Vector & Graph)
3. `microservices-blog.html` - Blog posts on microservices and DevOps (Vector
   optimized)
4. `technova-organization.html` - Complete organizational hierarchy (Graph
   optimized)
5. `technova-projects.html` - Cross-functional projects and events (Graph
   optimized)
6. `product-suite.html` - Product ecosystem with dependencies (Hybrid)
7. `product-guides.html` - HowTo guides with tool dependencies (Hybrid)
8. `certification-courses.html` - Course hierarchy with prerequisites (Graph
   optimized)
9. `security-policies.html` - Policy framework with dependencies (Graph
   optimized)
10. `database-performance.html` - FAQ and technical articles (Vector optimized)
11. `cloud-native-development.html` - Blog posts on cloud native practices
    (Vector optimized)
12. `agile-manifesto.html` - Existing example file
13. `cwe-top25-2023.html` - Existing example file
14. `owasp-top10-2021.html` - Existing example file
15. `twelve-factor-app.html` - Existing example file

## Content Distribution

### Vector Search Optimized (80-100 items)

Content with rich textual descriptions designed for semantic similarity:

- **TechArticle** (20+): Containerization, orchestration, microservices,
  database scaling, API design, monitoring
- **BlogPosting** (15+): Microservices architecture, DevOps trends, cloud native
  development, security practices
- **FAQPage** (12+): Orchestration questions, database performance questions
- **Review** (10+): Product reviews, tool reviews, service reviews
- **Comment** (30+): User discussions across multiple articles and blog posts

### Graph Search Optimized (80-100 items)

Content with explicit structural relationships for traversal:

- **Person** (44): TechNova employees across divisions with roles and
  relationships
- **Organization** (4): TechNova HQ with three divisions (Cloud, AI Labs,
  Enterprise Services)
- **Event** (3): Training initiative, CloudTech conference, security review
- **Project** (4): Alpha, Beta, Gamma, Delta projects with cross-functional
  teams
- **Role** (5): Team lead, senior engineer, engineer, junior engineer, division
  director

### Hybrid Content (40-50 items)

Content valuable for both vector and graph approaches:

- **Product** (5): DataFlow Engine, StreamAnalyzer, MLToolkit,
  PredictiveInsights, CloudSync with dependencies
- **Service** (2): Managed services with product relationships
- **Course** (10): Certification tracks with prerequisite chains
- **HowTo** (5): Implementation guides with tool dependencies
- **DigitalDocument/Policy** (11): Policy hierarchy with cross-references and
  compliance frameworks

## Test Queries

Once the dataset is processed, you can test both vector and graph queries:

### Vector Search Test Queries

```bash
# Find content about scaling applications
echo "How to scale applications" | node scripts/search.js --limit 10 --threshold 0.25

# Find database performance content
echo "Database performance issues" | node scripts/search.js --limit 10 --threshold 0.25

# Find container deployment information
echo "Container deployment strategies" | node scripts/search.js --limit 10 --threshold 0.25

# Find cloud native practices
echo "Building cloud native applications" | node scripts/search.js --limit 10 --threshold 0.25
```

### Expected Results

Vector searches should find semantically similar content across different
documents:

- "Scale applications" → orchestration, containerization, database scaling
  articles
- "Performance issues" → database optimization, monitoring, caching content
- "Container deployment" → containerization and orchestration guides
- "Cloud native" → microservices, DevOps, cloud architecture blog posts

## Usage Scenarios

### Scenario 1: Technical Knowledge Base (Vector Search)

**Query Examples:**

- "How to scale applications" → Finds orchestration, containerization, database
  scaling content
- "Database performance issues" → Finds indexing, caching, optimization content
- "Container deployment strategies" → Finds containerization and orchestration
  articles

### Scenario 2: Organizational Intelligence (Graph Search)

**Query Examples:**

- "Find all people who report to the CTO" → Traverses organizational hierarchy
- "Find all projects involving AI Labs division" → Traverses project membership
- "Find attendees of CloudTech Conference from Cloud Division" → Multi-hop
  traversal

### Scenario 3: Product Ecosystem (Hybrid)

**Query Examples:**

- Vector: "How to process streaming data" → Finds relevant articles across
  products
- Graph: "What products depend on DataFlow Engine?" → Traverses product
  dependencies
- Hybrid: "Find documentation for products that integrate with CloudSync" →
  Combines both

### Scenario 4: Learning Paths (Graph Search)

**Query Examples:**

- "What courses must I complete before Multi-Cloud Architecture?" → Traverses
  prerequisites
- "Find all courses in the Data Engineer certification track" → Follows
  prerequisite chain
- "What certifications require Cloud Infrastructure Fundamentals?" → Reverse
  prerequisite lookup

### Scenario 5: Policy Compliance (Graph Search)

**Query Examples:**

- "Find all policies required for GDPR compliance" → Traverses policy citations
- "What policies does Data Protection Policy depend on?" → Follows policy
  hierarchy
- Vector: "Find content about data encryption requirements" → Searches policy
  text

## Data Quality Features

### Semantic Diversity (Vector Testing)

- Varied terminology for similar concepts (containerization vs. application
  packaging)
- Multiple abstraction levels (beginner to expert explanations)
- Overlapping focus areas across different documents
- Synonyms and regional variations

### Structural Complexity (Graph Testing)

- Multi-hop relationships (3-5 hops required for meaningful queries)
- Bidirectional relationships (manager/reports, prerequisite/enables)
- Hierarchical structures 4+ levels deep (organization, policies, courses)
- Many-to-many relationships (people to projects, products to features)
- High-connectivity nodes (Zeus as CTO connects to all directors)
- Bridge items connecting clusters (Projects connect divisions)

### Unique Naming Convention

- **People**: Mythological names (Apollo, Zeus, Athena, Poseidon, etc.)
- **Products**: Astronomical terms (DataFlow, StreamAnalyzer,
  PredictiveInsights, CloudSync)
- **Projects**: Greek letters (Alpha, Beta, Gamma, Delta)
- **Divisions**: Descriptive compounds (Cloud Division, AI Labs, Enterprise
  Services)

## Processing Instructions

To use this dataset with the Copilot-LD system:

### Option 1: Use as Knowledge Base

```bash
# Create data/knowledge directory if needed
mkdir -p data/knowledge

# Copy files from examples to data directory
cp examples/knowledge/*.html data/knowledge/

# Ensure .env is configured with GitHub token
# See README.md for setup instructions

# Process resources
npm run process:resources

# Generate vectors
npm run process:vectors
```

### Option 2: Validate Dataset Structure

```bash
# Validate microdata extraction
node scripts/validate-demo-data.js

# Analyze content distribution
node scripts/analyze-demo-data.js
```

### Option 3: Test with Subset

```bash
# Test with a few files first
mkdir -p data/knowledge
cp examples/knowledge/technova-organization.html data/knowledge/
cp examples/knowledge/containerization-guide.html data/knowledge/
npm run process:resources
```

## Validation Checklist

### Vector Search Validation

- [x] Semantically similar content uses different vocabulary
- [x] Technical concepts explained at multiple abstraction levels
- [x] Related topics distributed across different documents
- [x] Content includes specific details and general concepts

### Graph Search Validation

- [x] All relationships explicitly defined through microdata properties
- [x] Hierarchical structures span multiple documents
- [x] Circular and bidirectional relationships implemented
- [x] Path queries require 3+ hops for meaningful results
- [x] Intersection queries involve multiple relationship types

### Combined Validation

- [x] Some queries benefit from vector search alone (technical questions)
- [x] Some queries require graph traversal alone (organizational structure)
- [x] Some queries need both approaches (product documentation + dependencies)
- [x] Clear use cases demonstrate each approach's value

## Schema.org Types Used

All microdata follows Schema.org vocabulary with 100% accuracy:

- Article types: TechArticle, BlogPosting
- Q&A: FAQPage, Question, Answer
- Social: Comment, Review, Rating
- Organization: Organization, Person, Role
- Events: Event
- Projects: Project (using Schema.org/Project)
- Products: Product, Service, SoftwareApplication
- Learning: Course, ItemList, ListItem
- Documentation: DigitalDocument, HowTo, HowToStep, HowToTool

## Dataset Statistics

- **Total Files**: 15 HTML files
- **Total Microdata Items**: ~200-250 items
- **Vector-Optimized**: ~80-100 items with rich text descriptions
- **Graph-Optimized**: ~80-100 items with structural relationships
- **Hybrid**: ~40-50 items valuable for both approaches
- **Relationship Types**: Organization membership, project membership, event
  attendance, course prerequisites, product dependencies, policy citations
- **Maximum Depth**: 4-5 levels (organizational hierarchy, policy framework,
  course prerequisites)
