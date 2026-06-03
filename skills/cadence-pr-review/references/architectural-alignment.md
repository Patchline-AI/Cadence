# Standard 4: Architectural Alignment

> "Does this move toward the target architecture or away from it?"

_Commands below show `origin/main` as the common default. Substitute `origin/$BASE` — the PR's actual base, resolved in the SKILL's Step -1. Never assume `main`._

## Naming patterns (FLAG on divergence)

- Service files: follow the codebase's existing service-file naming + singleton convention; deviation is a flag.
- Stores: follow the codebase's store-file naming.
- Hooks: `use-kebab-case.ts`.
- Type/Interface: `PascalCase` (e.g. `Asset`, `ReleaseRow`).
- Env var: `SCREAMING_SNAKE_CASE`, `NEXT_PUBLIC_` for client.

## Asset / project state writes

A recurring incident class locks in this convention:

1. **Prefer `UpdateCommand` with explicit `SET <fields>`** for any mutation on hot tables. Reference: the optimistic-concurrency reference impl in your codebase.
2. **Per-item failure semantics**: when iterating multi-item operations (attach-items, batch upload), collect per-item skips/errors and return them in the response. Don't let one bad item collapse the whole batch to a generic 500.
3. **Lean record refs**: don't embed full nested metadata blobs in every record entry. Item size on hot tables matters (400KB DynamoDB limit). Store the heavy blobs on a side table and reference by id.
4. **Preserve user-selected order**: multi-item attach must respect the order the user selected, not iteration order.

## Lambda + container conventions

- Lambda deploys: follow the codebase's deploy script conventions; misuse is a flag.
- Verify the container entrypoint matches the deploy target; mismatched CMD is a deploy-stale trap.
- Adding a new Lambda: update your function registry, add handler, add agent choice in argparser, document in your build-scripts doc in the same PR.

## Brand system

- Use the codebase's design-token / brand-constants module, never raw hex.
- Search: `git diff origin/main...HEAD --unified=0 | grep -E '#[0-9a-fA-F]{6}\b' | grep -v <your-brand-module-path>`

## Catalog / asset architecture

- Follow the codebase's primary-store + fallback hierarchy.
- Lowercase index names where required by your DynamoDB index conventions — `GSI1` returns ValidationException in some configurations.
- Cover-art / fallback images: use the standard fallback module in your codebase.
- OpenSearch/AOSS: no explicit `_id` in index ops; deduplicate by `docId`.

## When to FLAG vs BLOCK

- BLOCKER: violations of the asset/project state-write rules (those caused the incident).
- BLOCKER: container CMD wrong, Lambda action `deploy` on existing function.
- FLAG: naming pattern divergence (might be intentional, e.g. legacy file).
- FLAG: raw hex in non-brand files (might be a one-off in a marketing doc).
- NOTE: file in a non-standard location (might just be early-stage).
