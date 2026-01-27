# Axial Coding: Agent Profile Gap Patterns

## Objective

Group profile-behavior gaps into categories that reveal which agent profile
sections need improvement.

## Prerequisites

**Required Input:** `SCRATCHPAD1.md` from Open Coding stage **Previous Stage:**
Open Coding (`open-coding.prompt.md`)

## Process

1. Read all codes from `SCRATCHPAD1.md`
2. Group codes by the agent profile and profile section they relate to
3. Identify patterns showing which profile instructions are consistently
   violated
4. Document error categories in `SCRATCHPAD2.md`
5. **Next Step:** Proceed to `selective-coding.prompt.md` after categorizing all
   codes

## Output

**File:** `SCRATCHPAD2.md` **Next Stage:** Selective Coding
(`selective-coding.prompt.md`)

## Category Structure

Each category must follow this format with systematic reference labels:

````markdown
## CAT1: descriptive_category_name

**Label:** `CAT1`

**Codes:** `CODE1`, `CODE2`, `CODE3` (from SCRATCHPAD1.md)

**Affected Profiles:** <list of agent profiles with violated instructions>

**Profile Section:** <which section(s) of the profile contain the violated
instructions - e.g., "Workflow", "When to Delegate", "Reporting">

**Pattern:** <how these profile violations relate to each other>

**Profile Gap:** <what is missing or unclear in the profile that allows this
violation>

```mermaid
<diagram showing profile instruction to violation relationships>
```
````

**Label Assignment Rules:**

- Number categories sequentially starting from `CAT1`
- Use format `CAT1`, `CAT2`, `CAT3`, etc.
- Include the label in both the heading and the **Label:** field
- Reference codes using their labels (e.g., `CODE1`, `CODE2`) in the **Codes:**
  field
- Use code labels in mermaid diagrams for clear traceability
- Labels must be unique and sequential across all categories in the document

## Categorization Rules

**Focus on profile improvement implications:**

- Group errors by which agent profile instructions they violate
- Identify when profile instructions are ambiguous or incomplete
- Show which profile sections need strengthening
- Highlight missing workflow steps or decision criteria in profiles

**Avoid:**

- Generic behavioral descriptions without profile implications
- Categories that don't map to specific profile sections
- LLM capability theorizing without actionable profile changes
- Mixed categories combining violations from unrelated profile sections

## Examples

Example 1:

````markdown
## CAT1: Incomplete Data Exploration

**Label:** `CAT1`

**Codes:** `CODE1`, `CODE2`, `CODE3`

**Affected Profiles:** `graph_navigator`, `coordinator`

**Profile Section:** "Delegation Workflow" (coordinator), "Query Strategy"
(graph_navigator)

**Pattern:** Agent queries one or two predicates, gets partial results, then
immediately generates response without exploring other available predicates that
could provide more complete information.

**Profile Gap:** Profile instructs "use wildcard queries" but doesn't specify
this as a mandatory first step. Profile lacks explicit workflow: (1) discover
schema, (2) identify all relevant predicates, (3) query each, (4) respond.

```mermaid
flowchart TD
    subgraph Profile Instructions
        P1[graph_navigator:<br/>"Use wildcard queries"]
        P2[coordinator:<br/>"Detailed delegation prompts"]
    end

    subgraph Violations
        V1[CODE1, CODE2, CODE3:<br/>Single predicate queries]
    end

    subgraph Gap
        G1[Missing: Mandatory<br/>schema discovery step]
    end

    P1 -.violated by.-> V1
    P2 -.violated by.-> V1
    V1 --> G1

    style V1 fill:#ffcccc
```
````

Example 2:

````markdown
## CAT2: Search Result Truncation

**Label:** `CAT2`

**Codes:** `CODE4`, `CODE5`, `CODE6`

**Affected Profiles:** `content_searcher`

**Profile Section:** "Search Strategy"

**Pattern:** Agent sets search parameters that artificially limit results (low
threshold, low limit), retrieves exactly limit number of results indicating
truncation, then responds without adjusting parameters to check for additional
relevant content.

**Profile Gap:** Profile says "adjust parameters if results seem incomplete" but
doesn't define "incomplete." Missing explicit rule: if
`results.length == limit`, results may be truncated—re-search with higher limit.

```mermaid
flowchart LR
    subgraph Profile
        P1[content_searcher:<br/>"Adjust parameters<br/>if incomplete"]
    end

    subgraph Violation
        V1[CODE4, CODE5, CODE6:<br/>Accept truncated results]
    end

    subgraph Gap
        G1[Missing: Definition of<br/>"incomplete" results]
    end

    P1 -.violated by.-> V1
    V1 --> G1

    style V1 fill:#ffcccc
```
````
