# Sample PR fixture

This directory contains deliberately-bad code that exercises all 5 findings in `../expected-findings.md`. Use it to calibrate or smoke-test a `cadence-pr-review` install.

## How to run the eval

In Claude Code, from any directory:

> Use cadence-pr-review on the files in `<path-to-this-fixture>` against `<path-to-expected-findings.md>`.

The model should produce a report flagging all 5 findings (3 BLOCKERS, 2 FLAGS) in expected-findings.md. If any are missed, the install or the model harness needs tightening.

## Files

- `route.ts` — fictional API route with concurrency, observability, and item-shape issues
- `route.test.ts` — inadequate happy-path-only test
