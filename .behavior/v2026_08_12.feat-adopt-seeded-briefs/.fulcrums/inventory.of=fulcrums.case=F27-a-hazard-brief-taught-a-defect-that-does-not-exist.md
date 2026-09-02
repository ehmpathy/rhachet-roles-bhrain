# fulcrum F27 — a blocker-grade brief taught a workaround for a defect the code does not have

## .the plain version

> **i wrote a brief that taught drivers to distrust review findings, because of a diff bug. the
> diff has no bug. i had never read the file that computes it.**

| field | value |
|---|---|
| **the fork** | A: read `getAllFileDiffsFromRange.ts` before i taught the hazard · B: adopt seed #369's account of the diff range and split it into a `hazard.*` |
| **taken, and why** | **B**, twice — once at F18 (adopt verbatim) and again at F25 (promote to its own file). neither pass fetched the source |
| **rework** | **clean** — one brief deleted, one `boot.yml` line, three citations |
| **status** | 🔴 **overturned by the wisher**, then confirmed against the source |
| **where** | `hazard.since-main-diffs-attribute-main-to-your-branch.md` (deleted) · `.dream/v2026_08_30.entool.scope-review-lanes-against-the-fork-point.md` (withdrawn) |
| **confidence** | **~99%** — the source is unambiguous and the empirical check agrees |

## .what the code actually does

`src/domain.operations/review/getAllFileDiffsFromRange.ts`:

```ts
// line 43 — prefer origin refs (remote branches) to avoid local divergence
if (refExists({ ref: 'origin/main', cwd: input.cwd })) return 'origin/main';

// line 70 — use merge-base to only show changes since branch point, not changes on main
const mergeBase = execSync(`git merge-base ${mainBranch} HEAD`, { ... }).trim();
```

**both fixes were already there**, and the second one carries a comment that states the exact
property i claimed was absent.

| what i claimed | what holds |
|---|---|
| the range diffs against stale local `main` | line 43 prefers `origin/main` |
| the range diffs against the **tip**, so main's newer code reads as your deletions | line 70 uses `git merge-base` — an ancestor of `HEAD`, so a commit main is ahead on **cannot** appear |

⇒ **the hazard is not merely unobserved. it is impossible.**

**verified empirically:** `git diff origin/main --name-only` → 225 files;
`git diff origin/main...HEAD --name-only` → **0**. this branch has zero commits, so the merge-base
IS `HEAD`; the 225 are uncommitted edits and the correct base reports zero committed change.

## 🔴 .the same defect class, third occurrence — and occurrence 2 is what indicts it

this is not a new mistake. it is F23's, compounded:

| # | round | the claim | how it was settled |
|---|---|---|---|
| 1 | F23 | a blocker-severity rule shipped on an **inferred** tool behavior | caught in self-review |
| 2 | F25 | seed #369's account of the verdict cache | i **did** read the source — and it refuted the seed |
| 3 | **F27** | seed #369's account of the diff range | 🔴 **the wisher read it for me** |

⚠️ **occurrence 2 is why occurrence 3 is worse than a lapse.** in the same round, on the **same
seed**, i fetched the source for one half of its claim and did not for the other. i then wrote a
`.provenance` section that praised the read — *"the mechanism is read from source, never
inferred"* — while the adjacent brief shipped on an unread one.

⇒ so the failure is not *"i do not read sources."* it is **narrower and more useful**: i read the
source for the claim i was suspicious of, and took the adjacent claim on faith because it arrived
in the same seed body. **a seed is one document; its claims are not one claim.**

## .the wisher caught it in one sentence, twice

> *"shouldnt --diff since-main just ignore the ones that main is ahead on?"*
>
> *"i feel like we should have that already"*

they did not read the code either. they asked the question the code answers — and the question was
enough, because a claim that a tool lacks an obvious property is a claim that owes a check.

## .the cue this earns

> **when a seed asserts that a tool BEHAVES a certain way, fetch the operation before you teach it
> — once per claim, never once per seed.**

and the sharper half:

> **before you write a workaround, ask whether what you would work around is already fixed.**
> a `hazard.*` brief is a workaround with a filename.

## .what it costs when missed

a `hazard.*` at `ref` in the driver's boot tier taught every future driver to **discount review
findings** on a fabricated attribution risk. that is worse than an absent brief: it is a licence to
dismiss real blockers, published under the repo's own authority.

## .see also

- **F23** — the same class, occurrence 1
- **F25** — the same seed, the half i did check
- **F18** — where the unread claim first entered, adopted verbatim
- `.seeds/inventory.of=seeds.case=S19-*.md` — the wisher's words, and the full source read
- `rule.forbid.websearch-and-webfetch` (researcher) — the same principle for an external source:
  a summary is not the page. **a seed is not the source either**
