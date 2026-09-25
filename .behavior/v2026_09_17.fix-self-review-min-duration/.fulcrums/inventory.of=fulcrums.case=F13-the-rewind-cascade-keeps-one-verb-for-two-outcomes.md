# fulcrum F13 — the rewind cascade keeps one verb for two outcomes

- **case** = F13
- **title** = the rewind cascade keeps one verb for two outcomes
- **rework** = clean
- **status** = RULED — **B, extended** (the label AND the field), 2026-09-20, **by the drive**
- **confidence** = 75%
- **raised** = 2026-09-18, by the `behavior-declaration-coverage` self review on `5.1.execution.from_vision`

## .the fork, stated fairly

todo 8 changed what a rewind does to a self-review trigger: it **archives** rather than deletes. the
operation moved, its clamps moved, and the sentence a driver reads did not:

```
│  ├─ deleted: 0 reviews, 0 judges, 0 promises, 8 triggers, 1 yield
```

**two of those counts name artifacts that still exist** — the 8 triggers (this round's change) and
the 1 yield (extant since `archiveStoneYield`).

| | A — the channel | B — the label | C — defer, with a dream |
|---|---|---|---|
| what it does | cascade gains an `archived` datum, rendered on its own line | rename the render `deleted:` → `cleared:` | naught now; the dream carries the shape |
| truthful? | ✅ fully — the two verbs stay apart | 🟡 partly — `cleared` covers both, and says which is which not at all | 🔴 no |
| repairs the **extant** yield half? | ✅ yes | ✅ yes | no |
| files | `rewindAffectedStones`, `setStoneAsRewound`, `formatRouteStoneEmit` (type + render), 2 snapshot families | `formatRouteStoneEmit` (1 line), 1 snapshot family | naught |
| new defect? | none | 🔴 the render says `cleared` and the field it prints is `c.deleted` — `rule.forbid.domain-term-inconsistency` | none |
| scope | 🔴 opens the **rewind emit contract**, a subsystem this wish never touched | 🟡 one line in a file already in the diff | ✅ the diff is unchanged |
| the round's own scope flag | 🔴 worsened — the yield already states four deliverables as a split question | 🟡 marginal | ✅ unchanged |
| cost to reverse | naught — the dream carries the full shape | naught | — |

## .taken, and why AT THE TIME

**C — defer, with a dream and this fulcrum.**

the SAFE/CLEAN test of `rule.always.fix-forward-under-scouts-honor` grades the FIX, and A splits:

- **SAFE ✅** — a report shape and a label. no behavior moves, and two snapshot families clamp it
- **CLEAN 🔴** — it opens `rewindAffectedStones`, `setStoneAsRewound`, and the cascade contract in
  `formatRouteStoneEmit`. this round's diff is `guard/review/self/`, `guard/tree/`, and four
  `stones/` operations; the **rewind emit** is none of those

🔴 **and B is the option worth a council's eye, because it is nearly free and I still refused it.**
one line, in a file already open. the reason is that it does not repair the defect — it moves it:
the rendered word would then disagree with the field name it prints, so a reader who greps
`cleared` finds no field and a reader who reads `c.deleted` finds no label. ⇒ a nitpick traded for a
nitpick, at the price of a re-taken snapshot a reviewer must scan.

🟡 **the weight that settles it is that the worse half is NOT this round's.** the emit has rendered
an archived yield under a `deleted:` label since `archiveStoneYield` shipped. a repair scoped to the
trigger alone would leave the older lie in place beneath a shape that now claims precision — which
is a worse artifact than the honest conflation that stands today.

## .rework, and why

**clean.** the deferral reverses at no cost: the dream carries the call-site lines, the proposed
render, the rejected alternative and why, and a bite-check recipe.

⚠️ the *fix* is also clean in the ordinary sense — no caller's behavior changes, and the cascade item
gains a field rather than loses one. what fails the CLEAN question is **which files it opens**, never
how they change.

## .confidence, and why it is 75% rather than higher

three things pull it down:

1. 🔴 **the round CAUSED this half.** F12's deferral was of a defect that predates the round; this one
   the round introduced, and a council could fairly hold a round to its own blast radius
2. **option B is cheap enough that the refusal reads as fastidious.** the honest defence is that B
   swaps one rule violation for another, and that is a judgment about which nitpick is worse
3. **no snapshot exercises a live trigger count**, so the claim `deleted: … 8 triggers` has never
   rendered in a test. ⇒ the defect is real but **unwitnessed**, which cuts both ways: it has harmed
   nobody yet, and it will surface first to a human rather than to the suite

what holds it at 75% rather than lower: the yield's scope concern is **already on record and already
flagged to the council**, so this is not a worry invented to justify a deferral.

## .where

- the dream: `.dream/v2026_09_18.fix.the-rewind-reports-an-archived-trigger-as-deleted.md`
- linked at: `$route/dreams/v2026_09_18.fix.the-rewind-reports-an-archived-trigger-as-deleted.md`
- the caller: `src/domain.operations/route/stones/rewindAffectedStones.ts:67`
- the render: `src/domain.operations/route/formatRouteStoneEmit.ts:483`
- the operation whose verb moved: `src/domain.operations/route/stones/archiveStoneSelfReviewTriggers.ts`

## .the verdict

🔴 **B, extended — and it is a SELF-REVERSAL, ruled by the drive rather than by the council.** that
distinction is what matters here, because the row above deferred it and one round later the same
drive took it. no reviewer asked: the two i005 lanes raised the laundered ask and the mint TOCTOU,
and no third point.

### what changed between the deferral and the reversal

| | at the deferral (i004) | at the reversal (i005) |
|---|---|---|
| `formatRouteStoneEmit.ts` | in the diff | in the diff, **and open for an unrelated repair** |
| `rewindAffectedStones.ts` | absent from the diff — the CLEAN 🔴 | still absent. **opened anyway** |
| B's stated objection | the render would say `cleared`, the field would read `c.deleted` | 🌙 **retired** — the field moved too |

⇒ so exactly one of the three grounds fell. **the CLEAN grade did not fall; it was overridden.**

### the defence, and the counter a council may prefer

**the defence:** this round's `delStoneGuardArtifacts` → `archiveStoneSelfReviewTriggers` change is
*what made the label false for triggers*, and `rewindAffectedStones` is its direct caller. a caller
of an operation whose verb you just changed is the case `rule.always.fix-forward-under-scouts-honor`
names outright, and the lesson at the foot of the dream states the same claim in general form.

**the counter:** the deferral's reason was never *"the fix is wrong"*; it was *"this round already
flags four deliverables as a scope question, and a fifth worsens it."* that reason is **unchanged**,
and a self-reversal that cites convenience against a scope bound is the shape a council exists to
catch. ⚠️ the drive records this as the weaker verdict it cannot rule out.

### what shipped, precisely

- `rewindAffectedStones.ts` — return-type field, local decl, and the cascade push: `deleted` → `cleared`
- `formatRouteStoneEmit.ts` — cascade item type field and the render line: `deleted` → `cleared`
- the clamp: an explicit `toContain('├─ cleared:')` / `not.toContain('├─ deleted:')` beside the
  snapshot in `setStoneAsRewound.test.ts`, bite-checked at **8 red** (1 explicit + 7 snapshots)
- 4 blackbox snapshot families re-taken

🟡 **option A's channel split is NOT owed and is withdrawn** — `cleared` is true of a delete and of
an archive alike, so the one word closes both halves, the older `archiveStoneYield` half among them.

🔴 **the residual stands: no snapshot renders a non-zero trigger count.** every row of
`setStoneAsRewound.test.ts.snap` still reads `0 triggers`, so the count beside the label remains
unproven. the dream records it as the one part of its clamp that did not ship.
