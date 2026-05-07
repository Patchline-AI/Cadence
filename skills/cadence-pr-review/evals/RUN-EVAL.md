# Running the eval

1. Open Claude Code in the Cadence repo.
2. In Claude Code, ask: `Use cadence-pr-review on the files in evals/sample-pr/ against evals/expected-findings.md`.
3. Compare the produced report against `evals/expected-findings.md`.
4. The report MUST flag all 5 findings (3 BLOCKERS, 2 FLAGS) with the same severity. If any is missed, the skill needs tightening.
