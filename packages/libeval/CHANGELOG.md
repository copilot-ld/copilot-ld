# Changelog

## 2025-11-01

- Simplified `RetrievalEvaluator` to use standard recall and precision metrics as minimum thresholds
- Added `min_recall` parameter: minimum fraction of true_subjects that must be retrieved (default 1.0)
- Added `min_precision` parameter: minimum fraction of retrieved items that must be relevant (default 0.0)
- Removed confusing @K notation and multiple configuration options
- Reports actual recall and precision values with found/missing subjects
- Updated evaluation instructions with clearer examples

## 2025-10-31

- Implemented unified evaluator design with three specialized evaluation
  strategies
- Added `CriteriaEvaluator` for LLM judge-based criteria evaluation using
  natural language requirements
- Added `RetrievalEvaluator` for metrics-based evaluation with `retrieval_at_k`
  and `precision_at_k` calculations
- Added `TraceEvaluator` for trace analysis using jq command execution on span
  data
- Refactored main `Evaluator` class to dispatch to appropriate evaluator based
  on test case configuration
- Updated `ReportGenerator` to handle three result types (criteria, retrieval,
  trace) with PASS/FAIL outcomes
- Migrated `eval.yml` to new format with single evaluation method per case
- Updated `bin/eval.js` to initialize all three evaluator types with required
  clients
- Removed old `judge.js` and `metrics.js` files in favor of focused evaluator
  classes

## 2025-10-26

- Moved evaluation script to `bin/eval.js` for `npx evaluation` execution
  (binary name avoids conflict with shell builtin)

## 2025-10-23

- Initial implementation of `LLM-as-a-judge` evaluation system with 5 metrics
  (Relevance, Accuracy, Completeness, Coherence, Source Attribution)
- Added `Judge`, `MetricsCalculator`, `ReportGenerator`, and `Evaluator` classes
  with parallel processing support
