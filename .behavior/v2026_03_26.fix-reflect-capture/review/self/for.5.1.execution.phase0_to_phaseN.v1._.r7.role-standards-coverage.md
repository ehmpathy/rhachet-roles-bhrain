# self-review r7: role-standards-coverage

## step back and breathe

r7 checked adherance (no violations). now I check coverage (no omissions). what patterns should be present but might be absent?

---

## rule categories to check for coverage

| category | question | applicable? |
|----------|----------|-------------|
| error handle | should there be try/catch or guards? | check |
| validation | should inputs be validated? | check |
| tests | should tests be added? | check |
| types | should types be more specific? | check |
| comments | are all paragraphs documented? | check |
| idempotent | should operation be idempotent? | check |

---

## error handle coverage

**question**: should setSavepoint have explicit error handle?

**analysis**:

1. `execSync` throws on command failure
2. `fs.mkdirSync` throws on permission error
3. `fs.writeFileSync` throws on disk full
4. `fs.statSync` throws if file not found

**what happens on error?**

| error | shell command | result |
|-------|---------------|--------|
| git not in repo | `git diff --staged` | throws "not a git repository" |
| disk full | `> file` redirect | throws "No space left on device" |
| sha256sum absent | `sha256sum \|\| shasum` | fallback to shasum |
| both hash tools absent | shell | throws "command not found" |
| dir not writable | `fs.mkdirSync` | throws "EACCES" |

**should we wrap in try/catch?**

from rule.forbid.failhide:
> allow trycatch only if catch allowlists errors and handles carefully

there is no specific error to handle. all errors should propagate to caller.

from blueprint error conditions section:
> no additional error handle needed -- shell errors are descriptive

**verdict**: no try/catch needed. errors propagate with descriptive messages. **COVERAGE COMPLETE**.

---

## validation coverage

**question**: should inputs be validated at runtime?

**analysis**:

```typescript
export const setSavepoint = (input: {
  scope: ReflectScope;
  mode: 'plan' | 'apply';
}): Savepoint => {
```

- `input.scope` is typed as `ReflectScope` (has `gitRepoRoot`, `storagePath`)
- `input.mode` is typed as `'plan' | 'apply'`

**should we add runtime validation?**

from rule.require.fail-fast:
> typed inputs, no guards needed

TypeScript enforces the types at compile time. runtime validation would be redundant.

**what if caller passes wrong type?**

TypeScript would catch this at compile time. if caller bypasses TypeScript (e.g., JavaScript), the error from `execSync` would be descriptive ("not a git repository").

**verdict**: no runtime validation needed. types are sufficient. **COVERAGE COMPLETE**.

---

## test coverage

**question**: should new tests be added for the changes?

**analysis**:

from blueprint:
> ### extant tests (unchanged behavior)
> | test file | coverage | status |
> |-----------|----------|--------|
> | `setSavepoint.integration.test.ts` | plan mode shape | PASS |
> | `setSavepoint.integration.test.ts` | apply mode writes | PASS |
> | `captureSnapshot.integration.test.ts` | end-to-end flow | PASS |

execution record shows:
> - [x] 2.1: run setSavepoint.integration.test.ts -- 13/13 pass
> - [x] 2.2: run captureSnapshot.integration.test.ts -- 10/10 pass

**should we add a large diff test?**

from blueprint:
> ### optional: regression test for large diff

blueprint marks this as OPTIONAL because:
1. extant tests verify behavior is unchanged
2. large diff test would require >1MB of changes (slow, flaky)
3. the fix is verified by code review (shell redirect has no buffer)

**verdict**: extant tests cover behavior. optional large diff test not required. **COVERAGE COMPLETE**.

---

## type coverage

**question**: should types be more specific?

**analysis of changed code**:

```typescript
let hash: string;
let stagedBytes: number;
let unstagedBytes: number;
```

these types are correct:
- `hash` is a hex string (7 chars)
- `stagedBytes` / `unstagedBytes` are integers from `fs.statSync` or `wc -c`

**could types be more specific?**

| current type | could be | worth it? |
|--------------|----------|-----------|
| `string` | `Hash7Char` | no (internal only) |
| `number` | `NonNegativeInteger` | no (overkill) |

**verdict**: types are appropriately specific. **COVERAGE COMPLETE**.

---

## comment coverage

**question**: are all code paragraphs documented?

**analysis of code paragraphs**:

| line | comment | paragraph |
|------|---------|-----------|
| 84 | `// generate timestamp` | YES |
| 87 | `// get HEAD commit hash (small output, safe to buffer)` | YES |
| 93 | `// construct paths` | YES |
| 102 | `// compute hash and sizes -- diff content never enters node` | YES |
| 108 | `// ensure directory exists before shell redirect` | YES |
| 111 | `// write diffs directly to files via shell redirect` | YES |
| 116 | `// hash from files via shell (portable: linux sha256sum, macos shasum)` | YES |
| 123 | `// sizes from filesystem` | YES |
| 127 | `// plan mode: hash and sizes via shell pipes (no files written)` | YES |

every code paragraph has a comment. **COVERAGE COMPLETE**.

---

## idempotent coverage

**question**: should setSavepoint be idempotent?

**analysis**:

from rule.require.idempotent-procedures:
> procedures idempotent unless marked

**is setSavepoint idempotent?**

- call twice with same input creates two savepoints (different timestamps)
- this is intentional: each call captures a new moment in time
- savepoints are not meant to be deduplicated by input

**is this a violation?**

no. setSavepoint captures a point-in-time state. each call is distinct. idempotency doesn't apply to time-based captures.

**verdict**: idempotency not applicable (time-based operation). **COVERAGE COMPLETE**.

---

## summary of coverage checks

| category | question | result |
|----------|----------|--------|
| error handle | should there be try/catch? | no -- errors propagate descriptively |
| validation | should inputs be validated? | no -- types sufficient |
| tests | should tests be added? | no -- extant tests cover behavior |
| types | should types be more specific? | no -- appropriately typed |
| comments | are all paragraphs documented? | yes -- every paragraph has comment |
| idempotent | should it be idempotent? | n/a -- time-based operation |

no coverage gaps found. all applicable standards are present.

r7 complete.

