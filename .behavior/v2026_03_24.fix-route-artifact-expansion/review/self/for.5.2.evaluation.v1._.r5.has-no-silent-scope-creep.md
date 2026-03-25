# self-review: has-no-silent-scope-creep (r5)

## question

did any scope creep into the implementation?

---

## found issues: one

### issue found: undocumented rhachet version bump

**discovery method**: ran `git diff origin/main --name-only` and found `package.json` in the changed files list. this file was NOT in the blueprint.

**the change**:
```diff
-    "rhachet": "1.37.19",
+    "rhachet": "1.38.0",
```

**was it silent?**: yes — not documented in evaluation artifact at time of discovery.

### how it was fixed

I updated the evaluation artifact `5.2.evaluation.v1.i1.md` to add this divergence:

1. added to divergences found table (line 81):
   ```
   | filediff | (none) | package.json rhachet bump | added |
   ```

2. added to divergence resolution table (line 91):
   ```
   | rhachet bump | backup | devDependency update for behavior route workflow; does not affect product fix |
   ```

3. updated conclusion to list five divergences instead of four (line 97-102)

### verification of fix

I re-read `5.2.evaluation.v1.i1.md` and confirmed:
- line 81 contains: `| filediff | (none) | package.json rhachet bump | added |`
- line 91 contains: `| rhachet bump | backup | devDependency update for behavior route workflow; does not affect product fix |`
- line 97 says: `implementation matches blueprint intent with five justified divergences`
- line 102 lists: `5. rhachet bump — devDependency for behavior route workflow`

**the fix is complete**. the rhachet bump is no longer silent scope creep — it is documented and backed up.

---

## non-issues: four items verified

### 1. getAllStoneArtifacts.ts changes

**file**: `src/domain.operations/route/stones/getAllStoneArtifacts.ts`

**changes verified**:
- jsdoc .note added — documents new behavior
- hasCustomArtifacts extraction — documented divergence (backup)
- default pattern prefix with `${input.route}/` — blueprint scope
- $route expansion via `.replace()` — blueprint scope
- cwd change to `process.cwd()` — documented divergence (backup)

**why it holds**: all changes are either in blueprint scope or documented as divergences with backup resolutions. no silent scope creep.

### 2. getAllStoneArtifacts.test.ts changes

**file**: `src/domain.operations/route/stones/getAllStoneArtifacts.test.ts`

**changes**: none made.

**why it holds**: absence of changes is documented as divergence (test file unchanged). backup rationale is that acceptance test provides better coverage. no scope creep.

### 3. parseStoneGuard.ts changes

**file**: `src/domain.operations/route/guard/parseStoneGuard.ts`

**changes verified**:
- added quote strip regex: `.replace(/^["'](.*)["']$/, '$1')`
- changed artifacts push to use unquoted value

**why it holds**: this file was NOT in blueprint, but the change is documented as divergence (quote strip added) with backup rationale. the fix would not work without it. no silent scope creep.

### 4. pnpm-lock.yaml changes

**file**: `pnpm-lock.yaml`

**changes**: lockfile updated due to package.json rhachet bump.

**why it holds**: this is a derivative change from package.json. same resolution applies (rhachet bump divergence). no additional scope creep.

---

## scope creep final checklist

| question | answer | evidence |
|----------|--------|----------|
| did I add features not in blueprint? | yes | quote strip, rhachet bump — both documented |
| did I change things "while in there"? | no | all code changes are targeted to the fix |
| did I refactor unrelated code? | no | no unrelated refactors |
| are all deviations now documented? | yes | 5 divergences in evaluation artifact |

---

## conclusion

one issue was found (undocumented rhachet bump) and fixed (added to evaluation artifact as divergence #5). all five scope expansions are now documented with backup resolutions:

1. test file unchanged — backup (acceptance test covers)
2. explicit cwd — backup (clearer than implicit)
3. hasCustomArtifacts extraction — backup (type safety)
4. quote strip added — backup (required for correctness)
5. rhachet bump — backup (devDependency for workflow)

no silent scope creep remains.

