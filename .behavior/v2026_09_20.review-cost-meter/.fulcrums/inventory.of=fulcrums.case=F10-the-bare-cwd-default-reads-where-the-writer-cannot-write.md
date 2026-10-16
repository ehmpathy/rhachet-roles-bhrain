# F10 — the bare-cwd default reads a path the writer is FORBIDDEN to write to

- raised 2026-09-22, by the driver, at i012 (re-raised by `enroll-impl-behavior-intent`, A3)
- rework: **clean / 🔴 dirty** — the hint half is clean and SHIPPED; the walk-up half is dirty
- status: 🟡 **HALF-CLOSED at i012** — the legibility half fixed; the default is a wisher call
- confidence: **90% / 🔴 50%**

## .the fork, stated fairly

`--at` defaults to the bare cwd, and both tree-scoped breadths read it without a walk up:

```ts
// getAllReviewRunMeters.ts / getOneReviewRunMeterLatest.ts
const root = asReviewLogsDir({ cwd: input.cwd });   // path.join(cwd, '.log/bhrain/review')
```

🔴 **the argument that makes this more than an inconvenience is that the WRITER is forbidden to
write anywhere else.** `rule.forbid.cwd-outside-gitroot` is a declared rule of this repo:

> *"never change cwd outside the git repository root. all subprocess and file operations must
> use repoRoot as cwd."*

⇒ so the bare-cwd default can find logs **only** when cwd happens to equal the git root. the
nested case is not a plausible miss; it is a **guaranteed** one.

| option | the claim |
|---|---|
| **A — the hint** | the refusal walks up, finds the tree, and names it. changes no read and no default |
| **B — the walk-up** | the DEFAULT derives the git root, so the nested case succeeds rather than merely explains itself |
| **C — leave both** | bare cwd is the house convention; `review.ts` reads the same way |

## .taken, and why at the time

🟡 **A shipped at i012. B stays reserved. they are NOT alternatives — A is B's prerequisite made
cheap.** the reasons the two split:

- **A passes SAFE and CLEAN outright.** it touches one refusal branch, changes no default, and
  `[case7]`'s honesty assertion (*"the refusal names the dir it actually read"*) survives verbatim.
  `rule.always.fix-forward-under-scouts-honor` is explicit that safe + clean means **do it now**
- 🔴 **B fails both, and the dream said so before this row existed:**
  - **SAFE — no.** it moves where two shipped breadths look
  - **CLEAN — no.** the honest fix touches `review._.cost`, the peer `review` command, their
    shared default, and the clamp — and it opens a question this branch never asked: *does
    `review` itself owe the same walk-up?* that is a `review` contract question, and this
    branch's declared bound is *"it does not change any rubric, any guard, or any lane's bind"*

⇒ **the hint makes the miss LEGIBLE; only the walk-up makes it IMPOSSIBLE.** a driver who reads
*"🔭 but reviews DID run above: /my-tree"* is one paste from the answer — which is the whole cost
of the deferral, and it is now small.

## 🔴 .why this row exists at all, and what that says about the inventory

the sweep at i010 found **eight dirt deferrals with one fulcrum between them**, and this dream was
row 5. the inventory declined to raise rows for four of them, with a stated criterion:

> *"each is a real judgment and **none has a peer who has re-raised it**, so four half-argued rows
> would dilute a council that already carries nine."*

⇒ **that criterion fired.** the i012 lane re-raised it as A3, and named precisely the gap the
sweep had recorded — *"fix deferred to a dream with no fulcrum row yet."*

🟡 **so the record worked as designed, and the design's cost is visible too:** a checkable list
inside a section is not a row, and a peer had to read the section to find it. the trade the
inventory made — fewer rows, one list — held for two days and then cost one round of peer
attention. that is cheap, and it is not free.

## .rework, and why

**clean, then dirty.** option A touched one fold, one operation, and one acceptance case. option B
touches two commands, their shared default, and re-opens a `review` contract question — and
`[case7]` is written to go RED under it, on purpose, which is the signal rather than a regression.

## 🔴 .confidence, and why the two halves differ

**90% that the gap is real** — the writer-is-forbidden argument is a declared rule of this repo,
read against a shipped default, rather than a taste call. a nested read looks where the writer may
not write, and no interpretation of that is favourable.

**🔴 50% that B is the right repair.** the honest uncertainty is not about the defect; it is about
the BLAST RADIUS. `review.ts` reads the cwd the same way, so to fix one and not the other trades
an inconsistency between cwd and gitroot for an inconsistency between two peer commands — and
**that second shape is worse, because it is invisible.** a driver can see that a path was wrong;
they cannot see that two commands disagree until one of them surprises them.

⇒ and option A, now shipped, lowers B's urgency without settlement of it. that is the honest
state: the miss is legible today and still guaranteed.

## 🔴 .the adjacent half a single ruling would close — raised by `enroll-impl-arch-defects`, i013

**`--at` is silently polysemous across `--of`**, and it is the same flag on the same command:

| `--of` | what `--at` names | its default |
|---|---|---|
| `run` · `tree` | a **tree** — a leaf | `cwd` |
| `grove` | a **grove root** — a container of trees | `path.dirname(cwd)` |

⇒ one flag, two grains, gated by a neighbour flag's value, each with its own default base.

🟡 **it is friction rather than harm, and the lane graded it so.** the failure mode is loud and
correctly worded — `getAllReviewTrees` on a non-container path answers zero present trees, and
`emitCostOfGrove` refuses cleanly on that, so a wrong `--at` yields a refusal rather than a
silently wrong number. `--help` documents both senses.

🔴 **but it is the same territory as option B, and it should not be ruled apart from it.** B asks
*"what base should `--at` default to?"* and this asks *"what does `--at` name?"* — a wisher who
settles the first without the second leaves one flag half-settled, which is the
*"a half-named fork reserves half its subject"* shape this very inventory already records twice
(`F1`, `F5`).

⇒ so it rides on F10 rather than as an F11 of its own: same flag, same command, one ruling.

---

## 🔴 .a THIRD question on the same flag, raised at i014 — the walk is UNBOUNDED above

`enroll-impl-arch-defects` observed that `getOneReviewedTreeAbove` walks every ancestor to `/`
and **does not halt at the git root**. verified by read — the loop's only terminator is
`path.dirname`'s fixed point.

⇒ so where the tree itself carries no logs, the walk keeps on up, and **any** ancestor that
happens to hold a `.log/bhrain/review` dir becomes the *"did you mean"* suggestion — a tree from
a different clone, or a grove root someone once ran a review in.

🔴 **and a wrong hint is worse than an absent one**, because a driver trusts it and re-points
`--at` at a tree that is not theirs. that is the exact principle this drive used to refuse the
cheap repair in `F13`, so consistency demands it be taken seriously here.

### 🟡 the obvious repair has a trap, and the trap is the expensive part

the lane proposed `getRepoRootWithFallback({ from: cwd })`, which the codebase already shares
*"so the two guard call sites cannot drift apart."* two corrections, both from a read:

| the proposal | what holds |
|---|---|
| *replace* the walk with the git root | 🔴 **no** — the contract is *"the nearest ancestor that CARRIES logs"*. a git root with no logs would become a hint that points at an empty tree, which is the same wrong-hint harm in the other direction. the right shape is a **bound** on the walk, never a substitution |
| the primitive composes cleanly | 🔴 **its fallback answers `process.cwd()`, NOT `input.from`.** so in a temp dir that is no git repo it answers the **test runner's** cwd — and `[case7]` runs in exactly such a dir. a naive bound would break the shipped case that exercises the hint |

⇒ so the repair is **a bound that treats the fallback as "no bound"**, plus a clamp for the
cross-tree leak. that is real design, not a one-liner, and it is why this rides as a deferral
rather than a fix-forward.

🟡 **it is filed here rather than under its own case number, for the reason the `--at` polysemy
is**: same flag, same hint, same command. a wisher who rules option B (what `--at` defaults to)
will already have decided most of what bounds this walk.

### 🔴 re-raised at `urgent` at i015 — three corrections, and the residual that survives them

the same lane returned at i015 and graded this `urgent`, on the claim that the walk is
*"unbounded"* and yields *"bad data presented with the confidence of good data"*. three
corrections, each from a read:

| the claim | what holds |
|---|---|
| the walk is **unbounded** | 🔴 no. `path.dirname` strictly shortens its input, so it terminates in at most `depth(cwd)` steps. the fixed point is checked at `getOneReviewedTreeAbove.ts:51` and the code's own `.note` at `:36-38` declares it as the reason no depth bound is owed |
| it *"can point at a wrong tree"* | 🟡 only when the driver's OWN tree never reviewed. the walk returns the **nearest** ancestor with logs, and `rule.forbid.cwd-outside-gitroot` pins the writer to the git root — so a tree that ever reviewed is its own nearest hit |
| *"bad data with the confidence of good data"* | 🔴 it is a **hint inside a refusal that already fired**. the command declined to answer and offered a `--at <path>` the driver reads before they type it. a suggestion that prints its own address is not data presented as fact |

⇒ `urgent` does not hold — there is no nameable shipped harm
(`rule.require.grade-a-concession-by-its-harm`). what survives is the residual this row already
carried: in the never-reviewed case, the hint can name a tree the driver does not consider theirs.

🟡 **and the cheap repair the i015 read suggests is this row's own reserved territory**, which is
why it was not taken as a fix-forward: *"stop at the first ancestor that is a git root, whether or
not it has logs"* makes the hint correct in every case above — and it is a git-root bound, which is
exactly what option B reserves. to take it alone would settle half of option B by side effect.

⇒ so it is recorded here as the **shape** the council should weigh beside option B, and the trap
above still applies to it: `getRepoRootWithFallback`'s fallback answers `process.cwd()`, so the
bound must treat the fallback as *"no bound"* or `[case7]` breaks.

## .where

- `src/contract/cli/review._.cost.ts` — `asDeetsOfAbsentTreeLogs` (the shipped hint)
- `src/domain.operations/review/getOneReviewedTreeAbove.ts` — the walk, refusal-only by
  contract, and 🔴 unbounded above the git root (i014)
- `src/contract/cli/reviewCost.acceptance.test.ts` `[case7]` — pins the convention AND the hint;
  `[t1]`'s fourth `then` is the one that asserts the hint changed no read
- `.dream/v2026_09_22.feat.review-cost-reads-the-bare-cwd-where-the-writer-writes-at-gitroot.md`
- `src/domain.operations/route/guard/getRepoRootWithFallback.ts:21` — the idiom option B would
  reach for, and 🔴 the `process.cwd()` fallback that makes the naive bound wrong

## .the verdict, once ruled

> _unruled — on option B. option A shipped._
