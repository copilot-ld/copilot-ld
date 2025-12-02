# Changelog

## 2025-12-01

- Changed `config/eval.yml` format from object-based to array-based structure
- Scenarios now use `- name: scenario_name` instead of `scenario_name:` keys
- Updated `loadScenarios()` to expect array format with validation

## 2025-12-01

- Added `ParseError` class for retryable parsing failures
- Added retry logic to `Evaluator.evaluate()` for `ParseError` (2 retries)
- Updated `JudgeEvaluator` to throw `ParseError` on JSON parse failures

## 2025-12-01

- Changed `RecallEvaluator` to use `MemoryIndex` directly instead of memory
  client
- Constructor now accepts `storage` instead of `memoryClient`
- Retrieves subjects from `identifier.subjects` field via `queryItems()`

## 2025-11-30

- Updated evaluators to use new memory window interface returning
  `{messages, tools}`
- Simplified stream handling with async iteration for message assembly

## 2025-01-29

- Renamed `CriteriaEvaluator` to `JudgeEvaluator` for clearer naming
- Added configurable `judge_model` parameter for judge evaluations
- `JudgeEvaluator` now requires explicit model in constructor

## 2025-11-24

- Bump version

## 2025-11-22

- Bump version
- Bump version

## 2025-11-19

- Bump version
- Bump version

## 2025-11-18

- Bump version

## 2025-11-17

- Bump version
- Changed `EvaluationIndex` to extend `BufferedIndex` instead of `IndexBase` for
  efficient parallel writes during evaluation runs
- Added buffer configuration parameters (`flush_interval`, `max_buffer_size`) to
  `EvaluationIndex` constructor
- Added `shutdown()` call in `bin/eval.js` to flush remaining buffered results
  at end of evaluation run
- Optimized `CriteriaEvaluator` to run single judge prompt for all criteria
  instead of separate prompts per criterion
- Updated `criteria.md.mustache` prompt to return structured JSON with per-
  criteria results keyed by numeric index
- Changed JSON response format to use numeric indices (0, 1, 2...) instead of
  free-text labels for robust parsing
- Changed prompt format to expect JSON object with keys `passed` (boolean) and
  `judgement` (string) for each criterion
- Added JSON parsing and validation in `evaluate()` method with index-based
  lookup

## 2025-11-16

- Updated terminology throughout codebase: replaced "test/testing" with
  "evaluate/evaluation" in all documentation and code comments
- Renamed "case/cases" to "scenario/scenarios" throughout the package to better
  reflect evaluation semantics
- Simplified variable and method naming: changed `caseId` to `scenario`,
  `getByCaseId()` to `getByScenario()`, `getAllCaseIds()` to `getAllScenarios()`
- Updated result objects to use `scenario` field instead of `caseId`
- Updated CLI argument from `--case` to `--scenario` in `bin/eval.js`
- Updated template files to use scenario terminology
- Updated all evaluators (`CriteriaEvaluator`, `RecallEvaluator`,
  `TraceEvaluator`) to use scenario parameters
- Updated `EvaluationReporter` methods from `generateCaseReport()` to
  `generateScenarioReport()`
- Updated `EvaluationIndex` methods to use scenario terminology

## 2025-11-13

- **BREAKING**: Separated evaluation execution from reporting with new
  `EvaluationIndex` for persistent result storage
- Added `EvaluationReporter` class with memory integration for comprehensive
  case reports including conversation context
- Enhanced `CriteriaEvaluator` with template-based prompts and improved verdict
  parsing for robust LLM-as-a-judge evaluation
- Simplified to recall-only metrics (removed precision) with 100% recall
  requirement for all test cases

## 2025-11-08

- Removed `EvaluationResult` class entirely for simplification
- Updated all evaluators to return results with `evaluations` array already
  formatted for reporters
- Modified `Evaluator.evaluate()` to return plain array instead of
  `EvaluationResult` instance
- Updated `TapReporter` and `MarkdownReporter` to work directly with results
  arrays
- Moved statistics calculation into reporter methods instead of separate class
- Eliminated data reformatting layer between evaluators and reporters
- Simplified `RetrievalEvaluator` to `RecallEvaluator` measuring only recall
  metric
- Renamed class from `RetrievalEvaluator` to `RecallEvaluator` across all files
- Removed `min_recall` and `min_precision` configuration parameters
- Updated evaluation to require all `true_subjects` to be found (100% recall)
- Changed result type from `"retrieval"` to `"recall"` in evaluation results
- Removed precision metric calculation and reporting
- Simplified result structure to include only `found` and `missing` subject
  arrays
- Updated all test cases in `config/eval.yml` and `config/eval.example.yml` to
  remove threshold parameters
- Updated evaluation instructions documentation to reflect recall-only
  evaluation

## 2025-11-03

- Renamed `conversationId` to `resourceId` across all `libeval` code for
  consistency with terminology changes
- Updated `retrieval.js` to reference "resource memory" instead of "conversation
  memory" in comments
- Changed `allocation.conversation` to `allocation.resource` in memory window
  requests
- Updated `tap.js` to use `resource_id` in TAP output instead of
  `conversation_id`
- Updated mustache template to display "Resource" instead of "Conversation" in
  markdown reports
- Updated all test files to use `resourceId` property
- Updated `CHANGELOG` references from "conversation resource_id" to "resource
  resource_id"

## 2025-11-03

- Refactored `getDiagnostics()` to return fully symmetrical pass/fail arrays
  with consistent item structure
- All diagnostic items now have consistent properties: `label`, `value`,
  `threshold`, `details`, `message`
- Criteria items use `label: "judgment"` with `message` property
- Retrieval items use `label: "recall"` or `"precision"` with `value`,
  `threshold`, and optional `details` array
- Trace items use `label: "check"` with `value` (command name) and `message`
  (output/error)
- Simplified `TapReporter` to iterate over fail items array with consistent
  rendering logic
- Updated mustache template to render pass/fail items uniformly without
  type-specific conditionals
- Removed `isCriteria`, `isRetrieval`, `isTrace` boolean flags as they are no
  longer needed
- Updated all tests to match new symmetrical array structure

## 2025-11-03

- Added `getDiagnostics()` method to `EvaluationResult` to centralize
  diagnostics logic for all reporter implementations
- `getDiagnostics()` returns structured pass/fail data for criteria, retrieval,
  and trace evaluation types
- Added `isCriteria`, `isRetrieval`, and `isTrace` boolean flags to diagnostics
  object for easier mustache template conditionals
- Updated `TapReporter` to use centralized `getDiagnostics()` method and only
  display fail data for failing test cases
- Updated `MarkdownReporter` to use centralized `getDiagnostics()` method and
  display both pass and fail data for all test cases
- Updated mustache template to show pass/fail diagnostics with proper
  conditional rendering based on evaluation type
- Added comprehensive tests for `getDiagnostics()` method covering all
  evaluation types and scenarios

## 2025-11-03

- Renamed `query` field to `prompt` in all evaluation test cases throughout
  `config/eval.yml` and `config/eval.example.yml`
- Updated all `libeval` code to use `prompt` instead of `query` in test case
  objects
- Changed `CriteriaEvaluator`, `RetrievalEvaluator`, and `TraceEvaluator` to use
  `testCase.prompt` field
- Updated TAP reporter and Markdown template to display "Prompt" instead of
  "Query"
- Updated test files to use `prompt` field in test data
- Updated evaluation instructions documentation to reference `prompt` field

## 2025-11-03

- Created `EvaluationResult` class to encapsulate test results with a clean,
  generic interface for reporters
- Added `ReporterInterface` JSDoc typedef defining contract for all reporter
  implementations
- Implemented `TapReporter` for TAP (Test Anything Protocol) format output
  matching `node --test` style
- Implemented `MarkdownReporter` using mustache templates to generate fixed
  `results.md` file
- Created `templates/results.md.mustache` template for markdown report
  generation
- Updated `Evaluator.evaluate()` to return `EvaluationResult` instead of plain
  array
- Removed deprecated `ReportGenerator` class and `report()` method from
  `Evaluator`
- `TapReporter` provides console output with TAP version, test plan, individual
  results, and summary
- `MarkdownReporter` writes comprehensive report to `data/eval/results.md` with
  summary statistics and debugging info
- `EvaluationResult` provides methods: `getStats()`, `getByType()`,
  `getFailed()`, `getPassed()`, `getTestCase()`, `toArray()`
- Evaluation binary now exits with code 1 if any tests fail, 0 if all pass
- Removed backward compatibility code - only current API remains

## 2025-11-02

- Fixed `TraceEvaluator` to use correct `trace.QueryRequest` type instead of
  non-existent `trace.QuerySpansRequest`
- Removed `limit` parameter from trace queries as it's not supported in the
  `QueryRequest` proto definition
- Updated test suite to match current `Evaluator` constructor signature with
  `memoryClient`, `traceClient`, and evaluator dependencies
- Added `report()` method to `Evaluator` class for generating evaluation reports
  via `ReportGenerator`
- All `libeval` tests now pass successfully
- Updated `TraceEvaluator` to query spans by `resource_id` instead of `trace_id`
- Fixed trace evaluation to work with new per-trace-ID storage model
- Evaluator now correctly queries across all traces for a given resource
  resource_id

## 2025-11-01

- Simplified `RetrievalEvaluator` to use standard recall and precision metrics
  as minimum thresholds
- Added `min_recall` parameter: minimum fraction of true_subjects that must be
  retrieved (default 1.0)
- Added `min_precision` parameter: minimum fraction of retrieved items that must
  be relevant (default 0.0)
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
- Added `TraceEvaluator` for trace analysis using `jq` command execution on span
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
