# libeval

Evaluation system for RAG agent quality assessment using LLM-as-judge patterns,
recall metrics, and trace analysis.

## Usage

```javascript
import { Evaluator, CriteriaEvaluator } from "@copilot-ld/libeval";

const evaluator = new Evaluator(config);
const results = await evaluator.run(testCases);
```

## API

| Export              | Description                      |
| ------------------- | -------------------------------- |
| `Evaluator`         | Main evaluation orchestrator     |
| `EvalStore`         | Storage for evaluation results   |
| `ReportGenerator`   | Report generation                |
| `CriteriaEvaluator` | LLM-as-judge criteria evaluation |
| `RecallEvaluator`   | Retrieval recall evaluation      |
| `TraceEvaluator`    | Execution trace evaluation       |
