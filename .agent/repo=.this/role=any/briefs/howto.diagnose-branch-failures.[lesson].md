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

## .the other direction — what the branch LACKS

the checks above all read `main..HEAD`: what this branch ADDED. a second, easy-to-miss cause
reads the other way — what this branch is ABSENT. a branch far behind main runs STALE copies
of main's own tests, against main's own code. those failures belong to neither: not your
change, not a real defect.

measure the distance BOTH ways before you diagnose one failure:

```sh
git log --oneline HEAD..origin/main | wc -l   # commits you LACK
git log --oneline origin/main..HEAD | wc -l   # commits you ADDED
```

the tell: failures cluster in suites your change never touched, and `origin/main..HEAD` is
small (or 0) while `HEAD..origin/main` is large. then the fix is a rebase, not a debug.

⚠️ use `origin/main`, never bare `main` — a local `main` drifts behind the real trunk, so it
under-reports the distance and hides this cause entirely.

## .example — the phantom failure

**symptom**: 159 acceptance tests fail across 19 suites; the branch's own suite is green.

**the measure**:
```
git log HEAD..origin/main  → 14 commits   (branch is 5 releases behind)
git log origin/main..HEAD  →  0 commits   (none of its own yet)
```

`git diff HEAD origin/main -- blackbox/` then showed 185 files / +12,181 lines, with the
failed suites among the heaviest-changed. root cause: stale copies of main's tests, not a
defect. the 1 genuine failure was the branch's own stale snapshot — separable once the other
158 were attributed.

## .checklist

when a branch has failures that main doesn't:

- [ ] `git log --oneline HEAD..origin/main | wc -l` — how far BEHIND? (stale-test cause)
- [ ] `git log --oneline origin/main..HEAD | wc -l` — how much is even yours?
- [ ] `git diff origin/main --name-only` — scan changed files
- [ ] `git diff origin/main -- package.json` — check dependency changes
- [ ] `git diff origin/main -- pnpm-lock.yaml` — check lockfile changes (version bumps)

then attribute each failure: does it sit in a suite your change touched? if not, suspect
staleness before a defect.

only after review of the diff should you form technical hypotheses.
