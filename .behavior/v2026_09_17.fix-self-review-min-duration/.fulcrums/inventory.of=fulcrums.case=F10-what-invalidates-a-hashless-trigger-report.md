# fulcrum F10 — what invalidates a hashless trigger report

**rework** clean · **status** ✅ **RESOLVED — A, refined: the rewind removes the trigger entirely,
and archives it** (`S10`) · **confidence** 97% · **where** `delStoneGuardArtifacts.ts:42-45`,
`archiveStoneYield.ts`, `setSelfReviewTriggeredReport.ts`

## ✅ .what was ruled

> *"yeah, rewind should invalidate stale ones. it should remove them. entirely. and archive them.
> just like it does for peer reviews."* (`S10`)

**option A, with two refinements the fork did not contain:**

| the decision | what it settles |
|---|---|
| **the rewind invalidates** | option A, as taken. ⇒ **the principle: a lifecycle event invalidates; a cache key does not.** the hash was an accidental invalidator — it fired on every artifact edit, far more often than a round actually ends |
| **entirely** | 🔴 a refinement. no *"clear the stale generations, keep the newest"* — the whole marker set for that stone goes, so a re-asked review starts a genuinely fresh clock |
| **archived, not deleted** | 🔴 a refinement the fork never considered. the removed marker is **moved**, so a rewound round's record survives |

⇒ **and `B` is settled by implication, in the negative.** the drive suspected a re-mint on the ask
was also owed and left it open. it is not owed: if the rewind removes the trigger entirely, then the
next `--as passed` finds no report and mints one through the **extant** `challenge:first` path
(`getSelfReviewChallengeDecision.ts:61-67`). ⇒ **no new mint branch, and no new reset mechanism** —
which is the outcome the drive wanted from B without the risk it flagged.

## 🔴 .the cited precedent is half right — check it before you build

the utterance names peer reviews as the model. **checked, and the two halves live in different
operations:**

| what | on rewind, today | mechanism |
|---|---|---|
| **peer reviews** | 🔴 removed entirely — and **DELETED**, never archived | `delStoneGuardArtifacts.ts:61-63` — `fs.rm(filePath, { force: true })` |
| **yields** | removed and **ARCHIVED** | `archiveStoneYield.ts:51` — `fs.rename` into `.route/.archive/`, timestamp suffix on collision |

- *"remove them entirely"* takes the **peer review** precedent exactly —
  `enumRouteGuardReviewPeerFiles` globs `i*` across every iteration, so a rewind clears the whole
  conversation for that stone rather than its latest round
- *"archive them"* takes the **yield** precedent, which is the one that archives. `archiveStoneYield`
  already answers the two questions an archive raises — where (`.route/.archive/`) and what on a name
  collision (a timestamp suffix)

⇒ **so the build is a composition of two extant operations, not a new one.** ⚠️ and a later reader
who follows *"just like peer reviews"* into `delStoneGuardArtifacts` will find a hard delete and
conclude the archive half was never wanted — which is why the correction is recorded here rather
than silently absorbed.

## 🟡 .`S11` dissolves half of this fulcrum's urgency, and leaves the other half

this fulcrum was **first of business** for two reasons. `S11` (drop the clock) removes one:

| the reason | after `S11` |
|---|---|
| a permanent trigger's ancient `.since` would make the 30s clock read as always-elapsed | **dissolved** — no clock reads it |
| 🔴 a permanent trigger's ancient mtime is **`F02`'s operand**, so the freshness bar would compare every file against a frozen instant and always pass | **stands.** `F02` still reads this mtime, so the invalidation still carries weight |

⇒ **so the decision is still required, and for the sharper of the two reasons.** with the clock gone,
the freshness bar is one of only two teeth the gate has left (the other is the path check) — and an
un-invalidated trigger removes it silently.

## 🔴 .the gap this fulcrum closes, and why it was invisible

the round's central change makes the trigger report hashless. the yield counted **three**
hash-dependent consumers — the filename, the timer reset, the hashbar count — and declared the
change lossless on that basis.

**there is a fourth: the hash was the report's INVALIDATION key.** a new generation of the artifact
minted a new report, so a report was implicitly scoped to one generation. remove the hash and a
report becomes permanent unless some other mechanism deletes it.

⇒ that is the defect this wish exists to repair, seen from its other side. the hash reset the clock
**too often** (every repair); with the hash gone it resets **never**, and the vision never asked what
should replace it.

## 🔴 .the declared lifecycle exists — and it does not fire

`delStoneGuardArtifacts` is the rewind's cleanup, and it intends to clear triggers:

```ts
// collect triggered files from .route/
const triggerFiles = await enumRouteFiles({
  route: input.route,
  glob: `.route/${input.stone}.guard.selfreview.*.triggered.*.md`,   // 🔴 requires .md
});
```

the artifacts it aims at are named by `getSelfReviewTriggeredReport.ts:19-21`:

```
$stone.guard.selfreview.$slug.$hash.triggered.since
$stone.guard.selfreview.$slug.$hash.triggered.uptil
```

**they end in `.since` and `.uptil`, never `.md`.** `enumRouteFiles` is a plain `fast-glob` pass
(`enumRouteFiles.ts:22`), so `triggered.*.md` matches zero of them. ⇒ `delStoneGuardArtifacts`
returns `triggers.promises: 0` on every rewind, always.

**measured on this route.** a `Glob` over `.route/` returns 13 trigger markers and 2 promise files.
the promise glob ends in `.md` and the promises would clear; the trigger markers would survive.

🔴 **so a rewind today clears the promise and keeps the clock.** the driver is re-asked for the
review, the ancient `.since` reads as elapsed, and a stale articulation clears on the first attempt
— which is `case=6`'s failure, live, and independent of this wish.

## .the fork, stated fairly

| | **A — repair the rewind glob** | **B — mint on the ASK** | **C — declare it permanent** |
|---|---|---|---|
| the rule | the rewind deletes the trigger markers | `--as passed` re-mints `.since` whenever the stone re-enters its self-review gate | a trigger is a one-time record per `(stone, slug)`; the freshness bar measures against another operand |
| `case=6` reachable? | ✅ after a rewind | ✅ after a rewind **and** any re-arrival | 🔴 never — `F02`'s `X` must change, and the only other operand is the artifact's mtime, which `F02` rejects |
| the change | one glob, `.md` → `.*` | one branch in the mint path | `F02` re-opens |
| risk | none found | 🔴 **a re-mint is a clock reset** — the very mechanism this round removes. it must fire on the ASK, never on a hash | it silently kills the freshness requirement `S01` clause 3 asks for |

## .taken, and why at the time

**A**, at 75% — with **B as a likely companion**, and the drive flags that it did not settle B.

A is required regardless: the declared lifecycle is broken today, so any option that leaves it broken
inherits a defect this round did not create but would now depend on. it is one character of glob.

⚠️ **B is the harder call and the drive deliberately leaves it open.** a re-mint on the ask is
correct in principle — a second round of self review is a second ask — and it is one branch away
from the reset this whole wish removes. the discriminator is **what triggers the mint**: the ask
(correct) versus the hash (the defect). that line is thin enough to earn the council's eyes.

⇒ **C is recorded and rejected.** it satisfies the letter of the hashless change and quietly voids
`S01` clause 3, which no utterance withdrew.

## .the rework

**clean.** A is a one-character glob repair. B is one branch. neither ripples past this subsystem.

## .the verdict

✅ **ruled: A, refined** (`S10`). the question was: **once the hash stops to invalidate a trigger,
what does?** ⇒ **the rewind does** — it removes the markers entirely and archives them.

🟡 **the drive's guess was right and incomplete.** it took A and left B open. the wisher took A,
closed B by implication, and added the **archive** — a refinement the drive's whole fork omitted,
because it framed the question as *"what deletes it?"* rather than *"what retires it?"*

⇒ **that framing error is the one worth a note.** every option in the table above is a deletion
strategy; none asked whether the removed artifact was worth a keep. the route already had an archive
mechanism for exactly this (`archiveStoneYield`), and the drive had read `delStoneGuardArtifacts`
without reading its neighbour.
