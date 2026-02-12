# diagnose branch failures: diff first, hypothesize second

## .what

when tests fail on a branch but pass on main, start with `git diff main` before investigating technical hypotheses.

## .why

tunnel vision on symptoms wastes time. the actual cause is usually visible in the diff.

## .antipattern

1. tests fail on branch
2. hypothesize complex technical cause (e.g., "pnpm bin path resolution")
3. investigate and "fix" the symptom
4. tests still fail
5. repeat with new hypothesis
6. eventually check the diff and find the obvious cause

## .pattern

1. tests fail on branch
2. `git diff main --name-only` — what files changed?
3. `git diff main -- package.json` — any dependency changes?
4. `git diff main -- <relevant-files>` — what specifically changed?
5. identify the actual cause from the diff
6. fix the root cause

## .example

**symptom**: acceptance tests fail with "judge 1 failed"

**wrong approach**: investigate pnpm bin path resolution, add `.pnpm` symlink fix, still fails

**right approach**:
```sh
git diff main -- package.json
```
reveals:
```diff
- "rhachet-roles-bhrain": "link:.",
+ "rhachet-roles-bhrain": "0.10.0",
```

root cause found in 10 seconds: tests need local code (`link:.`), not published package.

## .checklist

when a branch has failures that main doesn't:

- [ ] `git diff main --name-only` — scan changed files
- [ ] `git diff main -- package.json` — check dependency changes
- [ ] `git diff main -- pnpm-lock.yaml` — check lockfile changes (version bumps)
- [ ] `git log --oneline main..HEAD` — which commits introduced changes?

only after reviewing the diff should you form technical hypotheses.
