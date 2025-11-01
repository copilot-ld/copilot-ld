---
applyTo: "**/config/eval.*"
---

# Evaluation Test Instructions

## Purpose Declaration

This file provides guidance for writing and debugging evaluation tests in `config/eval.yml` to ensure the agent system retrieves correct information and behaves as expected.

## Core Principles

1. **Test What Exists**: All test cases must be grounded in actual data from `examples/knowledge/` - never test for fabricated information
2. **Three Test Types**: Use criteria tests for response quality, retrieval tests for context gathering, and trace tests for tool execution
3. **Debuggable Design**: Every test captures conversation ID, memory state, resources, and traces for easy debugging
4. **Realistic Expectations**: Test what the system actually retrieves, not idealized behavior

## Test Types

### Criteria Tests (Most Common)

Criteria tests evaluate whether the agent's response meets specific quality requirements.

**When to Use**:
- Testing response content and accuracy
- Verifying the agent mentions specific facts or entities
- Checking explanation quality
- Most general-purpose testing

**Format**:
```yaml
test_name:
  query: "What is the MolecularForge platform used for?"
  criteria: "Response must mention drug discovery, molecular modeling, or integration with platforms like BioAnalyzer"
```

**Best Practices**:
- Keep criteria specific but not overly strict
- Use "must mention X or Y" for flexibility
- Focus on key facts, not exact wording
- Test one concept per case

### Retrieval Tests (Context Validation)

Retrieval tests verify the agent retrieves correct resources from the knowledge base using standard information retrieval metrics.

**When to Use**:
- Testing whether specific resources are retrieved
- Validating search and retrieval quality
- Checking if the right context is being used

**Simple Format**:
```yaml
test_name:
  query: "Tell me about the Oncora drug"
  true_subjects:
    - "https://bionova.example/id/drug/oncora"
    - "https://bionova.example/id/drug/oncora-xr"
```

**With Thresholds**:
```yaml
test_name:
  query: "Tell me about the Oncora drug"
  true_subjects:
    - "https://bionova.example/id/drug/oncora"
    - "https://bionova.example/id/drug/oncora-xr"
    - "https://bionova.example/id/path/drug-evolution-oncora-family"
  min_recall: 0.67        # Pass if ≥67% of subjects retrieved (2 of 3)
  min_precision: 0.5      # Pass if ≥50% of retrieved are relevant
```

**Configuration Options**:
- `true_subjects`: List of URIs that should be retrieved (required)
- `min_recall`: Minimum fraction of true_subjects to retrieve (default: 1.0 = all)
- `min_precision`: Minimum fraction of retrieved that are relevant (default: 0.0 = ignore)

**Metrics Explained**:
- **Recall**: What fraction of the subjects we care about were retrieved?
  - `recall = found_subjects / true_subjects`
  - Example: Found 2 of 3 → recall = 0.67
- **Precision**: What fraction of retrieved subjects are actually relevant?
  - `precision = relevant_retrieved / total_retrieved`
  - Example: 3 relevant in 10 retrieved → precision = 0.30

**Best Practices**:
- Use `min_recall` < 1.0 for partial credit (e.g., 0.67 for "at least 2 of 3")
- Omit `min_precision` unless testing retrieval noise (usually leave at 0.0)
- Include related resources in `true_subjects` (e.g., Oncora + Oncora-XR)
- Use full URIs from actual knowledge base resources

**How to Find Subjects**:
```bash
# Test the query with search first
echo "your query here" | npm run search

# Check what subjects are in the results
echo "your query here" | npm run search | grep '@id'
```

### Trace Tests (Tool Execution)

Trace tests verify specific tools are executed during request processing.

**When to Use**:
- Testing tool execution paths
- Verifying search tools are called
- Validating graph queries are executed

**Format**:
```yaml
test_name:
  query: "Tell me about drug formulation"
  trace_checks:
    - '.spans[] | select(.name == "tool.SearchResources") | .status.code == 1'
    - '.spans[] | select(.name == "vector.QueryItems") | any'
```

**Note**: Trace tests require the trace service to capture spans. They validate the execution path, not the response content.

## Writing Good Tests

### Ground Tests in Reality

**✅ CORRECT** - Test what exists:
```yaml
vector_oncora_mechanism:
  query: "How does Oncora work as a cancer treatment?"
  criteria: "Response must explain kinase inhibition mechanism, tumor proliferation effects, and oral formulation benefits"
```

**❌ INCORRECT** - Test fabricated data:
```yaml
vector_drug_xyz:
  query: "How does DrugXYZ work?"
  criteria: "Response must explain mechanism"  # DrugXYZ doesn't exist!
```

### Validate Before Writing Tests

Before creating a test, verify the data exists:

```bash
# 1. Test the query works
echo "What is Project Alpha?" | npm run chat

# 2. Check what's retrieved
cat data/memories/common.Conversation.*.jsonl | jq '.identifier.subject' | sort -u

# 3. Verify expected content
grep -r "Project Alpha" examples/knowledge/
```

### Design for Debugging

Every test automatically captures debugging information:
- Conversation ID
- Memory file path
- Resource directory path
- Trace query command

Use this information when tests fail to understand what went wrong.

## Debugging Failed Tests

### Step 1: Review Test Output

When tests fail, the eval report shows:
```
❌ FAIL - test_name (criteria)
  Conversation ID: common.Conversation.abc123...
  Memory: data/memories/common.Conversation.abc123.jsonl
  Resources: data/resources/common.Conversation.abc123/
  Traces: jq 'select(.resource_id == "...")' data/traces/*.jsonl
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

See what operations were performed:

```bash
# Get all operations for this conversation
jq 'select(.resource_id == "common.Conversation.abc123")' data/traces/*.jsonl | jq -c '{name, status}'

# Check if search tools were used
jq 'select(.resource_id == "common.Conversation.abc123" and .name == "vector.QueryItems")' data/traces/*.jsonl
```

**Common Issues**:
- No `vector.QueryItems` traces → Agent didn't search
- No `tool.*` traces → Tools weren't executed
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

Test the same query manually to see expected behavior:

```bash
# Run the same query in chat
echo "your query here" | npm run chat

# Check the memory from that conversation
ls -t data/memories/*.jsonl | head -1 | xargs cat | jq -c '.identifier.subject'
```

If manual testing works but eval fails, the issue is likely:
- Test expectations don't match actual behavior
- Agent behavior is non-deterministic
- Test query wording differs from what works

### Common Failure Patterns

**Agent doesn't retrieve context**:
- Check if query is clear enough
- Verify similar queries work in manual testing
- Consider if agent thinks it can answer without tools

**Wrong resources retrieved**:
- Query may be ambiguous
- Vector search may find unexpected matches
- Update test to expect actual retrieved subjects

**Retrieval test fails but response is good**:
- Check `retrievedCount` in test output
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
1. Update affected tests to match new data
2. Add tests for new entities/relationships
3. Remove tests for deleted information
4. Verify existing tests still pass

When agent behavior changes:
1. Run full eval suite: `npm run eval`
2. Investigate failures using debug info
3. Update test expectations if behavior improved
4. File issues if behavior regressed

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
  query: "What technology platforms does Oncora use?"
  criteria: "Response must identify MolecularForge, ClinicalStream, and DataLake as platforms used by or related to Oncora"
```

### Complete Retrieval Test
```yaml
retrieval_oncora_info:
  query: "Tell me about the Oncora drug"
  true_subjects:
    - "https://bionova.example/id/drug/oncora"
    - "https://bionova.example/id/drug/oncora-xr"
    - "https://bionova.example/id/path/drug-evolution-oncora-family"
  min_recall: 0.67  # Pass if at least 2 of 3 found
```

### Edge Case Test
```yaml
edge_empty_results:
  query: "Find information about drug ABC-999-XYZ"
  criteria: "Response must clearly state the drug is not found without fabricating information or returning unrelated drugs"
```

## Explicit Prohibitions

### Forbidden Test Patterns

1. **DO NOT** create tests for information not in `examples/knowledge/`
2. **DO NOT** write vague criteria that could pass with any response
3. **DO NOT** ignore failed tests - debug and fix them
4. **DO NOT** set `retrieval_at_k` without verifying that many results exist
5. **DO NOT** copy test expectations without validating against actual data

### Alternative Approaches

- Instead of testing fabricated data → Verify data exists in knowledge base first
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
