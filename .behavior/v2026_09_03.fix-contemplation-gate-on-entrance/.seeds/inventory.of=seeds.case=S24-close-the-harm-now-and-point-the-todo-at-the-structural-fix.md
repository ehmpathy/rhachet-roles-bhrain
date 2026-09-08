# seed S24 — close the harm now; point a `todo` at the structural fix

- **kind** = a ruling, on a deferred fulcrum
- **caught** 2026-09-08

## .said

> lets do D and then leave a 'todo: fix structurally with A' which points to the dream of A;
> ```
> const cached = cachedReviews.find((r) => r.index === pr.index);
> const cachedSlug = cached && getRouteGuardReviewPeerPathMeta({ path: cached.path }).slug;
> const cacheSafe = cached && cachedSlug === pr.slug ? cached : null;   // discard on mismatch
> ```

## .settled

> **a cheap guard that closes the HARM ships now; the expensive fix that closes the DEFECT
> becomes a `todo` that names it and points at its record.**

the two are not rivals and the fork that posed them as rivals was the error. a fork of *"pay the
migration, or leave it alone"* makes the migration look architect-scale and the do-nothing option
look like the only cheap move — **and it hides the third shape entirely: a read-side guard that
costs neither.**

⇒ **the ruling is a general one about how a deferral is written.** where a defect has an expensive
structural repair and a cheap containment, **both are owed**: the containment lands, and the `todo`
carries the structural repair forward with a pointer to where its evidence lives. a deferral that
records only the expensive option leaves the harm live *and* the knowledge stranded.

⚠️ **the `todo` is load-bearing, never decoration.** the guard reconciles a wrong key at every read;
it does not make the key right. so a mismatch still costs a needless re-run where the correct key
would have found the real cache. **the todo is what stops the containment from reading as a fix.**

## .landed

| what | where |
|---|---|
| the guard | `getCacheSafePeerReviewArtifact.ts` |
| the lenient parse it needs | `asPeerReviewSlugFromPath.ts` |
| the clamp | `getCacheSafePeerReviewArtifact.test.ts` — `[case2]` swap · `[case3]` insert · `[case5]` unreadable |
| the `todo`, with its pointer | the docblock of `getCacheSafePeerReviewArtifact.ts` |
| the record it points at | `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md` |

## ⚠️ .the THREE departures from the sketch, and why each was forced

⚠️ **this title read *"the one departure"* while the body already held a second, and a third landed
later** — the exact defect this route catalogues at
`.dream/v2026_09_07.enbrief.declare-once-stops-at-the-yields-edge.md`, committed in the artifact that
records the verdict on it. **a title is a count, and a count is a claim.**

### 1. the parser must be LENIENT

the sketch reads `getRouteGuardReviewPeerPathMeta({ path: cached.path }).slug`. that parser
**throws** on a name it cannot read — correct for the contemplation gate, where a driver
hand-writes filenames and a typo must halt loudly. **on the cache hot path it would add a new halt
site for a file the driver never authored.**

⇒ the delivered form uses a lenient twin that returns `null`, and the caller treats `null` as a
**mismatch**. that fails safe in the same direction: the cache is discarded and the reviewer runs.

### 2. the comparison must be SANITIZED on both sides

the filename carries the **sanitized** slug, so `pr.slug` must be sanitized before the comparison.
without it, every reviewer whose slug holds a path separator would discard its cache on every round.

### 3. 🔴 there were THREE call sites, not the one the sketch named

the sketch shows the reuse fast-path. a grep for `cachedReviews.find((r) => r.index === …)` returned
**three**, and the two the sketch did not name are the ones that feed **level clearance** —
`computeVerdicts` and `getAllReviewPeerMeterStatuses`. an unguarded read at either unlocks a level on
a verdict its current reviewer never gave.

⇒ **this is the seed's real concept.** a sketch is written from the site its author reached from, so
it is a **point of departure, never a census** — and the delivery owes the enumeration the sketch does
not carry. this route had already recorded that lesson twice (i004 → i005) and it recurred anyway.
