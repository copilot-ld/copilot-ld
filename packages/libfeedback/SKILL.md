---
name: libfeedback
description: >
  Feedback-driven learning system for AI tool selection improvement. Core
  classes: ExperienceLearner (batch analysis of traces and feedback),
  ExperienceInjector (runtime context injection), FeedbackIndex (feedback
  storage), ExperienceStore (JSON experience persistence). Use for implementing
  learning loops, analyzing tool call patterns, injecting few-shot examples,
  and deriving rules from user signals. Integrates with libtelemetry traces,
  libvector embeddings, and libstorage backends. Keywords: reinforcement
  learning, experience replay, tool selection, context injection, few-shot
  learning, feedback signals.
---

# libfeedback Skill

## When to Use

- Implement feedback collection from user interactions
- Analyze trace data to improve tool selection decisions
- Inject learned experience into agent context windows
- Store and retrieve feedback records by conversation or timestamp
- Build batch learning jobs that process historical feedback

## Key Concepts

**Experience Learning**: Batch process that correlates traces with feedback
signals to extract patterns—what worked, what failed, and why.

**Context Injection**: Runtime mechanism that adds relevant learned experience
to the agent's context before tool selection, without modifying model weights.

**Feedback Index**: Query-optimized storage for user feedback signals linked to
conversation traces.

## Usage Patterns

### Pattern 1: Run batch learning job

```javascript
import { ExperienceLearner, ExperienceStore, FeedbackIndex } from "@copilot-ld/libfeedback";
import { TraceIndex } from "@copilot-ld/libtelemetry/index/trace.js";
import { createStorage } from "@copilot-ld/libstorage";
import { createClient } from "@copilot-ld/librpc";

const feedbackIndex = new FeedbackIndex(createStorage("feedback"));
const experienceStore = new ExperienceStore(createStorage("experience"));
const traceIndex = new TraceIndex(createStorage("traces"));
const vectorClient = await createClient("vector");

const learner = new ExperienceLearner(
  traceIndex,
  feedbackIndex,
  vectorClient,
  experienceStore,
);
await learner.learn();
```

### Pattern 2: Inject experience at runtime

```javascript
import { ExperienceInjector, ExperienceStore } from "@copilot-ld/libfeedback";
import { createStorage } from "@copilot-ld/libstorage";
import { createClient } from "@copilot-ld/librpc";

const experienceStore = new ExperienceStore(createStorage("experience"));
const vectorClient = await createClient("vector");
const injector = new ExperienceInjector(experienceStore, vectorClient);

const context = await injector.generateContext(userQuery, ["search", "query", "chat"]);
// Prepend context to agent prompt
```

### Pattern 3: Record and query feedback

```javascript
import { FeedbackIndex } from "@copilot-ld/libfeedback";
import { learn } from "@copilot-ld/libtype";
import { createStorage } from "@copilot-ld/libstorage";

const feedbackIndex = new FeedbackIndex(createStorage("feedback"));

// Store feedback
const record = learn.FeedbackRecord.fromObject({
  conversation_id: "conv-123",
  trace_id: "trace-456",
  signal: "POSITIVE",
  timestamp: Date.now(),
});
await feedbackIndex.put(record);

// Query recent feedback
const { records } = await feedbackIndex.query({
  filter: { after_timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 },
  limit: 100,
});
```

## Integration

- **libtelemetry**: TraceIndex provides span data for pattern extraction
- **libvector**: Vector client embeds queries for few-shot example selection
- **libstorage**: All persistence uses storage backends (local, S3, etc.)
- **libtype**: FeedbackRecord protobuf for type-safe feedback storage
- **libmemory**: ExperienceInjector output integrates into memory window
