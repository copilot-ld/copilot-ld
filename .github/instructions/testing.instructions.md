---
applyTo: "**"
---

# Integration Testing Instructions

## Purpose Declaration

This file provides comprehensive guidance for integration testing of the
microservices platform using non-interactive script commands to validate
end-to-end system functionality through the Agent, Search, and Graph Query
interfaces.

## Core Principles

1. **Non-Interactive Testing Only**: All tests must use piped input and command
   line options for automated execution without user interaction
2. **Single-Line Commands**: All test commands must be executable as single
   terminal commands using the `run_in_terminal` tool
3. **Standard Input Validation**: Tests must verify system responses through
   standard output examination
4. **Service Integration Focus**: Tests validate complete service chains, not
   individual components
5. **Stateless Execution**: Each test command must be self-contained and not
   depend on previous command state
6. **Output Validation**: Test success is determined by examining command output
   for expected content patterns

## Implementation Requirements

### Chat Integration Testing

The `npm run chat` command tests the full Agent service stack including Memory,
LLM, and Tool services through conversational interactions.

#### Basic Chat Testing

Test simple conversation processing:

```bash
echo "Tell me about the company" | npm run chat
```

This validates:

- Agent service request processing
- LLM service integration
- Memory service conversation tracking
- Response generation and formatting

#### Multi-Turn Conversation Testing

Test conversation continuity with multiple messages:

```bash
printf "Tell me about microservices\nWhat are their benefits?\n" | npm run chat
```

This validates:

- Conversation ID management
- Message history preservation
- Context-aware response generation
- Multi-turn conversation flow

#### Tool Execution Testing

Test tool invocation through natural language:

```bash
echo "Search for information about drug development" | npm run chat
```

This validates:

- Tool service integration
- Natural language to tool mapping
- Tool execution and result processing
- Response formatting with tool results

#### Error Handling Testing

Test error response handling:

```bash
echo "" | npm run chat
```

This validates:

- Empty input handling
- Service error propagation
- Graceful error responses

### Search Integration Testing

The `npm run search` command tests vector search capabilities including
embedding generation and similarity matching across content and descriptor
indices.

#### Basic Content Search Testing

Test default content index search:

```bash
echo "pharmaceutical research" | npm run search
```

This validates:

- LLM embedding generation
- Vector index query execution
- Content similarity matching
- Resource retrieval and formatting

#### Descriptor Search Testing

Test descriptor index search with command-line option:

```bash
echo "clinical trials" | npm run search -- --index descriptor
```

This validates:

- Index selection via --index
- Descriptor-based similarity search
- Alternative index querying

#### Threshold Filtering Testing

Test similarity threshold configuration with command-line option:

```bash
echo "regulatory compliance" | npm run search -- --threshold 0.7
```

This validates:

- Threshold option processing
- Result filtering by similarity score
- High-confidence match retrieval

#### Result Limit Testing

Test result count limitation with command-line option:

```bash
echo "drug development" | npm run search -- --limit 3
```

This validates:

- Limit option processing
- Result set truncation
- Top-N result retrieval

#### Combined Configuration Testing

Test multiple configuration options together with command-line options:

```bash
echo "manufacturing quality" | npm run search -- --threshold 0.6 --limit 5 --index content
```

This validates:

- Multiple option processing
- Configuration state management
- Combined filtering and limiting

### Query Integration Testing

The `npm run query` command tests graph database queries using triple pattern
matching with RDF/SPARQL-like syntax.

#### Subject Pattern Testing

Test queries for specific subjects:

```bash
echo "person:john ? ?" | npm run query
```

This validates:

- Subject-based graph querying
- Wildcard pattern matching
- Triple retrieval and formatting

#### Predicate Pattern Testing

Test queries for specific relationships:

```bash
echo "? foaf:name ?" | npm run query
```

This validates:

- Predicate-based graph filtering
- Relationship discovery
- Cross-entity querying

#### Object Pattern Testing

Test queries for specific values:

```bash
echo '? ? "John Doe"' | npm run query
```

This validates:

- Object-based graph matching
- Literal value querying
- Quoted string handling

#### Wildcard Query Testing

Test broad pattern matching:

```bash
echo "? ? ?" | npm run query
```

This validates:

- Complete graph enumeration
- Wildcard-only pattern handling
- Large result set management

#### Type Discovery Testing

Test entity type queries:

```bash
echo "? rdf:type schema:Person" | npm run query
```

This validates:

- Type-based entity discovery
- Schema vocabulary support
- Classification querying

#### Combined Pattern Testing

Test specific triple patterns:

```bash
echo "person:sarah foaf:knows person:michael" | npm run query
```

This validates:

- Complete triple specification
- Exact match querying
- Relationship verification

## Best Practices

### Test Command Construction

When constructing test commands:

- Use `echo` for single-line input to test scripts
- Use `printf` with `\n` for multi-line input sequences
- Quote strings containing spaces or special characters
- Pipe commands directly to `npm run` scripts
- Chain configuration commands before query commands

### Output Validation Patterns

When validating test output:

- Search for expected content markers in response text
- Verify service names appear in error messages
- Check for proper markdown formatting in results
- Confirm similarity scores appear in search results
- Validate RDF triple formatting in query results

## Explicit Prohibitions

### Forbidden Testing Patterns

1. **DO NOT** use interactive modes or expect user input during tests
2. **DO NOT** reference test prerequisites like `npm run codegen` or data
   processing
3. **DO NOT** create custom code or test harnesses for integration testing
4. **DO NOT** rely on persistent state between test command executions
5. **DO NOT** use test commands that require manual setup steps
6. **DO NOT** create multi-file test structures for integration testing
7. **DO NOT** use testing frameworks or libraries for these integration tests
8. **DO NOT** assume specific conversation IDs or message history state

### Alternative Approaches

- Instead of shell scripts → Use single-line piped commands with `echo` or
  `printf`
- Instead of interactive testing → Use non-interactive piped input
- Instead of setup documentation → Focus on command execution only
- Instead of custom test code → Use standard command-line input redirection
- Instead of stateful testing → Design each command as independent validation
- Instead of manual setup → Assume system is already operational
- Instead of test frameworks → Use direct command execution and output
  examination
- Instead of conversation state → Test each interaction independently

## Comprehensive Examples

### Complete Chat Integration Test

Test full conversation flow with agent:

```bash
printf "What is the company's drug development process?\nTell me about clinical trials\n" | npm run chat
```

**Expected Output Validation**:

- Response contains relevant information
- Conversation flows naturally between questions
- Each response addresses the specific question
- Markdown formatting is preserved

### Complete Search Integration Test

Test vector search with full configuration using command-line options:

```bash
echo "pharmaceutical manufacturing processes" | npm run search -- --threshold 0.65 --limit 10 --index content
```

**Expected Output Validation**:

- Command-line options execute without error
- Search results include similarity scores
- Results are limited to 10 items
- Only results above 0.65 threshold appear
- Content index is used for search

### Complete Query Integration Test

Test graph queries with various patterns:

```bash
echo "project:precision-medicine ? ?" | npm run query
```

**Expected Output Validation**:

- Query executes without syntax errors
- Results show RDF triples in Turtle format
- Subject matches the specified pattern
- All predicates and objects for subject are shown

### Multi-Configuration Search Test

Test sequential configuration changes using command-line options:

```bash
echo "drug formulation optimization" | npm run search -- --index descriptor --threshold 0.5
echo "drug formulation optimization" | npm run search -- --index content --threshold 0.7
```

**Expected Output Validation**:

- First search uses descriptor index with 0.5 threshold
- Second search uses content index with 0.7 threshold
- Results differ based on index and threshold changes
- Each command is independent and stateless

### Complex Graph Pattern Test

Test specific relationship queries:

```bash
echo "? schema:memberOf org:bionova" | npm run query
```

**Expected Output Validation**:

- Query finds all entities with membership relationship
- Organization is correctly identified as object
- Results show person/team entities as subjects
- Triple format follows RDF standards

### Threshold Range Test

Test different similarity thresholds using command-line options:

```bash
echo "clinical trials" | npm run search -- --threshold 0.3
echo "clinical trials" | npm run search -- --threshold 0.5
echo "clinical trials" | npm run search -- --threshold 0.8
```

**Expected Output Validation**:

- Lower thresholds return more results
- Higher thresholds return fewer, more relevant results
- Similarity scores meet configured thresholds
- Result quality improves with higher thresholds

### Graph Relationship Discovery Test

Test discovering entity relationships:

```bash
echo "person:sarah ? ?" | npm run query
echo "? foaf:knows person:sarah" | npm run query
echo "person:sarah foaf:knows ?" | npm run query
```

**Expected Output Validation**:

- First query shows all facts about Sarah
- Second query shows who knows Sarah
- Third query shows who Sarah knows
- Relationship directionality is preserved

### Multi-Turn Context Test

Test conversation context maintenance:

```bash
printf "What is drug formulation?\nHow does it affect bioavailability?\nWhat are the main challenges?\n" | npm run chat
```

**Expected Output Validation**:

- First response explains drug formulation
- Second response discusses bioavailability impact
- Third response discusses challenges in context
- Pronoun references resolve correctly
