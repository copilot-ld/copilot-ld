# libfeedback

Feedback-driven learning system that improves tool selection through context
injection, not model weight updates.

## Usage

```javascript
import { ExperienceLearner, ExperienceInjector } from "@copilot-ld/libfeedback";

// Batch learning (run as scheduled job)
const learner = new ExperienceLearner(traceIndex, feedbackIndex, vectorClient, experienceStore);
await learner.learn();

// Runtime injection (integrated into memory window)
const injector = new ExperienceInjector(experienceStore, vectorClient);
const context = await injector.generateContext(userQuery, availableTools);
```

## API

| Export               | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `ExperienceLearner`  | Batch analysis of traces + feedback          |
| `ExperienceInjector` | Runtime injection into context window        |
| `FeedbackIndex`      | Query-optimized feedback storage             |
| `ExperienceStore`    | JSON persistence for learned experience      |

## CLI

```bash
make cli-feedback  # Run experience learning batch job
```
