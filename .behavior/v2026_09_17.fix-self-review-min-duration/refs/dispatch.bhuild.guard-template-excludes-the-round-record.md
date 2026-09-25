# dispatch → `ehmpathy/rhachet-roles-bhuild`

a route's generated peer lanes read the round's own record, so every review round makes the next one
more expensive. **measured on `ehmpathy/rhachet-roles-bhrain@beav/fix-self-review-min-duration`:
seven of ten peer lanes went dark two rounds running, and the answer to round one is what darkened
round two.**

## .the measurement

seven lanes returned `constraint ✋ — prompt exceeds 75% of context window`. between i015 and i016
**every one rose by exactly +4.4 points** while its rubric did not change by one token:

| lane | rubric tokens | i015 | i016 |
|---|---|---|---|
| `repo-rules` | 18.1k | 89.4% | 93.8% |
| `mech-failhides` | 2.6k | 87.9% | 92.3% |
| `arch-opport-decomposition` | 554 | 88.9% | 93.3% |
| `arch-smell-scopeleaks` | 454 | 88.8% | 93.2% |
| `arch-hazards-maintenance` | 506 | 88.4% | 92.8% |
| `behavior-intent-coverage` | **393** | 90.2% | **94.6%** |
| `ergo-friction-hazards` | 601 | 88.4% | 92.8% |

🔴 **the smallest rubric of the ten posts the highest overflow, in both rounds.** a 46× spread in
rubric size produces an identical delta ⇒ **the rubric is innocent; the whole rise is target-side.**

the guard's own `tokens.expected.md` names the cause, over a 796.4k target set:

```
.behavior/  312.1k  39.2%   (.fulcrums 77.8k · dreams 33.8k · seeds · yields)
.dream/      63.2k   7.9%
.fulcrums/    1.8k   0.2%   (a root-level duplicate of one route fulcrum)
-----------------------------------------------------------------
the round's own record = 377.1k = 47.4%
src/                    299.4k = 37.6%
```

## 🔴 .the mechanism — the remedy drives the loop

`--diffs since-main` with **zero commits on the branch** unions every new file. and every artifact a
driver is REQUIRED to write to discharge a review is a new file:

| the rule | where its artifact lands |
|---|---|
| `rule.always.itemize-the-fulcrums-you-best-guess` | `$route/.fulcrums/` — **77.8k** |
| `rule.always.catch-dreams-for-followups` | `.dream/` **and** `$route/dreams/` — **97.0k** |
| `rule.always.archive-the-wishers-words-verbatim` | `$route/.seeds/` |
| the stone's progress record | `$route/*.yield.md` |

⇒ **a driver who answers thoroughly pays a larger context tax next round than one who answers
tersely.** the incentive is inverted, and a driver cannot commit to collapse the diff without a
human grant (`rule.forbid.commits-the-route-did-not-ask-for`).

🔴 **the single worst line: `$route/dreams/**` is a SYMLINK to `.dream/**`.** those 33.8k are counted
**twice in one prompt** — 4.2% of the window, for zero information. that is a defect under any
policy, not a preference.

🟡 **`$route/.reviews/**` is already excluded** — verified in the same breakdown. a first read of
this defect blamed it and was wrong. **do not add an exclusion for it; verify before you do.**

## .the cure applied downstream, and what is owed here

on the bhrain route the seven lanes now carry, per-guard:

```
--paths-wout '.behavior/**' --paths-wout '.dream/**' --paths-wout '.fulcrums/**'
```

**that is a workaround every route must re-discover, by a driver who needs a human grant to apply
it.** the cure belongs in whatever mints a route's guards.

## .the bars — each with its test

**BAR 1 — a freshly-minted route excludes the round record by default.**
TEST: mint a route into a temp dir. for **every** generated peer lane whose `run:` carries
`--diffs since-main`, the same `run:` carries `--paths-wout` for the round-record dirs. a lane
that binds `since-main` and omits them fails the bar.

**BAR 2 — the symlink duplicate is counted once.**
TEST: a fixture route with one caught dream and its `$route/dreams/` symlink. run one peer lane.
`tokens.expected.md` names that dream's bytes **once**. two entries for one inode fails the bar.

**BAR 3 — no deliverable leaves scope.**
TEST: same fixture, with a changed `src/**/*.ts`, a changed `blackbox/**/*.ts`, and a changed
`__snapshots__/*.snap`. all three appear in the target set after the change. any absence fails.

**BAR 4 — the behavioral intent stays reachable.**
TEST: the generated `behavior-intent-coverage` lane still carries `--refs '$route/0.wish.md'` and
`--refs '$route/1.vision.yield.md'`. the intent must be **supplied as refs**, never scanned as
targets. a lane that loses both fails the bar.

**BAR 5 — the change is proven by a bite check** (`rule.require.clamp-edge-cases`).
TEST: revert the template change, re-run the BAR-1 clamp, watch it go **red**. restore, watch it go
**green**. a clamp that stays green under the un-fixed template asserts naught and fails the bar.

## .the non-goals, stated so they are not done by accident

- **do not exclude `$route/.reviews/**`** — already out of scope; an added exclusion is dead config
  that reads as load-bearing
- **do not narrow `--paths-with`** to `src/**` wholesale — that drops `blackbox/` and snapshots,
  which several rubrics legitimately grade
- **do not solve it with a commit** — the diff collapse is real and it is human-gated, so it cannot
  be the default remedy

## .where the full record lives

`ehmpathy/rhachet-roles-bhrain@beav/fix-self-review-min-duration`:

- `.dream/v2026_09_20.fix.the-answer-to-a-dark-lane-is-what-darkens-it-next-round.md` — the dream
- `.behavior/v2026_09_17.fix-self-review-min-duration/.fulcrums/inventory.of=fulcrums.case=F21-*.md`
  — the fulcrum, and the human-gated grant this needed
- `.behavior/v2026_09_17.fix-self-review-min-duration/5.1.execution.from_vision.guard` — the applied
  per-guard cure, with the measurement in a `.note` above the first lane
