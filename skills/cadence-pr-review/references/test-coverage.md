# Standard 5: Test Coverage Assessment

> "Do the tests prove behavior or just prove intent?"

## Hard rules

### No mocks for data
- Integration/system tests must hit real APIs (localhost:3000 or production), real S3, real DynamoDB, real upstream services.
- Real-data fixtures from your test-asset directory.
- Use your codebase's canonical test user.
- Search for violations: `git diff origin/main...HEAD | grep -E 'jest\.mock|vi\.mock' -A 3` — review each one. Mocking the AWS SDK in a system test is a violation.

### Test files must be enrolled
- Any new test file must be in your test-suite-map OR a feature-map bundle, otherwise the quality-pipeline won't run it.
- Check enrollment:
  ```bash
  for f in $(git diff origin/main...HEAD --name-only | grep -E '\.(test|spec)\.(ts|tsx|js|mjs)$'); do
    if grep -q "$f" <test-suite-map-file> <feature-map-file>; then
      echo "ENROLLED: $f"
    else
      echo "MISSING: $f — add to your test-suite-map or feature-map"
    fi
  done
  ```

### Bug fixes need regression tests
- Any PR labeled bug-fix or touching user-facing behavior or data writes MUST include a test that would have caught the bug.
- Counter-example test (the bug repro) is non-negotiable for incidents tracked in your codebase's drift log.
- Reference: a 2026 concurrent-write incident shipped `expectedUpdatedAt` PLUS a regression test capturing the repro.

### Failure-mode coverage
- Tests should exercise the failure mode, not just the happy path.
- For any concurrent-write surface, the failure mode is "two callers race the write → state lost". A test that only covers the single-caller happy path is insufficient.

### Layered-but-not-composed gap (May 2026 field test)
- When a feature has two layers (e.g. route → engine → service) and BOTH layers are tested individually with the OTHER layer mocked, that's an **untested composition contract**. Either layer can change its return shape without breaking either layer's own tests, but the composed behavior at runtime breaks.
- Reference case: an engine test mocked `validateStoredManifestForAsset` to assert the engine routes to it; the manifest service test tested the function in isolation. Neither test asserted that `validateStoredManifestForAsset` returns the shape the engine expects. The original "tier unreachable" regression risk persisted.
- Detection: for any new module with `subjectUnderTest.fn(mockedDep)` AND a separate test of `mockedDep.fn(...)` directly, require ONE integration test that composes both with real implementations.

### Public-endpoint magic-byte / pre-auth path coverage (May 2026 field test)
- If the route adds a magic-byte check, MIME validation, content-length pre-check, or any pre-auth gate, that gate **must be unit-tested directly** — not just via the integration runner.
- Integration runners often hit the first gate (e.g. MIME) and never reach later gates (e.g. magic-byte) — failed integration test = the route is *more* permissive than the integration test, not less.
- Required test cases for any audio-upload public endpoint: `audio/mpeg` MIME + bad bytes → 415; `audio/wav` + RIFF-only-no-WAVE → 415; `application/octet-stream` + valid signature → 200; oversized content-length → 413 BEFORE body parse.

### Mismatched-field / cross-reference branches
- For any route that takes both an entity ID AND a denormalized field (e.g. `body.assetId` AND `body.userId`), the **mismatch path** must be tested. Reference (May 2026 field test): a vault notify route returns 409 when `body.userId !== asset.userId` — the original PR shipped without that test, the security-auditor caught it.

## Soft rules (FLAG)

### Test file naming
- `__tests__/<feature>.test.ts` for component/feature tests.
- `app/api/.../route.test.ts` co-located for API routes.
- `lib/.../*.test.ts` co-located for library code.

### Multiple test runners
- If your codebase uses multiple test runners, mismatched runner = silent skip — flag it.

## What this standard does NOT enforce

- Coverage percentage thresholds (out of scope; we measure behavior, not lines).
- E2E for every feature (Playwright is for high-trust flows; not every code change needs one).
