# The four moves — executable command set

> The four moves are a practice, not a vibe. Each one has commands. Run them.

This is the long form of the "Executable moves" section in the SKILL. Adapt
paths/tools to your stack (`rg` ↔ `grep -rn`, `gh` optional, language flags).

## Move 1 — Map the system

Goal: a correct mental model of the boundary *before* you form an opinion.

```bash
# What's inside the boundary?
git ls-files <subsystem-path>

# The public surface — what other code can call.
rg -n "export (async )?function|export class|export const|^def |^class " <subsystem-path>

# Entry points / wiring.
rg -n "route|handler|main\(|app\.(get|post|put|delete)|@app\.|addEventListener" <subsystem-path>

# Config and env it depends on.
rg -n "process\.env\.|os\.environ|getenv" <subsystem-path>
```

Output: state the architecture back in 3–5 sentences. If you can't, you haven't mapped it yet.

## Move 2 — Inspect the history

Goal: don't repeat a mistake that already has a gravestone.

```bash
git log --oneline -20 -- <path>                       # recent churn
git log -p --follow <file> | head -300                # how the file got its shape
git blame -L <start>,<end> <file>                     # who/why on the exact lines
git log --oneline --all --grep "<subsystem keyword>"  # related commits anywhere

# Prior attempts — INCLUDING closed/reverted PRs (the highest signal).
gh pr list --search "<path>" --state all --limit 20
gh pr list --search "revert <subsystem>" --state all

# Incident memory.
rg -n "<subsystem>" CLAUDE.md AGENTS.md ADR* docs/postmortems docs/decisions 2>/dev/null
```

If you find a revert or a postmortem touching this code: **read it fully** and record the lesson in the artifact. That is the cheapest bug you'll ever not ship.

## Move 3 — Find the seams + blast radius

Goal: enumerate every boundary where assumptions change hands, and everyone a change touches.

Seam checklist (write a line per seam found):

| Seam type | How to find it | The question to answer |
|---|---|---|
| Trust boundary | `rg -n "request\.\|req\.body\|params\|getCurrentUser\|verify\|jwt"` | Where does untrusted input become trusted? |
| Ownership boundary | who writes which field on the row/table | Can two writers race the same field? |
| Integration point | `rg -n "fetch\(\|axios\|boto3\|new .*Client\(\|urlopen\|http"` | What's the failure mode when it's down/slow? |
| Behavior-encoding tests | `git ls-files '**/*.test.*' '**/*_test.*' '**/test_*'` near the path | What do existing tests already guarantee? |
| Invariant | `rg -n "assert\|invariant\|must\|ConditionExpression\|UNIQUE\|idempot"` | What breaks if a step retries or runs twice? |

Blast radius (always):

```bash
rg -n "<symbolName>" --type ts --type tsx --type py     # call sites
rg -n "import .*<module>|from .*<module>|require\(.*<module>" # importers
```

Record: "changing X touches A, B, C." A change is its blast radius, not its diff.

## Move 4 — Produce the artifact

Goal: a written memo the human and agent both work from. Use
`research-artifact-template.md`. Save to `.planning/research/<task-slug>.md`
(or your team's location). Throwaway diagrams are fine; the **memo is not
throwaway** — it carries into the PR description and feeds the gate.
