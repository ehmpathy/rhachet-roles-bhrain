# seed S10 — a rewind removes the self-review trigger entirely, and archives it

**date** 2026-09-17 · **rules** `F10` · **kind** a settlement

## .said

> yeah, rewind should invalidate stale ones.
>
> it should remove them
>
> entirely
>
> and archive them
>
> just like it does for peer reviews

⇒ five utterances, one thought, delivered in sequence. archived as one seed because the concept is
one: **the rewind owns the invalidation, the removal is total, and the removed artifact is kept.**

## .settled

**a rewind is what invalidates a self-review trigger report.** it removes the trigger **entirely** —
every marker for that stone, no partial sweep, no generation kept — and it **archives** what it
removes rather than deletes it.

three properties, and each is a separate decision:

| property | what it settles |
|---|---|
| **the rewind owns it** | invalidation is an **event** the route already has, never a property of the artifact's key. a trigger is valid until a rewind says otherwise |
| **entirely** | no *"clear the stale generations, keep the newest"* — the whole marker set for that stone goes. ⇒ so a re-asked review starts a **genuinely fresh** clock |
| **archived** | the removed marker is **moved**, not destroyed. a rewound round's record survives for anyone who wants to read what happened |

⇒ this is the general principle it instances: **a lifecycle event invalidates; a cache key does not.**
the hash was an accidental invalidator — it fired on every artifact edit, which is far more often
than a round actually ends. the rewind fires exactly when a round actually ends.

## 🔴 .the precedent is real — and it is the YIELD's, not the peer review's

the utterance names peer reviews as the model. **checked, and the model is half right**, which
matters because the two halves have different homes:

| what | on rewind, today | mechanism |
|---|---|---|
| **peer reviews** | 🔴 **removed entirely — and DELETED, never archived** | `delStoneGuardArtifacts.ts:61-63` — `fs.rm(filePath, { force: true })` |
| **yields** | **removed and ARCHIVED** | `archiveStoneYield.ts:51` — `fs.rename` into `.route/.archive/`, with a timestamp suffix on collision |

⇒ so *"remove them entirely"* takes the **peer review** precedent exactly —
`enumRouteGuardReviewPeerFiles` globs `i*` across every iteration, so a rewind clears the whole
conversation for that stone, not merely the latest round of it.

⇒ and *"archive them"* takes the **yield** precedent, which is the one that actually archives.
`archiveStoneYield` already solves the two problems an archive has — where to put it
(`.route/.archive/`) and what to do on a name collision (a timestamp suffix) — so the self-review
trigger needs no new machinery, only the extant one pointed at it.

🟡 **the ask is coherent and buildable; only its cited precedent needed a correction.** recorded here
rather than silently adopted, because a later reader who follows *"just like peer reviews"* into
`delStoneGuardArtifacts` will find a hard delete and conclude the archive half was never wanted.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F10-what-invalidates-a-hashless-trigger-report.md`
- `1.vision.yield.md`
- `1.vision.experience.case=6.the-stale-articulation-predates-the-ask.md`
- `.dream/v2026_09_17.fix.rewind-cleanup-glob-never-matches-selfreview-triggers.md`
