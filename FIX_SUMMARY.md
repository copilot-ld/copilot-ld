# Token Limit Fix Summary

## Issue Analysis

### Problem Statement
The system was exceeding the LLM token limit (128,000) with requests containing 248,111 tokens, causing errors:
```
HTTP 400: Bad Request: {"error":{"message":"prompt token count of 248111 exceeds the limit of 128000","code":"model_max_prompt_tokens_exceeded"}}
```

### Root Cause

**User's Analysis: ✅ CORRECT**

The user correctly identified that:
1. ✅ Token filtering works correctly at the service level (Vector, Graph)
2. ✅ Memory window has too many messages (14 and 24 messages vs. 2 in memory files)
3. ✅ Extra messages are being added during tool execution

**Confirmed Root Cause:**

The issue is in `AgentHands.processToolCalls()` in `/workspaces/copilot-ld/packages/libagent/hands.js`:

```javascript
async processToolCalls(choiceWithToolCalls, messages, maxTokens, githubToken) {
  messages.push(choiceWithToolCalls.message);  // Adds assistant message with tool calls
  
  for (const toolCall of choiceWithToolCalls.message.tool_calls) {
    const toolResult = await this.executeToolCall(toolCall, maxTokens, githubToken);
    //                                                       ^^^^^^^^^ PROBLEM: Passes full budget to EACH tool
    messages.push(toolResult.message);
  }
}
```

**Why This Causes Token Bloat:**

1. Each tool call receives the FULL `maxTokens` budget (e.g., 56,000 tokens)
2. Even though each individual service call respects the limit, multiple calls accumulate:
   - Tool call 1: Returns up to 56,000 tokens
   - Tool call 2: Returns up to 56,000 tokens  
   - Tool call 3: Returns up to 56,000 tokens
   - Total: 168,000 tokens → **EXCEEDS LLM LIMIT**
3. The service-level filtering works correctly, but the budget isn't divided across calls

**Token Budget Configuration:**
- Total budget: 70,000 tokens
- Results allocation: 80% = 56,000 tokens
- Problem: Each tool gets 56,000 tokens instead of dividing it!

## Solution Implemented

### Changes Made

**File: `/workspaces/copilot-ld/packages/libagent/hands.js`**

**Updated `processToolCalls()` method:**
- Calculate per-tool token limit by dividing `maxTokens` by number of tool calls
- Pass divided budget to each `executeToolCall()` invocation
- Service-level filtering now receives appropriate budget allocation

**Key Implementation Details:**

```javascript
async processToolCalls(choiceWithToolCalls, messages, maxTokens, githubToken) {
  messages.push(choiceWithToolCalls.message);

  // Calculate per-tool token limit to prevent message bloat
  // Divide token budget fairly across all tool calls before service execution
  const toolCallCount = choiceWithToolCalls.message.tool_calls.length;
  const perToolLimit = Math.floor(maxTokens / toolCallCount);

  // Execute each tool call with allocated budget
  for (const toolCall of choiceWithToolCalls.message.tool_calls) {
    const toolResult = await this.executeToolCall(
      toolCall,
      perToolLimit,  // ← Pass divided budget instead of full budget
      githubToken,
    );
    
    messages.push(toolResult.message);
  }
}
```

**File: `/workspaces/copilot-ld/packages/libagent/CHANGELOG.md`**

Added entry documenting the fix.

**File: `/workspaces/copilot-ld/packages/libagent/test/hands.test.js`**

Updated test to verify token budget division:
```javascript
test("processToolCalls divides token budget across multiple tool calls", async () => {
  // Test captures the max_tokens value passed to each tool call
  // Verifies budget is divided equally: 9000 / 3 = 3000 per tool
});
```

### How It Works

**Before Fix:**
```
Budget: 56,000 tokens for results
Tool call 1: Receives 56,000 token limit → Returns up to 56,000 tokens
Tool call 2: Receives 56,000 token limit → Returns up to 56,000 tokens  
Tool call 3: Receives 56,000 token limit → Returns up to 56,000 tokens
Total: Up to 168,000 tokens → EXCEEDS LLM LIMIT ❌
```

**After Fix:**
```
Budget: 56,000 tokens for results
Tool calls: 3
Per-tool limit: 56,000 / 3 = 18,666 tokens

Tool call 1: Receives 18,666 token limit → Returns up to 18,666 tokens
Tool call 2: Receives 18,666 token limit → Returns up to 18,666 tokens
Tool call 3: Receives 18,666 token limit → Returns up to 18,666 tokens
Total: Up to 56,000 tokens → Within budget ✅
```

## Verification

### Tests Passing
- ✅ All `AgentHands` unit tests pass
- ✅ Token budget division test passes
- ✅ No ESLint errors introduced
- ✅ No unused imports

### Expected Behavior
1. Token budget is divided fairly before making service calls
2. Each tool service receives appropriate token limit
3. Service-level filtering works with correct budget
4. Total message token count stays within the configured budget
5. LLM token limit errors should not occur
6. More efficient - services only return requested amount of data

## Trade-offs

**Pros:**
- ✅ Prevents LLM token limit errors
- ✅ Fair allocation across multiple tool calls
- ✅ Simple, clean implementation
- ✅ Efficient - services don't return excess data
- ✅ Leverages existing service-level filtering correctly
- ✅ No post-processing needed

**Cons:**
- ⚠️ Tool results may be truncated when many tools are called
- ⚠️ Each tool gets smaller allocation with more concurrent tools

## Future Improvements

Consider these potential enhancements:

1. **Dynamic budget allocation:**
   - Adjust per-tool limit based on tool priority or expected result size
   - Allow some tools to use more budget than others

2. **Streaming or pagination:**
   - Break large result sets across multiple interactions
   - Allow LLM to request more details as needed

3. **Better token accounting:**
   - Track exact tokens used across entire conversation
   - Provide budget feedback to LLM

4. **Adaptive tool calling:**
   - Call high-priority tools first with larger budgets
   - Use remaining budget for additional tools

## Related Issues

This fix addresses the immediate token limit problem:
- ✅ Service-level token filtering (already working correctly, now receives correct budgets)
- ✅ Memory window token allocation (already working correctly)
- ✅ Offline resource token counting (already working correctly)

The fix specifically targets the **tool execution budget allocation** issue that was causing token bloat by passing the full budget to every tool call instead of dividing it appropriately.
