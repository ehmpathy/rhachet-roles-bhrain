# F28 — one cast stated three times sits under the by-name exemption

- raised: 2026-09-24, by the **driver**, in self-review `r7` (role-standards-adherance), item 24
- rework: **🔴 dirty**
- status: **BEST-GUESSED — defer, catch a dream**
- confidence: 🟡 **72%**

## .the fork, stated fairly

`stepReview:420–446` casts three cli flags — `--paths`, `--paths-with`, `--paths-wout` — from
scalar-or-array into an array, with the same nested ternary written out three times and named
zero times.

the polluter work made this **load-bearing** rather than merely untidy:
`getAllTargetsAskedForByName` is a new reader of `positivePathGlobs`, so the by-name exemption —
the half that keeps **78 binds across 38 guards** from a scope of zero (`F26`) — now rests on a
derivation stated three times.

| fork | what it buys | what it costs |
|---|---|---|
| **A — extract now** | one `asGlobList` transformer; the three copies collapse; the exemption reads from a named decision | edits a shared orchestrator's argument treatment that **five** downstream sites read, inside a diff opened for an unrelated subject |
| **B — defer, catch a dream** | the polluter diff stays reviewable against its own subject | the third copy ships, and a later reader inherits the duplicate |
| C — leave it, no record | naught | the judgment is unreviewable, which is the defect this inventory exists to prevent |

## .taken, and why AT THE TIME

**B.** the SAFE/CLEAN test (`rule.always.fix-forward-under-scouts-honor`) splits cleanly here:

- **SAFE** — ✅ the extraction is behavior-identical and clampable
- **CLEAN** — 🔴 **no.** the block is pre-extant and untouched by the polluter change. an
  extraction ripples into five downstream readers of `positivePathGlobs` / `negativePathGlobs`,
  well past the diff this work opened

⇒ `rule.require.review-test-changes` names that shape outright — a refactor smuggled into an
unrelated change. so the fix is written down while the context is held, rather than ridden along.

⇒ the dream: `.dream/v2026_09_24.fix.one-scalar-or-array-cast-is-stated-three-times-in-stepreview.md`,
symlinked at `$route/dreams/`.

## .the rework, and why it is dirty

a `rule.prefer.wet-over-dry` extraction is trivial to write and **not** trivial to reverse once
five call sites read the new name. more to the point, the ripple is what makes it dirty **now**:
to pull it into this diff would put an unrelated five-site refactor in front of a reviewer whose
rubric is the polluter exclusion.

🟡 the reverse rework — extract later, on its own branch — is **clean**. so the dirt is a
property of **this diff's boundary**, never of the change.

## .the confidence, and why it is not higher

**72%.** three doubts, and the middle one is the one `F14` already taught this branch:

1. 🟡 the empty-string bound is real and easy to lose. the truthiness guard drops `''`, which is
   **not** the same as an array check — an `''` glob would enter `positivePathGlobs`, set
   `pathsRequested: true` on the join, and widen every lane. a repair that swaps truthiness for a
   null check regresses silently. the dream states it; a reader who skims may not
2. 🔴 **the deferral rests on a COUNT (three usages), and `F14`'s lesson is that a threshold is a
   claim about the codebase that goes stale as fast as the codebase moves.** the count here is
   three **at this read**, and a fourth flag would make the extraction overdue rather than due.
   ⇒ per that lesson, the dream owes a re-derivation of its count before anyone acts on it
3. 🟡 a peer drives the warmer behavior in this same tree and we merge together. an extraction in
   a shared orchestrator is exactly the edit most likely to conflict, which argues for the defer
   independently of the rules above — and *"it would conflict"* is a schedule reason, which
   `F27`'s escalation established is the **weaker** of the two grounds

## .where

- `src/domain.operations/review/stepReview.ts:420–446` — the three copies
- `src/domain.operations/review/getAllTargetsAskedForByName.ts` — the new reader that made it
  load-bearing
- `.dream/v2026_09_24.fix.one-scalar-or-array-cast-is-stated-three-times-in-stepreview.md` — the
  fix, with its clamp and its bound

## .the verdict

_(unruled)_
