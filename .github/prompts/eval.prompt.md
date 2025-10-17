# Evaluation Execution Prompt

Run ALL evaluation scenarios defined in `eval/EVAL.md`.

For each scenario:

1. Execute the specified test prompts exactly.
2. Determine `PASS` or `FAIL` against the listed Success Criteria.
3. If `FAIL`, immediately inspect `data/dev.log` and append a Failure Diagnostic
   block (Prompt, Root Cause, Key Log Lines, Remediation, Retest Status) per the
   EVAL.md instructions.
4. Summarize overall results with a PASS/FAIL line per scenario.

Output only:

- Scenario result sections (in order 1..7)
- Any Failure Diagnostic sections (only if failures)
- Final concise summary table.

Do NOT regenerate content; only evaluate existing data.
