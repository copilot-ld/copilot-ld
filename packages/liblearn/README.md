# liblearn

Experience learning from feedback for tool selection improvement.

## Overview

This package implements a feedback-driven learning system that improves tool
selection by analyzing historical traces and user feedback. Learning manifests
as context injection, not model weight updates.

## Components

| Class                | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `ExperienceLearner`  | Batch job that analyzes traces + feedback to generate experience |
| `ExperienceInjector` | Runtime injection of learned experience into context window      |
| `FeedbackIndex`      | Storage index for feedback records                               |
| `ExperienceStore`    | JSON storage for learned experience                              |

## Usage

```javascript
import { ExperienceLearner, ExperienceInjector } from "@copilot-ld/liblearn";

// Batch learning (run as scheduled job)
const learner = new ExperienceLearner(
  traceIndex,
  feedbackIndex,
  vectorClient,
  experienceStore,
);
await learner.learn();

// Runtime injection (integrated into memory window)
const injector = new ExperienceInjector(experienceStore, vectorClient);
const context = await injector.generateContext(userQuery, availableTools);
```

## CLI

```bash
make cli-learn  # Run batch learning job
```
