# Changelog

## 2025-10-23

- Initial implementation of evaluation system with `LLM-as-a-judge` approach
- Added `Judge` class with 5 evaluation metrics: Relevance, Accuracy,
  Completeness, Coherence, Source Attribution
- Added `MetricsCalculator` for score aggregation
- Added `ReportGenerator` for markdown and JSON report generation
- Added `Evaluator` orchestration class with parallel processing support
- Version `v1.0.0`
