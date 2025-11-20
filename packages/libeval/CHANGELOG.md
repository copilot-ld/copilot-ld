# Changelog

## 2025-11-19

- Bump version

## 2025-11-18

- Bump version

## 2025-10-26

- Moved evaluation script to `bin/eval.js` for `npx evaluation` execution
  (binary name avoids conflict with shell builtin)

## 2025-10-23

- Initial implementation of `LLM-as-a-judge` evaluation system with 5 metrics
  (Relevance, Accuracy, Completeness, Coherence, Source Attribution)
- Added `Judge`, `MetricsCalculator`, `ReportGenerator`, and `Evaluator` classes
  with parallel processing support
