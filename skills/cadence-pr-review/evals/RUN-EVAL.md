# Running the eval

1. Open Claude Code in the Cadence repo.
2. Run: `/cadence-pr-review evals/sample-pr.diff`
3. Compare the produced report against `evals/expected-findings.md`.
4. The report MUST flag all 5 findings with the same severity. If any is missed, the skill needs tightening.
