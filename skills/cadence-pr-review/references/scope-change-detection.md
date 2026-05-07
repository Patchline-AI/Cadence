# Scope-Change Detection + Agent-Summary Trust-But-Verify

> _When another agent (Codex, etc.) finishes
> work and pastes a completion summary, the drill below is mandatory — the agent's
> "I addressed your findings and pushed" is **a claim**, not evidence._

## Why this exists

In a recurring failure mode, the agent's summary says *"addressed the only architecture flag by adding a short comment."* The actual delta from the prior baseline can be **+2,500 lines / 33 files changed** — the branch may have absorbed an unrelated PR and a thousand+ lines of dependency-lock churn. Without the scope-change check, the second-round review would have re-rubber-stamped the original verdict on a branch that actually has hidden blockers in newly-introduced surface.

## The drill — when an agent pastes a completion summary

Run these checks **in this order** before re-running any review:

### 1. Trust the structured ops markers, verify the claims

Codex / Claude Code / similar agents emit ops markers like:
```
::git-stage{cwd="..."}
::git-commit{cwd="..."}
::git-push{cwd="...", branch="..."}
::git-create-pr{url="...", isDraft=true}
```

Take these as having happened (the runtime executed the operations). Do **not** take "tests passed" or "X addressed" at face value. The ops markers are an audit trail of what tools fired; the natural-language summary is the agent's interpretation of results.

### 2. Run the scope-change check

Compare the current branch tip against the commit you originally reviewed:

```bash
git fetch origin
ORIG_TIP=<the commit hash from your prior review>      # e.g. 964e7d81
NEW_TIP=origin/<branch>                                 # e.g. origin/codex/<branch>

# What commits are new since your review?
git log --oneline $ORIG_TIP..$NEW_TIP

# What files changed since your review (delta, not full PR)?
git diff --stat $ORIG_TIP $NEW_TIP

# Did a different feature scope sneak in?
git diff --name-only $ORIG_TIP $NEW_TIP | head -30
```

**Decision rule:**

| Delta indicator | Implication |
|---|---|
| 0–5 commits, all matching the original feature | Re-review delta only. Likely just feedback addressed. |
| 1–10 files changed, ≤500 lines | Re-review delta only. Standards-based pass on touched files. |
| **5+ commits, any from a different feature scope, OR 500+ added lines** | **Full specialist trio dispatch on the delta.** Scope grew. |
| **Commit message mentions "(#N)" of an absorbed PR** | **Full specialist trio.** PR has absorbed another PR; trust boundary changed. |
| Files outside the original PR's intent (e.g. `lib/admin-*` when the PR was supposed to be about `lib/vault/*`) | **Full specialist trio.** Scope crept. |

### 3. Verify each claim, in order

For each natural-language claim in the agent's summary, run the verification command:

| Agent claim | Verification command |
|---|---|
| "PR #N is clean / mergeable" | `gh pr view N --json mergeStateStatus,isDraft,headRefName,baseRefName` |
| "PR #M closed with superseded-by" | `gh pr view M --json state,closedAt,comments` |
| "Architecture flag addressed" | `git show $NEW_TIP -- <the-file-from-the-flag> \| grep -A 5 -B 5 <expected-fix-pattern>` |
| "X tests passed" | Re-run the same command. "X passed" without runner output is just a string. |
| "Pre-existing failure, not <feature>-related" | `git log -- <failing-file> \| head -3` to confirm it predates this branch. |
| "Conflict resolved" | `git grep -nE '^(<{7}\|>{7}\|={7}\$)'` strict regex (avoids decorative banners) |

### 4. Re-run claimed gates locally

Don't trust pass-counts. Re-run the same suites the agent claims passed. Minimum:
```bash
pnpm test:unit                        # if claimed
python -m pytest <files> -k <selector> -v  # if claimed
npx tsx <integration-runner>          # if claimed
```

Compare the local result count to what the agent reported. Discrepancies (e.g. agent reported "22 passed" but local shows 12) usually mean a `-k` selector narrowed the run. Verify the selector wasn't dropping coverage.

### 5. Decide

After the scope-change check + claim verification:

- **Ship it** — delta is small, all claims verified, no scope creep, original blocker/flag list addressed. Mark draft → ready, give merge command.
- **One-round re-review on the delta** — scope grew within the same feature, dispatch standards-only on the new files (no specialist trio if delta < 5 files / < 500 lines).
- **Full specialist trio re-dispatch** — scope grew across feature boundaries OR an absorbed PR brought new attack surface (admin auth, Lambda code, public endpoint). The trio runs in parallel for ~5 min; cheap insurance.
- **Hold** — claim verification failed. Surface the discrepancy to the user before any review.

## What you do NOT do

- **Don't re-review the entire baseline.** The flag/blocker call you made on the prior commit stands; only the delta matters.
- **Don't trust pass-counts blindly.** "58 passed" without seeing the runner output is just a string. Re-run if the count matters for the decision.
- **Don't skip the merge-state check** just because the agent said "CLEAN." `mergeStateStatus` can flip between report and read; pull it fresh from `gh pr view`.
- **Don't accept "scope didn't grow" without checking.** Agents sometimes describe absorbed PRs as a small comment. Always run the scope-change check.

## Reference case (May 2026 field test)

An agent's completion summary said: *"Addressed the only architecture flag by adding a short comment in `<service-file>`."*

Reality, surfaced by the scope-change check:
- 7 new commits on top of the original review baseline.
- One commit was a merge of an entirely separate PR (different feature scope), bringing 416 new lines in a route handler, 272 lines in a service module, 333 lines in an admin-auth module, plus a new feedback file and a 190-line admin step-up session module.
- 1,167 lines of dependency-lock churn — verified to be the transitive tree of one new package, legitimate.

The architecture comment was real; the rest was not in the summary. Without the scope-change check, the second-round review would have shipped this with **4 BLOCKERS and 16 FLAGS** the parallel specialist trio caught on the new admin-auth surface (see `specialist-trio.md`).

## Operating rule

**Every time an agent hands you a completion summary, run steps 1–5. The drill takes 2 minutes; the alternative is shipping the agent's interpretation as truth.**
