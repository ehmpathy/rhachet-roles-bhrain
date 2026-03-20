# self-review r2: has-questioned-assumptions

## pause

i am the reviewer, not the author.

i re-read the blueprint and questioned the technical assumptions more deeply than r1.

r1 verified assumptions hold in the happy path. r2 digs into edge cases, failure modes, and what evidence we lack.

---

## assumption 1: ROUTE_DIR is always a simple path

**the assumption**: `ROUTE_DIR` derived from bind flag location will be a simple relative path without special characters that break regex or shell expansion.

**what evidence do we have?** none explicit. we assume name conventions.

**counterexamples to consider**:

| ROUTE_DIR value | problem |
|-----------------|---------|
| `.route/v2026.03.19.fix` | dots in regex match any char — overmatch, safe |
| `.route/feat/auth` | slashes — valid, grep handles |
| `.route/fix[1]` | brackets in regex — character class! |
| `.route/fix$var` | dollar sign — shell expansion |
| `.route/fix(parens)` | parentheses — regex group |

**the real risk**: if ROUTE_DIR contains `[`, `]`, `(`, `)`, `*`, `+`, `?`, or `$`, the regex becomes malformed or matches wrong paths.

**evidence check**:
- bind flag creation uses `sanitizeBranchName.ts` which converts special chars to `-`
- route directories follow name convention `v{date}.{slug}`
- slug is derived from sanitized branch name

**conclusion**: the assumption holds because upstream sanitization prevents special chars. but the blueprint should note this dependency.

**issue found?** soft issue — document the sanitization dependency.

---

## assumption 2: path comparison works for symlinked routes

**the assumption**: when a route is accessed via symlink, the guard correctly identifies paths within it.

**what if symlinks are involved?**

scenario:
```
.route/current -> .route/v2026_03_19.declapract.upgrade/
```

if driver writes to `.route/current/artifact.md`:
- `FILE_PATH` = `.route/current/artifact.md`
- `ROUTE_DIR` = `.route/v2026_03_19.declapract.upgrade` (from bind flag)
- `grep -qE "^${ROUTE_DIR}/\.route/"` checks for `.route/v2026_03_19.declapract.upgrade/.route/`
- `.route/current/artifact.md` does NOT contain that prefix
- artifact is NOT blocked → but is it ALLOWED?

**deeper check**: the guard only blocks matches. non-matches exit 0. so symlinked access would be allowed.

**is that correct?** it depends on whether we want to protect routes accessed via symlink aliases.

**evidence check**: no symlink usage pattern in extant code. routes are accessed via direct paths.

**conclusion**: symlinks are out of scope. the guard operates on literal paths, not resolved paths. this is consistent with how git and the file system work.

**issue found?** none — symlinks are out of scope, and the behavior (allow non-matched paths) is correct.

---

## assumption 3: the guard evaluates patterns in correct order

**the assumption**: stone/guard patterns are checked before .route/ pattern, so a path that matches both is correctly categorized.

**counterexample to consider**:

what if someone creates `.route/xyz/.route/passage.stone`?

- matches `*.stone` → blocked with reason `*.stone`
- matches `^$ROUTE_DIR/\.route/` → blocked with reason `.route/**`

**which wins?** the code checks in order:
1. `*.stone` (line ~156)
2. `*.guard` (line ~159)
3. `.route/` (line ~162)

first match wins. so `.route/xyz/.route/passage.stone` → blocked as `*.stone`.

**is this correct?** yes — more specific pattern (stone) takes precedence over location pattern.

**evidence check**: read guard code, confirm order.

**conclusion**: pattern order is correct. no issue.

---

## assumption 4: bash command path extraction is sufficient

**the assumption**: the regex `[^ \"']+\.route/[^ \"']*` extracts paths from bash commands well enough to check protection.

**counterexamples r1 noted but dismissed**:
- quoted paths: `cat ".route/xyz/artifact.md"` — regex expects unquoted
- paths with equals: `VAR=.route/xyz/f.txt cat $VAR` — regex misses assignment

**deeper analysis**:

the extant behavior for bash commands:
1. check if command CONTAINS `.route/` anywhere
2. if yes, extract first path-like segment
3. check if extracted path is in protected location

**what the fix changes**:
- step 3: check if extracted path starts with `$ROUTE_DIR/.route/`

**the extraction is imprecise, but the fix only changes step 3**. extraction issues are pre-extant.

**new risk from fix?** if extraction extracts wrong path, we might:
- block when we should allow (false positive — safe)
- allow when we should block (false negative — unsafe)

**false negative scenario**:
```bash
cat .route/xyz/safe.md .route/xyz/.route/passage.jsonl
```
extant extraction gets `.route/xyz/safe.md` (first match).
check: does `.route/xyz/safe.md` start with `.route/xyz/.route/`? no.
result: ALLOWED.
but the command ALSO touches `.route/xyz/.route/passage.jsonl`!

**is this new?** no — extant code has the same issue. it only checks the first path.

**conclusion**: extraction imprecision is extant. the fix does not make it worse. but this is a known limitation.

**issue found?** pre-extant limitation, not introduced by fix. out of scope.

---

## assumption 5: blocker path change has no runtime consumers

**the assumption**: no code reads blockers from `$route/.route/blocker/` at runtime, so the path change is safe.

**evidence check**: i searched in research phase. results:
- `getBlockedChallengeDecision.ts` generates path
- test files assert on path
- no runtime code reads from that path

**deeper question**: what about blockers already written to old location?

**scenario**: a route from before the fix has blockers at `$route/.route/blocker/1.design.md`. after the fix, new blockers go to `$route/blocker/1.design.md`. old blockers are orphaned.

**impact**: old blockers are not displayed/read, but they also don't break anything. they sit inert.

**is migration needed?** no — blockers are informational artifacts. orphaned ones are harmless. human can manually move if needed.

**conclusion**: assumption holds. no runtime consumers. orphaned blockers are harmless.

---

## assumption 6: the fix is backwards compatible for .behavior/ routes

**the assumption**: routes at `.behavior/xyz/` continue to work identically after the fix.

**trace through**:

given ROUTE_DIR=`.behavior/xyz`:
- artifact write to `.behavior/xyz/artifact.md`
  - does NOT match `^.behavior/xyz/\.route/` → allowed ✓
- metadata write to `.behavior/xyz/.route/passage.jsonl`
  - DOES match `^.behavior/xyz/\.route/` → blocked ✓

**edge case**: what if ROUTE_DIR is `.behavior/xyz` but path is `.behavior/xyz2/artifact.md`?

- `.behavior/xyz2/artifact.md` does NOT match `^.behavior/xyz/\.route/` → allowed
- but wait — should it be allowed? it's not the bound route!

**deeper check**: the guard only BLOCKS matches. it doesn't ALLOW non-matches in the sense of a grant — it just exits 0 (no block). the user still needs write permission via other means.

the guard is not an allowlist, it's a blocklist. non-matches are "not blocked by this guard" not "allowed by this guard".

**conclusion**: backwards compatible. the guard's blocklist semantics are unchanged.

---

## assumption 7: relative path comparison is correct

**the assumption**: FILE_PATH and ROUTE_DIR are both relative paths with the same base, so prefix comparison works.

**how ROUTE_DIR is derived** (lines 60-88):
```bash
BIND_FLAG=$(find . -path ./node_modules -prune -o -name ".bind.${BRANCH_FLAT}.flag" -type f -print ...)
ROUTE_DIR=$(dirname "$(dirname "$BIND_FLAG")")
ROUTE_DIR="${ROUTE_DIR#./}"  # strip initial ./
```

**how FILE_PATH is received**:
- from stdin JSON: `tool_input.file_path`
- could be absolute or relative — caller determines

**risk**: if FILE_PATH is absolute (`/home/user/repo/.route/xyz/artifact.md`) but ROUTE_DIR is relative (`.route/xyz`), prefix check fails.

**evidence check**: claude code passes paths as provided by user. typical invocation uses relative paths from repo root.

**mitigation in code**: lines ~150 check if FILE_PATH contains ROUTE_DIR before detailed checks. this handles both absolute and relative if they share the same suffix.

**conclusion**: the guard handles this via contains-check before prefix-check. assumption holds for typical usage.

---

## issues found

### 1. [DOCUMENT] sanitization dependency

the prefix regex assumes ROUTE_DIR contains no regex special characters. this holds because `sanitizeBranchName.ts` converts them to `-`. the blueprint should note this dependency.

**severity**: documentation gap, not functional issue.

### 2. [EXTANT] bash multi-path extraction

bash commands with multiple paths only check the first one. a command that touches both safe and unsafe paths may be incorrectly allowed.

**severity**: pre-extant limitation. out of scope for this fix.

---

## conclusion

technical assumptions are sound for the fix scope:
- prefix pattern correctly distinguishes metadata from artifacts
- symlinks are out of scope (literal path comparison is intentional)
- pattern order is correct (specific before general)
- bash extraction imprecision is extant, not introduced
- blocker path change has no runtime consumers
- backwards compatible for .behavior/ routes
- relative/absolute path is handled via contains-check

no blockers for the fix. one documentation gap to note (sanitization dependency).

