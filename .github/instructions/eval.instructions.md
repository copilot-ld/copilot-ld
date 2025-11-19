---
applyTo: "**/config/eval.*"
---

# Evaluation Test Instructions

## Purpose Declaration

This file provides guidance for writing and debugging evaluation tests in
`config/eval.yml` to ensure the agent system retrieves correct information and
behaves as expected.

## Core Principles

1. **Test What Exists**: All test cases must be grounded in actual data from
   `examples/knowledge/` - never test for fabricated information
2. **Three Test Types**: Use criteria tests for response quality, retrieval
   tests for context gathering, and trace tests for tool execution
3. **Debuggable Design**: Every test captures conversation ID, memory state,
   resources, and traces for easy debugging
4. **Realistic Expectations**: Test what the system actually retrieves, not
   idealized behavior

## Test Types

### Criteria Tests (Most Common)

Criteria tests evaluate whether the agent's response meets specific quality
requirements.

**When to Use**:

- Testing response content and accuracy
- Verifying the agent mentions specific facts or entities
- Checking explanation quality
- Most general-purpose testing

**Format**:

```yaml
test_name:
  prompt: "What is the MolecularForge platform used for?"
  criteria:
    "Response must mention drug discovery, molecular modeling, or integration
    with platforms like BioAnalyzer"
```

**Best Practices**:

- Keep criteria specific but not overly strict
- Use "must mention X or Y" for flexibility
- Focus on key facts, not exact wording
- Test one concept per case

### Recall Tests (Context Validation)

Recall tests verify the agent retrieves all expected resources from the
knowledge base. Tests pass only when all specified subjects are found.

**When to Use**:

- Testing whether specific resources are retrieved
- Validating search and retrieval quality
- Checking if the right context is being used

**Format**:

```yaml
test_name:
  prompt: "Tell me about the Oncora drug"
  true_subjects:
    - "https://bionova.example/id/drug/oncora"
    - "https://bionova.example/id/drug/oncora-xr"
```

**Configuration Options**:

- `true_subjects`: List of URIs that must all be retrieved (required)

**Evaluation**:

- Test **passes** if all subjects in `true_subjects` are found in memory
- Test **fails** if any subject is missing
- Reports which subjects were found and which were missing

**Best Practices**:

- Only include subjects that are essential for answering the query
- If multiple subjects are specified, all must be retrieved to pass
- Include related resources when they're all needed (e.g., Oncora + Oncora-XR)
- Use full URIs from actual knowledge base resources

**How to Find Subjects**:

```bash
# Find all subjects in the graph
echo "*" | npm -s run cli:subjects

# Find all subjects of a specific type
echo "https://schema.org/Drug" | npm -s run cli:subjects

# Search for resources related to your query
echo "your query here" | npm -s run cli:search

# Get subjects from search results
echo "your query here" | npm -s run cli:search | grep '@id'

# Query graph to find related entities
echo "drug:oncora ? ?" | npm -s run cli:query
```

### Trace Tests (Tool Execution)

Trace tests verify specific tools are executed during request processing using
JMESPath expressions evaluated against trace spans.

**When to Use**:

- Testing tool execution paths
- Verifying search tools are called
- Validating graph queries are executed

**Format**:

```yaml
test_name:
  prompt: "Tell me about drug formulation"
  trace_checks:
    - '[?name==`tool.CallTool` &&
      events[0].attributes."function.name"==`query_by_descriptor`]'
    - '[?name==`tool.CallTool` &&
      events[0].attributes."function.name"==`query_by_content`]'
```

**JMESPath Syntax**:

- `[?condition]` - Filter array elements matching condition
- `&&` - Logical AND operator
- `==` - Equality comparison
- Backticks (`` ` ``) - JMESPath literals for values
- `\"attribute.name\"` - Quote keys with dots or special characters
- Each expression returns matching spans; test passes if any spans are returned

**Note**: Trace tests require the trace service to capture spans. They validate
the execution path, not the response content.

## Writing Good Tests

### Ground Tests in Reality

**✅ CORRECT** - Test what exists:

```yaml
vector_oncora_mechanism:
  prompt: "How does Oncora work as a cancer treatment?"
  criteria:
    "Response must explain kinase inhibition mechanism, tumor proliferation
    effects, and oral formulation benefits"
```

**❌ INCORRECT** - Test fabricated data:

```yaml
vector_drug_xyz:
  prompt: "How does DrugXYZ work?"
  criteria: "Response must explain mechanism" # DrugXYZ doesn't exist!
```

### Validate Before Writing Tests

Before creating a test, verify the data exists using CLI tools:

```bash
# 1. Test the query with the agent
echo "What is Project Alpha?" | npm run cli:chat

# 2. Search for relevant resources
echo "Project Alpha" | npm run cli:search

# 3. Check what subjects exist in the graph
echo "https://schema.org/Project" | npm run cli:subjects

# 4. Query specific entity relationships
echo "project:alpha ? ?" | npm run cli:query

# 5. Verify expected content in knowledge files
grep -r "Project Alpha" examples/knowledge/
```

### Design for Debugging

Every test automatically captures debugging information:

- Conversation ID
- Memory file path
- Resource directory path
- Trace query command

Use this information when tests fail to understand what went wrong.

### Use CLI Tools for Test Development

The platform's CLI tools are essential for developing and debugging evaluation
tests. Use them to:

**Discover Available Data** (`cli:subjects`):

```bash
# Find all entities of a specific type
echo "https://schema.org/Drug" | npm run cli:subjects
echo "https://schema.org/Person" | npm run cli:subjects

# List all subjects to browse what's available
echo "*" | npm run cli:subjects | less
```

**Explore Relationships** (`cli:query`):

```bash
# Find all facts about an entity
echo "drug:oncora ? ?" | npm run cli:query

# Discover related entities
echo "? schema:memberOf org:bionova" | npm run cli:query

# Find entities by type
echo "? rdf:type schema:Drug" | npm run cli:query
```

**Test Search Relevance** (`cli:search`):

```bash
# See what vector search returns
echo "cancer treatment mechanisms" | npm run cli:search

# Adjust threshold to test relevance
printf "/threshold 0.7\ncancer treatment\n" | npm run cli:search

# Compare content vs descriptor search
printf "/representation descriptor\ndrug formulation\n" | npm run cli:search
```

**Validate Agent Behavior** (`cli:chat`):

```bash
# Test the exact query from your eval test
echo "How does Oncora work?" | npm run cli:chat

# Test variations to understand behavior
printf "What is Oncora?\nHow does it work?\n" | npm run cli:chat
```

**Workflow for Creating New Tests**:

1. Use `cli:subjects` to verify the entity exists
2. Use `cli:query` to understand its relationships
3. Use `cli:search` to test if search finds it
4. Use `cli:chat` to see actual agent responses
5. Write eval test based on observed behavior

## Debugging Failed Tests

### Step 1: Review Test Output

When tests fail, the eval report shows:

```
❌ FAIL - test_name (criteria)
  Conversation ID: common.Conversation.abc123...
  Memory: data/memories/common.Conversation.abc123.jsonl
  Resources: data/resources/common.Conversation.abc123/
  Traces: Use cli:visualize to inspect traces
```

### Step 2: Check What Was Retrieved

Examine the memory file to see what context the agent used:

```bash
# See all subjects retrieved for this conversation
cat data/memories/common.Conversation.abc123.jsonl | jq -c '.identifier.subject' | grep -v '""'

# See subjects with their types
cat data/memories/common.Conversation.abc123.jsonl | jq -c '.identifier | {type, subject}'
```

**Common Issues**:

- `subject: ""` (empty) → Agent didn't retrieve any context
- Wrong subjects → Query retrieved unrelated resources
- No memory entries → Agent failed to respond

### Step 3: Check Traces for Tool Execution

Use the cli:visualize tool to examine trace spans:

```bash
# Visualize all traces for this conversation
echo "[]" | npm -s run cli:visualize -- --resource common.Conversation.abc123

# Filter for specific tool calls
echo "[?name==`tool.CallTool`]" | npm -s run cli:visualize -- --resource common.Conversation.abc123

# Check for specific tool execution
echo "[?name==`tool.CallTool` && events[0].attributes.\"function.name\"==`query_by_content`]" | npm -s run cli:visualize -- --resource common.Conversation.abc123
```

**Common Issues**:

- No tool traces → Agent didn't execute any tools
- Missing expected tools → Agent chose different approach
- Error status codes → Tools failed during execution

### Step 4: Examine Resource Content

Check what's in the retrieved resources:

```bash
# List all resources for this conversation
ls data/resources/common.Conversation.abc123/

# View a specific resource
cat data/resources/common.Conversation.abc123/common.Message.xyz789.jsonl | jq '.'
```

### Step 5: Compare with Manual Test

Test the same query manually using CLI tools to see expected behavior:

```bash
# Run the same query through the agent
echo "your query here" | npm run cli:chat

# Search to see what resources match
echo "your query here" | npm run cli:search

# Check what subjects are available
echo "*" | npm run cli:subjects | grep "relevant-term"

# Query the graph for entity relationships
echo "entity:name ? ?" | npm run cli:query

# Check the memory from the latest conversation
ls -t data/memories/*.jsonl | head -1 | xargs cat | jq -c '.identifier.subject'
```

If CLI tools show the expected data exists but eval fails, the issue is likely:

- Test expectations don't match actual behavior
- Agent behavior is non-deterministic
- Test query wording differs from what works
- Search relevance doesn't match your expectations

### Common Failure Patterns

**Agent doesn't retrieve context**:

- Use `cli:search` to verify resources exist for the query
- Check with `cli:subjects` that expected entities are in the graph
- Verify similar queries work in `cli:chat` manual testing
- Consider if agent thinks it can answer without tools

**Wrong resources retrieved**:

- Use `cli:search` to see what the vector search actually returns
- Query may be ambiguous or vector search finds unexpected matches
- Use `cli:query` to understand entity relationships in the graph
- Update test to expect actual retrieved subjects

**Retrieval test fails but response is good**:

- Check `retrievedCount` in test output
- Use `cli:search` to see what the system actually retrieves
- Agent may retrieve different but still relevant resources
- Consider converting to criteria test instead

## Best Practices

### Test Coverage

Create tests for:

- ✅ Common queries users will ask
- ✅ Edge cases (empty results, disambiguation)
- ✅ Complex queries requiring multiple resources
- ✅ Different query phrasings for same information

Avoid:

- ❌ Testing the same thing multiple ways
- ❌ Tests that require fabricated data
- ❌ Overly specific expectations that break easily
- ❌ Tests without clear success criteria

### Maintaining Tests

When knowledge base changes:

1. Use `cli:subjects` and `cli:search` to discover new entities
2. Update affected tests to match new data using `cli:query` to verify
   relationships
3. Add tests for new entities/relationships found via CLI exploration
4. Remove tests for deleted information
5. Verify existing tests still pass with `npm run eval`

When agent behavior changes:

1. Run full eval suite: `npm run eval`
2. Investigate failures using debug info and CLI tools
3. Use `cli:chat` to manually validate expected vs actual behavior
4. Update test expectations if behavior improved
5. File issues if behavior regressed

### Running Tests

```bash
# Run all tests
npm run eval

# Run specific test
npm run eval -- --case test_name

# Run with different concurrency
npm run eval -- --concurrency 3
```

## Examples

### Complete Criteria Test

```yaml
criteria_oncora_platforms:
  prompt: "What technology platforms does Oncora use?"
  criteria:
    "Response must identify MolecularForge, ClinicalStream, and DataLake as
    platforms used by or related to Oncora"
```

### Complete Retrieval Test

```yaml
recall_oncora_info:
  prompt: "Tell me about the Oncora drug"
  true_subjects:
    - "https://bionova.example/id/drug/oncora"
    - "https://bionova.example/id/drug/oncora-xr"
```

### Edge Case Test

```yaml
edge_empty_results:
  prompt: "Find information about drug ABC-999-XYZ"
  criteria:
    "Response must clearly state the drug is not found without fabricating
    information or returning unrelated drugs"
```

## Explicit Prohibitions

### Forbidden Test Patterns

1. **DO NOT** create tests for information not in `examples/knowledge/`
2. **DO NOT** write vague criteria that could pass with any response
3. **DO NOT** ignore failed tests - debug and fix them
4. **DO NOT** include subjects in `true_subjects` that aren't essential for
   answering the query
5. **DO NOT** copy test expectations without validating against actual data

### Alternative Approaches

- Instead of testing fabricated data → Verify data exists in knowledge base
  first
- Instead of vague criteria → Specify exact facts or entities to check
- Instead of ignoring failures → Use debug info to understand and fix
- Instead of guessing expectations → Run queries manually to see actual behavior
- Instead of copying tests → Validate each test independently

## Success Metrics

Good evaluation tests:

- ✅ Pass consistently when system works correctly
- ✅ Fail clearly when system has issues
- ✅ Are easy to debug when they fail
- ✅ Test real user queries and scenarios
- ✅ Have expectations grounded in actual data
