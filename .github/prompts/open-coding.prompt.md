# Open Coding: Agent Error Analysis

## Objective

Identify specific agent behavior patterns that cause evaluation failures.

## Process

1. Read `data/eval/SUMMARY.md` to find scenarios with pass rate < 100%
2. For each failed scenario, run: `node scripts/code.js data/eval/<scenario>.md`
3. Create codes for agent errors in `SCRATCHPAD1.md`
4. **Next Step:** Proceed to `axial-coding.prompt.md` after identifying all
   codes

## Output

**File:** `SCRATCHPAD1.md` **Next Stage:** Axial Coding
(`axial-coding.prompt.md`)

## Code Structure

Each code must follow this format with systematic reference labels:

```markdown
### CODE1: descriptive_error_name

**Label:** `CODE1`

**Lines:** <line numbers in source data>

**Excerpts:** <relevant excerpts from any data source showing the error -
traces, logs, responses, etc.>

**Error:** <what the agent did wrong>
```

**Label Assignment Rules:**

- Number codes sequentially starting from `CODE1`
- Use format `CODE1`, `CODE2`, `CODE3`, etc.
- Include the label in both the heading and the **Label:** field
- Labels must be unique and sequential across all codes in the document

## Coding Rules

**Focus on agent errors:**

- Missing tool calls that should have been made
- Wrong sequence of operations
- Insufficient data retrieval before responding
- Content in responses not backed by retrieved data
- Incorrect tool parameters or queries
- Premature completion without exploring available data

**Avoid:**

- LLM non-determinism without actionable agent implications
- Correct behavior documentation
- Theoretical explanations without concrete errors
- Abstract comparisons between runs

## Examples

Example 1:

````markdown
### CODE1: missing_relationship_query

**Label:** `CODE1`

**Lines:** 45-52

**Excerpts:**

```
agent->>+tool: CallTool (function_name=query_by_pattern)
tool->>+graph: QueryByPattern (subject=product:gamma, predicate=schema:description)
graph-->>-tool: OK (identifiers=1)
agent->>+llm: CreateCompletions (messages=6)
```

**Error:** Agent queries only schema:description but response includes product
dependencies. No query for schema:requires or related predicates before final
completion.
````

Example 2:

````markdown
### CODE2: insufficient_search_results_retrieved

**Label:** `CODE2`

**Lines:** 78-85

**Excerpts:**

```
agent->>+tool: CallTool (function_name=search_content)
tool->>+vector: QueryItems (threshold=0.3, limit=5)
vector-->>-tool: OK (identifiers=5)
agent->>+llm: CreateCompletions (messages=8)
```

**Error:** Agent retrieves only 5 results with limit=5, then immediately
responds. No second search with higher limit to check if more relevant content
exists.
````

Example 3:

````markdown
### CODE3: unsupported_claim_in_response

**Label:** `CODE3`

**Lines:** 134-142, 156-161

**Excerpts:**

```
agent->>+tool: CallTool (function_name=query_by_pattern)
tool->>+graph: QueryByPattern (subject=organization:acme, predicate=schema:location)
graph-->>-tool: OK (identifiers=1)
agent->>+llm: CreateCompletions (messages=10)
```

```
**Response:** The ACME organization is located in Seattle and has 500 employees
across three departments: Engineering, Sales, and Operations.

**Citations:**
1. [organization:acme][common.Message.12345]
```

**Error:** Agent response includes employee count (500) and department
information that was never retrieved. The only query executed was for
schema:location. No queries for schema:numberOfEmployees or schema:department
were performed.
````
