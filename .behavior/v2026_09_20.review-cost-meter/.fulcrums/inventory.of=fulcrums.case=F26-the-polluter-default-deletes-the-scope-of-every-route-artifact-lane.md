# F26 — the polluter default deletes the scope of every route-artifact lane

- raised 2026-09-24, by the driver, **immediately after `F25` shipped** — it is `F25`'s own blast radius
- rework: **clean** — 🔴 **re-graded from dirty, see below**
- status: 🟡 **BEST-GUESSED 2026-09-24 — option A shipped, bounded and clamped.** the council may flip it
- confidence: 🔴 **99%** that the regression is real (measured) · 🟡 **75%** that A is the right door

## 🔴 .the rework grade was WRONG, and that error nearly cost a halt

this row opened graded **dirty**, which is what sent it to a halt. it is **clean**:

| the dirty test | the answer here |
|---|---|
| have callers hardened against it? | no — `isTargetPolluter` shipped an hour earlier, unreleased |
| has later work been built upon it? | no |
| is reversal a teardown? | **no — it is one argument and one filter clause** |

⇒ `rule.always.defer-fulcrums-to-last` is explicit: *"unsure → treat it as clean and flag it. a
flagged clean rework costs a glance; a premature block costs the road its momentum."* the halt
was the premature block that rule names.

🟡 **the tell was legible at the time and was misread**: *"the two options disagree about the
concept"* is a statement about how INTERESTING the fork is, never about how expensive the rework
is. a fork can be conceptually deep and mechanically trivial to reverse — this one is both.

## ✅ .what was best-guessed — A, bounded

`getAllTargetsAskedForByName`: a polluter survives where a **specific** positive glob named it.
a glob is specific when every target it matched is a polluter.

| clamp | what it proves |
|---|---|
| `getAllTargetsAskedForByName.test.ts` — 7 tests, 6 cases | the decision, incl. 🔴 `[case2]` the catch-all bound and `[case4]` the mixed-glob composition |
| `stepReview.casePolluters.integration.test.ts` `[case4]` | the real guard shape end to end — `--diffs since-main` + a `--paths` glob over paperwork, default mode, target survives |

### why A over B and C

- **A** is what the source dream specified (property 2), what the term argues (*"it pollutes only
  when it reaches a reviewer as a target"*), and it needs no edit to any guard
- **B** leaves 38 binds broken and moves the repair to another repo's template
- **C** (allowlist `N.$stage.*.md`) needs a boundary nobody has argued, and it stays side-blind —
  so the NEXT artifact kind a lane binds by name breaks again

⇒ A is the only door that fixes the **class** rather than the instance.

## 🟡 .what the council should still weigh

the directive read *"polluters includes all except allowlisted"*, with no carve-out for how a file
entered. A reads that as a definition of the SET, never of WHEN the drop applies. **if the wisher
meant it side-blind, A is the flip**, and it costs one argument.

⇒ and the residual hole is recorded rather than hidden: a catch-all over an all-polluter corpus
reads as specific, so no file drops. benign — such a scope would otherwise refuse as empty.

## .the fork

`F25` shipped an allowlist: a route artifact is a polluter unless it is `.fulcrums/**`,
`.seeds/**`, or `*.yield.md`. that is correct for a lane whose subject is **code**, and it is
exactly backwards for a lane whose subject is **the route's own deliverable**.

a blueprint-stage lane binds its subject by name:

```
--diffs since-main --paths-with '$route/3.3.blueprint.*.md' --join intersect
```

`3.3.blueprint.*.md` is not in the allowlist, so every joined file is now dropped, the scope
resolves to **zero**, and the lane refuses before the brain is reached.

### the measurement

```
--paths-with '$route/…'   →   78 occurrences across 38 guard files
```

⇒ among them, **this route's own `1.vision.guard`** (2 binds). so the change that shipped under
`F25` would refuse the very lanes that reviewed the artifact `F25` was raised against.

🟡 the extant 38 are mostly archived routes, so the live cost is small **today**. the cost that
matters is the **template**: every route generated from here on inherits the same bind shape.

## 🔴 .why it was HALTED rather than best-guessed

`rule.always.defer-fulcrums-to-last` sends a fork to the council when the rework is **clean**.
this one is dirty in both directions, and the two candidate repairs do not merely differ in
cost — **they disagree about the concept**:

| | repair | what it makes a polluter MEAN |
|---|---|---|
| **A** | a file matched by an explicit positive `--paths` glob is never a polluter | *"a polluter is paperwork that RODE IN"* — the `--diffs` side is incidental, the `--paths` side deliberate |
| **B** | leave the filter as directed; a route-artifact lane passes `--polluters keep` | *"a polluter is paperwork, full stop"* — deliberate or not, you name the mode to get it |

⇒ the term this branch just clustered says **A**: *"a polluter is defined against the SCOPE,
never against the repo … it pollutes only when it reaches a reviewer as a target"*. a lane that
asked for it by name is not polluted by it.

⇒ the **directive** says **B**: *"polluters includes all except allowlisted"*, with no carve-out
for how a file entered.

**a driver cannot pick between a term it wrote and a directive it was given.** that is the halt.

## 🔴 .the source dream said A, and this drive recorded that it was IMPOSSIBLE

the dream's property 2 reads: *"overridable — a lane that WANTS dreams names them in `--paths`
and gets them."* the closure note written hours earlier graded that **delta 2 — cannot work**,
on the grounds that the filter lands after the join.

⚠️ **that grade was wrong, and the error is instructive.** *after the join* and *blind to which
side carried it* are two different properties, and the closure note treated them as one. the
filter lands after the join AND `stepReview` still holds `targetFilesFromDiffs` and
`targetFilesFromPaths` separately (`:414`, `:447`) — so a per-side decision was available the
whole time.

⇒ the dream was right, its own reader refuted it, and **38 guards are what the refutation cost**.

## .what each repair costs

| option | cost |
|---|---|
| **A** — exempt an explicit `--paths` match | 🔴 a broad bind (`--paths-with '**/*'`) exempts every file, which voids the default on the widest lanes — the ones it most exists for. mitigable by a narrower test (*"is the GLOB itself polluter-shaped?"*), which is a heuristic |
| **B** — leave it; lanes opt in | the 38 extant binds stay broken, and the repair lives in the guard **template** in `bhuild/role=behaver` — another repo, so a re-seed rather than a local fix (`rule.always.scope-onetime-lessons-to-the-behavior`) |
| **C** — allowlist the stage-deliverable shapes (`N.$stage.*.md`) alongside the three | 🟡 unexamined. it keeps the filter side-blind AND unbreaks the common bind, at the cost of a fourth allowlist entry whose boundary nobody has argued |

🟡 **C was found while this row was written and has had no scrutiny.** it is recorded so the
council sees three doors rather than two, not because it is favoured.

## .what would settle it

one sentence from the wisher: **does a file a lane asked for BY NAME count as a polluter?**

- *no* → **A**, and the broad-glob hole needs a bound
- *yes* → **B**, and the template re-seed is owed to `bhuild`
- *"only the stage deliverables"* → **C**, and its boundary needs an argument

## .see also

- `inventory.of=fulcrums.case=F25-the-corpus-carries-13pct-noise-by-default-and-that-is-a-ruling.md`
  — the parent; this fork is its blast radius
- `src/domain.operations/review/isTargetPolluter.ts` — the decision, and the allowlist
- `src/domain.operations/review/stepReview.ts` `:414`, `:447`, `:483` — the two sides, still
  separate at the point the filter runs
- `.dream/v2026_09_24.feat.the-review-corpus-has-no-default-exclusion-set-so-dreams-and-a-lockfile-ride-in.md`
  — property 2, and the delta note that refuted it wrongly
- `.agent/repo=.this/role=any/briefs/domain.terms/term=review.scope.polluter._.choice._.md`
  — *"defined against the SCOPE, never against the repo"*, the clause that argues for A
