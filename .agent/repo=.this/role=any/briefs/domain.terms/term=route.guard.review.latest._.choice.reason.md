# domain.term.choice.reason: latest

## .etymology

`latest` is the wisher's own word, adopted verbatim rather than coined:

> **must be the LATEST always.**
> — the wisher, 2026-09-05. archived at
> `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance/.seeds/inventory.of=seeds.case=S07-the-judge-must-tally-the-latest-review.md`

it was chosen over three alternatives, and each was rejected for a stated reason rather than by
taste:

| candidate | why it lost |
|---|---|
| `newest` | reads as *"most recently written to disk"*, which invites an `mtime` key. **mtime is not the order** — the iteration is |
| `most-recent` | a hyphenated two-word qualifier does not compose into an operation name (`getMostRecentReviewFilesPerSlug` reads worse and greps worse) |
| `head` | borrowed from git, where it names a *branch pointer*. a review has no pointer, and the loan drags in a mental model that does not fit |
| ✅ `latest` | one word, superlative, and already the word the wisher and the source both use (`getLatestReviewArtifactForSlug` predates this settlement) |

## .disputes

### dispute: current — raised 2026-09-06 — status: RESOLVED (keep `latest`; `current` names a different concept)

- raised.by = driver, on `v2026_09_03.fix-contemplation-gate-on-entrance`
- claim = the source already says *"current hash"* and `hashCurrent` throughout, and
  `getRouteGuardReviewPeerContemplationStatus` reads givens *"at `hashCurrent`"*. one word for
  "the one that counts now" would be simpler than two.
- counter = they are **two concepts**, and to merge them is the defect itself. `current` qualifies a
  **hash** — which artifact content is under review right now. `latest` qualifies a **review** —
  which word of a reviewer's is live. the artifact hash moves when the driver edits; a reviewer's
  latest word moves only when that reviewer speaks. **a single word would force one key onto both,
  and the hash is the wrong key**, because the driver controls it (`rule.forbid.domain-term-ambiguity`:
  *the overload hides an ABSENT DISTINCTION*).
- resolution = keep both words, each bound to its own noun. `hashCurrent` stays. `current` is
  recorded as a **forbidden qualifier on a review**, never as a forbidden word.

## .evidence

### the measured harm of the conflation — 2026-09-06

the `reviewed?` judge read reviews at the current hash; the meter read each reviewer's latest across
hashes. **two readers of the same corpus, keyed differently.** the reproduction
(`src/contract/cli/routeStoneJudgeTally.acceptance.test.ts`) measured both failure directions from
one hash-scoped read:

| the fixture | the judge said | the truth |
|---|---|---|
| every reviewer exhausted, artifact edited | `passed: false — no review files found for hash 6c8552b1` | a clean verdict sat at the prior hash — a **false BLOCK** |
| one reviewer exhausted, artifact edited | `passed: true — nitpicks: 0/3` | a 5-nitpick verdict sat at the prior hash — a **false PASS** |

⇒ 🔴 **that one wrong key produced two OPPOSITE symptoms is the strongest evidence for the
distinction.** a `latest` keyed to the reviewer yields one answer; a `latest` keyed to the hash
yields an answer that is empty or partial according to who happens to still hold budget. the second
is not a degraded version of the first — it is a different quantity.

### why the index key also fails, though it looks right

`getLatestReviewFilesPerIndex` keys by the `rN` segment and reads almost identically to a
slug-keyed pick. it is correct **only** within one hash, because an index is a position in the
guard's `reviews.peer` declaration order — reorder the guard and `r2` names a different reviewer.
`RouteStoneGuardReviewPeerArtifact.unique = ['stone', 'hash', 'index']` makes that positional key
part of the artifact's identity *by contract*, which is exactly why it cannot carry a verdict across
a hash move.

⇒ the operation is left in place, scoped to its one honest use (a within-hash dedupe), rather than
renamed or deleted — **an index-keyed pick is not wrong, it is narrower**, and the boundary is now
stated in its own docblock and in the `latest` say-file.

### the order guarantee is part of the term, not an implementation detail

a pick over `latest` that is not a max over a **total** order is filesystem-dependent. measured
ground: `enumFilesFromGlob` returns raw `globby` output and no caller sorts it. so iteration alone
leaves ties to arrival order, and arrival order is the filesystem's. **the path is the tie-break
that makes the order total**, since two files cannot share one.

⇒ this is recorded in the term rather than only in code because it is a property of what *"latest"*
must MEAN here — a word that picks differently per machine is not a canonical term.
