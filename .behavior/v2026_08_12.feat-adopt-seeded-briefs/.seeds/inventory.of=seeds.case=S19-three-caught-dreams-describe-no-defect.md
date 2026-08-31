# seed: three caught dreams describe no defect — two are on purpose, one is already fixed

**2026-08-31. three of the round's dreams are withdrawn, and all three failed the same check.**

## .said

> this is on purpose; .behavior/v2026_08_12.feat-adopt-seeded-briefs/dreams/v2026_08_30.enbrief.undeclared-briefs-are-demoted-to-ref.md

> we should just fix this; not deal with this defect; src/domain.roles/driver/briefs/hazard.since-main-diffs-attribute-main-to-your-branch.md

> shouldnt --diff since-main just ignore the ones that main is ahead on?

> i feel like we should have that already

## .settled

each dream asserted a defect. **not one of the three was checked against the authority before it
was caught.**

| the dream | what it claimed | the authority | the verdict |
|---|---|---|---|
| `enbrief.undeclared-briefs-are-demoted-to-ref` | an undeclared brief falls to `ref` silently — a gap | the wisher | 🔴 **on purpose.** it is designed behavior, not a defect |
| `amend.route-complete-wears-an-imported-seaturtle-vibe` | 🌴🤙 on the status line is off-voice | the wisher (S17, S18) | 🔴 **on purpose.** the owl goes to the beach |
| `entool.scope-review-lanes-against-the-fork-point` | `since-main` diffs against the main **tip**, so main's newer code reads as your deletions | `getAllFileDiffsFromRange.ts` | 🔴 **already fixed.** line 70 calls `git merge-base` |

## 🔴 .the since-main read, in full — the code was already correct on BOTH counts

`src/domain.operations/review/getAllFileDiffsFromRange.ts`:

```ts
// line 43 — prefer origin refs (remote branches) to avoid local divergence
if (refExists({ ref: 'origin/main', cwd: input.cwd })) return 'origin/main';

// line 70 — use merge-base to only show changes since branch point, not changes on main
const mergeBase = execSync(`git merge-base ${mainBranch} HEAD`, { ... }).trim();
```

⇒ **the wisher's *"i feel like we should have that already"* was exactly right, and it was right
about a fix i had proposed in a dream and taught in a brief.**

- **`origin/main` over stale local `main`** — line 43. this is queued seed **#344**'s entire ask,
  already satisfied, exactly as seed #300 was
- **the fork point, not the tip** — line 70. `git merge-base` returns an ancestor of `HEAD` by
  construction, so a commit that `main` is ahead on **cannot enter the diff**

so the hazard the brief taught — *"a since-main diff on a zero-commit branch renders main's newer
code as your deletions"* — **is impossible**. on a zero-commit branch the merge-base IS `HEAD`, so
the diff covers the uncommitted tree alone and naught is attributed.

**verified empirically on this branch:** `git diff origin/main --name-only` → 225 files;
`git diff origin/main...HEAD --name-only` → 0. the 225 are uncommitted edits, and the merge-base
form correctly reports zero committed change.

## .landed

- `src/domain.roles/driver/briefs/hazard.since-main-diffs-attribute-main-to-your-branch.md` —
  **deleted**, plus its `boot.yml` line and every citation
- `.dream/v2026_08_30.entool.scope-review-lanes-against-the-fork-point.md` — **withdrawn**
- `.dream/v2026_08_30.enbrief.undeclared-briefs-are-demoted-to-ref.md` — **withdrawn**
- `.dream/v2026_08_30.amend.route-complete-wears-an-imported-seaturtle-vibe.md` — **withdrawn**
- `.fulcrums/inventory.of=fulcrums.case=F27-*.md` — the recurrence, now at n=3
