---
applyTo: "**"
---

# CLI Tools Instructions

## Purpose Declaration

This file provides guidance for using the platform's CLI tools during
development, debugging, evaluation, and exploration. These tools provide direct
access to core platform capabilities through simple command-line interfaces.

## Core Principles

1. **Development Utilities**: These CLI tools are essential for development,
   debugging, evaluation, and system exploration
2. **Direct System Access**: Tools provide command-line interfaces to core
   platform capabilities (agent, search, graph)
3. **Non-Interactive Usage**: Support piped input for automated execution and AI
   agent usage
4. **REPL Support**: Interactive mode available for human developers, with
   configuration commands
5. **Stateless Execution**: Each command is self-contained and independent

## When to Use CLI Tools

Use these CLI tools when you need to:

- **Debug Services**: Verify that services are running and responding correctly
- **Explore Data**: Discover what entities, relationships, and content exist in
  the system
- **Validate Changes**: Check that code modifications produce expected behavior
- **Evaluate Quality**: Assess system responses and search relevance
- **Demonstrate Features**: Show how the platform works to users or in
  documentation
- **Develop Iteratively**: Test functionality during active development

## Available CLI Tools

### Chat (`npm -s run cli:chat`)

Direct access to the Agent service for conversational interactions. Tests the
full service stack including Memory, LLM, and Tool services.

**State Persistence**: The chat tool maintains conversation state between
invocations, persisting the `resource_id` to disk. This allows multi-turn
conversations to continue across separate CLI invocations, with each new message
building on the previous conversation context.

**Basic Usage**:

```bash
echo "Tell me about the company" | npm -s run cli:chat
```

**Multi-Turn Conversations**:

```bash
printf "What is microservices?\nWhat are their benefits?\n" | npm -s run cli:chat
```

**Clearing State**:

When you need to start a fresh conversation without previous context, use the
`--clear` flag. Note that `--clear` must be run as a separate step - it clears
the state and exits immediately without processing any piped input:

```bash
# Clear state (runs independently, does not process piped input)
npm -s run cli:chat -- --clear

# Then submit new prompt in fresh conversation
echo "New conversation topic" | npm -s run cli:chat
```

**Validation**:

- Agent processes requests and maintains conversation context
- LLM generates appropriate responses
- Tool invocations work when triggered by natural language
- Responses are properly formatted
- Conversation state persists between CLI invocations

### Search (`npm -s run cli:search`)

Direct access to vector search capabilities including embedding generation and
similarity matching across content and descriptor indices.

**Basic Content Search**:

```bash
echo "pharmaceutical research" | npm -s run cli:search
```

**Command-Line Options**:

```bash
# Set similarity threshold and limit
echo "regulatory compliance" | npm -s run cli:search -- --threshold 0.7 --limit 10

# Use descriptor representation instead of content
echo "clinical trials" | npm -s run cli:search -- --representation descriptor --threshold 0.5
```

Available command-line options:

- `--limit <number>` - Set maximum results (0 for unlimited)
- `--threshold <0.0-1.0>` - Set similarity score threshold
- `--representation <content|descriptor>` - Set index type

**Validation**:

- Embeddings are generated from search queries
- Vector similarity search returns ranked results
- Command-line options configure search behavior
- Results include similarity scores and content snippets

### Query (`npm -s run cli:query`)

Direct access to graph database queries using RDF triple patterns with wildcard
support.

**Subject Queries**:

```bash
echo "person:john ? ?" | npm -s run cli:query
```

**Predicate Queries**:

```bash
echo "? foaf:name ?" | npm -s run cli:query
```

**Object Queries**:

```bash
echo '? ? "John Doe"' | npm -s run cli:query
```

**Type Discovery**:

```bash
echo "? rdf:type schema:Person" | npm -s run cli:query
```

**Validation**:

- Triple patterns are parsed correctly
- Wildcards (`?`) match any value
- Results are formatted as RDF triples in Turtle syntax
- Quoted strings handle spaces properly

### Subjects (`npm -s run cli:subjects`)

Direct access to retrieve all subjects from the graph index with optional type
filtering.

**All Subjects**:

```bash
echo "" | npm -s run cli:subjects
echo "*" | npm -s run cli:subjects
```

**Filtered by Type**:

```bash
echo "https://schema.org/Person" | npm -s run cli:subjects
echo "https://schema.org/ScholarlyArticle" | npm -s run cli:subjects
```

**Validation**:

- Returns tab-separated list of subjects and types
- Empty input or `*` returns all subjects
- Type URI filters results to matching subjects
- Output is sorted alphabetically

### Visualize (`npm -s run cli:visualize`)

Direct access to visualize traces from the trace index using JMESPath queries
and filters. JMESPath expressions are evaluated per-trace to select which
complete traces to visualize.

**All Traces from a Resource**:

```bash
echo "[]" | npm -s run cli:visualize -- --resource common.Conversation.abc123
```

**JMESPath Query Examples** (returns complete matching traces):

```bash
echo "[?name=='agent.ProcessRequest']" | npm -s run cli:visualize
echo "[?contains(name, 'llm')]" | npm -s run cli:visualize
echo "[?kind==\`2\`]" | npm -s run cli:visualize
```

**Command-Line Options**:

```bash
# Filter by specific trace ID
echo "[]" | npm -s run cli:visualize -- --trace 0f53069dbc62d

# Filter by resource ID and apply JMESPath query
echo "[?contains(name, 'QueryByPattern')]" | npm -s run cli:visualize -- --resource common.Conversation.abc123
```

Available command-line options:

- `--trace-id <id>` - Filter by trace ID
- `--resource-id <id>` - Filter by resource ID

**Query Semantics**:

- JMESPath expressions are evaluated against each trace's spans
- If the expression returns a truthy/non-empty result, the **entire trace** is
  visualized
- `[]` matches all traces (returns non-empty array for each)
- `[?condition]` matches traces where at least one span matches the condition
- Array indexing like `[0]` matches traces with at least one span (nearly all)

**Validation**:

- Traces are loaded from the trace index
- JMESPath queries select which complete traces to visualize
- Command-line options apply filters before queries
- Visualization includes timing information and resource relationships
- Output is terminal-formatted for readability

## Best Practices

### Using CLI Tools During Development

**For Debugging**:

- Use `cli:chat` to verify agent service integration and tool execution
- Use `cli:search` to validate vector embeddings and search quality
- Use `cli:query` to inspect graph relationships and verify data structure
- Use `cli:subjects` to discover what entities exist in the system
- Use `cli:visualize` to analyze request flows and trace timing information

**For Exploration**:

- Start with `cli:subjects` to see what data is available
- Use `cli:query` with wildcards to explore relationships
- Use `cli:search` to test semantic similarity
- Use `cli:chat` to understand end-to-end behavior
- Use `cli:visualize` to examine trace patterns and resource interactions

**For Validation**:

- Pipe test inputs through CLI tools to verify expected outputs
- Use command-line options to adjust parameters and observe behavior changes
- Compare results across different configurations

### Command Construction

- Use `echo` for single-line input
- Use `printf` with `\n` for multi-line input (conversations only)
- Quote strings containing spaces or special characters
- Use `--` separator before options: `npm -s run cli:<tool> -- --option value`
- Pipe commands directly to `npm -s run cli:<tool>`

## Explicit Prohibitions

### Forbidden Patterns

1. **DO NOT** assume CLI tools are only for testing - they're for development,
   debugging, exploration, and evaluation
2. **DO NOT** create custom wrappers or abstractions around these tools
3. **DO NOT** reference setup prerequisites in tool usage (services must be
   running, but that's handled by the npm scripts)

### Alternative Approaches

- Instead of custom debugging scripts → Use CLI tools with piped input
- Instead of ad-hoc testing code → Use CLI tools for validation
- Instead of manual exploration → Use CLI tools for system discovery
- Instead of verbose logging → Use CLI tools to inspect system state

## Comprehensive Examples

### Development Workflow Example

```bash
# 1. Discover what entities exist
echo "*" | npm -s run cli:subjects

# 2. Explore a specific entity type
echo "https://schema.org/Person" | npm -s run cli:subjects

# 3. Query relationships for an entity
echo "person:john ? ?" | npm -s run cli:query

# 4. Search for related content
echo "pharmaceutical research" | npm -s run cli:search

# 5. Test agent with natural language
echo "Tell me about drug development" | npm -s run cli:chat
```

### Debugging Service Issues

```bash
# Verify agent service is responding
echo "Hello" | npm -s run cli:chat

# Check vector search is working
echo "test query" | npm -s run cli:search

# Validate graph index is populated
echo "" | npm -s run cli:subjects

# Analyze recent request traces
npm -s run cli:visualize
```

### Analyzing Request Traces

```bash
# View all traces with terminal formatting
echo "[]" | npm -s run cli:visualize

# Filter by specific trace ID
echo "[]" | npm -s run cli:visualize -- --trace 0f53069dbc62d

# Filter by resource ID (conversation, memory, etc.)
echo "[]" | npm -s run cli:visualize -- --resource "common.Conversation.abc123"

# Combine filters with JMESPath query
echo "[?contains(name, 'llm')]" | npm -s run cli:visualize -- --resource "common.Conversation.abc123"
```

### Exploring Graph Relationships

```bash
# Find all facts about an entity
echo "person:sarah ? ?" | npm -s run cli:query

# Find who knows Sarah
echo "? foaf:knows person:sarah" | npm -s run cli:query

# Find who Sarah knows
echo "person:sarah foaf:knows ?" | npm -s run cli:query
```

### Validating Search Quality

```bash
# Test with different thresholds
echo "pharmaceutical manufacturing" | npm -s run cli:search -- --threshold 0.65 --limit 10

# Compare content vs descriptor search
echo "clinical trials" | npm -s run cli:search -- --representation descriptor --threshold 0.5
```

### Multi-Turn Conversation Testing

```bash
# Test conversation context (builds on previous conversation)
printf "What is drug formulation?\nHow does it affect bioavailability?\n" | npm -s run cli:chat

# Clear state first (separate step)
npm -s run cli:chat -- --clear

# Start fresh conversation without previous context
echo "Tell me about clinical trials" | npm -s run cli:chat

# Continue the new conversation
echo "What phases are involved?" | npm -s run cli:chat
```
