---
description:
  Identify gaps between agent profile instructions and observed behavior
agent: grounded-garry
---

# Open Coding: Agent Profile Error Analysis

## Objective

Identify gaps between agent profile instructions and observed agent behavior
that cause evaluation failures.

## Process

1. Read `data/eval/SUMMARY.md` to find scenarios with pass rate < 100%
2. For each failed scenario, run: `node scripts/code.js data/eval/<scenario>.md`
3. Read the agent profiles in `data/eval/agents/` to understand expected
   behavior
4. Create codes comparing profile instructions to actual behavior in
   `SCRATCHPAD-1.md`
5. **Next Step:** Proceed to `axial-coding.prompt.md` after identifying all
   codes

## Output

**File:** `SCRATCHPAD-1.md` **Next Stage:** Axial Coding
(`axial-coding.prompt.md`)

## Code Structure

Each code must follow this format with systematic reference labels:

```markdown
### CODE1: descriptive_error_name

**Label:** `CODE1`

**Agent Profile:** <which agent profile contains the violated instruction>

**Profile Instruction:** <quote the specific instruction from the agent profile
that was not followed>

**Lines:** <line numbers in source data>

**Excerpts:** <relevant excerpts from any data source showing the error -
traces, logs, responses, etc.>

**Error:** <how the observed behavior diverges from the profile instruction>
```

**Label Assignment Rules:**

- Number codes sequentially starting from `CODE1`
- Use format `CODE1`, `CODE2`, `CODE3`, etc.
- Include the label in both the heading and the **Label:** field
- Labels must be unique and sequential across all codes in the document

## Coding Rules

**Focus on profile-behavior gaps:**

- Instructions in agent profile that were not followed
- Missing tool calls that the profile requires
- Workflow steps skipped despite profile mandating them
- Content in responses not backed by retrieved data (violates reporting rules)
- Profile conditions met but corresponding actions not taken

**Avoid:**

- LLM non-determinism without actionable profile implications
- Correct behavior documentation
- Theoretical explanations without concrete profile violations
- Errors with no clear profile instruction to address them

## Examples

Example 1:

````markdown
### CODE1: missing_relationship_query

**Label:** `CODE1`

**Agent Profile:** `graph_navigator`

**Profile Instruction:** "Use wildcard queries to discover all predicates
connecting these entities. Check for indirect connections via shared
intermediate entities."

**Lines:** 45-52

**Excerpts:**

```
agent->>+tool: CallTool (function_name=query_by_pattern)
tool->>+graph: QueryByPattern (subject=product:gamma, predicate=schema:description)
graph-->>-tool: OK (identifiers=1)
agent->>+llm: CreateCompletions (messages=6)
```

**Error:** Profile requires wildcard queries to discover all predicates, but
agent queries only schema:description then responds. No wildcard query
(`subject ? ?`) was issued to discover other predicates like schema:requires.
````

Example 2:

````markdown
### CODE2: insufficient_search_results_retrieved

**Label:** `CODE2`

**Agent Profile:** `content_searcher`

**Profile Instruction:** "If results seem incomplete, perform follow-up searches
with adjusted parameters."

**Lines:** 78-85

**Excerpts:**

```
agent->>+tool: CallTool (function_name=search_content)
tool->>+vector: QueryItems (threshold=0.3, limit=5)
vector-->>-tool: OK (identifiers=5)
agent->>+llm: CreateCompletions (messages=8)
```

**Error:** Profile instructs follow-up searches when results may be incomplete.
Agent retrieves exactly 5 results (hitting limit), indicating potential
truncation, but performs no follow-up search with increased limit.
````

Example 3:

````markdown
### CODE3: unsupported_claim_in_response

**Label:** `CODE3`

**Agent Profile:** `detailed_reporter`

**Profile Instruction:** "Preserve all raw data and evidence. Your role is
reporting and synthesis, not primary research."

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
```

**Error:** Profile requires preserving raw data only. Response includes employee
count (500) and departments not present in any tool response. Agent performed
"primary research" (hallucination) instead of reporting retrieved data.
````
