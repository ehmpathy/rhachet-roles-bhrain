# domain.term.choice.reason: taken

## .etymology

a nominalized past participle, exactly as its pair: **what was taken**. the driver *takes* the
critique — receives it, and answers it. the artifact that carries the answer is *the taken*.

⇒ the full argument for the word lives in `term=route.guard.review.given._.choice.reason.md`,
because **the two were one decision**. read that file for the give/take symmetry and the rejected
alternatives; this one records what is true of the taken alone.

## 🔴 .what parts a taken from a given: the driver does not choose its path

`getRouteGuardReviewPeerPathTaken.ts:33-34` derives the taken's path from the **given's**, with one
infix swapped and *"every other segment verbatim"*. so the taken inherits the given's iteration,
hash, and round.

⇒ **a taken for a critique raised three hash-moves ago still lands at that old hash**, and no prompt
in the engine ever names a current-hash path for it. that is not incidental — it is what anchors an
answer to the critique it answers rather than to the moment it was written.

🔴 **so the pair is matched on the DERIVED PATH — never on a hash, current or otherwise.**

two wrong keys were tried before that one, and each is worth a line, because one error produced both:

| the key | what it got wrong |
|---|---|
| `taken.hash === hashCurrent` | demands a path the driver has no way to produce — no prompt in the engine names a current-hash path for a carried given, so the gate refuses forever |
| `taken.hash === given.hash` | 🔴 **`(slug, hash)` is not a given's identity.** a `.taken` write does not move the artifact hash, so a reviewer that re-runs after it was answered writes its fresh critique at the **same hash**, one iteration later — and this key hands that fresh critique the prior answer |

⇒ the second is the sharper lesson, because it *looks* right and fails only on the honest
convergence loop: the driver answers, the reviewer re-runs unconvinced, and the gate opens on an
unanswered blocker. **the wish's own defect, reached with no attempt to escape.**

**the general form:** *a given's identity is its path, and every attempt to re-derive that identity
from a subset of its coordinates has so far picked a subset that is not unique.* the path is not
merely a wider key — `getRouteGuardReviewPeerPathTaken` is the **one grammar source** for the pair,
so to ask it makes a desync impossible by construction, which is what its own docblock says it exists
for.

⇒ history: `fix-contemplation-gate-on-entrance` P2 removed the first key at i001 and the second at
i002, the latter caught by a peer reviewer rather than by any self-review.

## .why not `response`, `reply`, or `answer`

each is a fine english word and each breaks the pair. `given`/`response` has no shared root; a
reader must learn two unrelated words rather than one relation. **the whole value of the pair is
that give ⇄ take is already known** — see `rule.prefer.symmetric-term-pairs` (ergonomist).

⚠️ **`contemplation` is forbidden for a sharper reason.** `contemplate` is the **verb** — the act
that records a taken (`--as contemplated`). to also call the artifact a *contemplation* would put one
word across a verb and its own object, which `rule.forbid.domain-term-ambiguity` names outright:
*the overload hides an ABSENT DISTINCTION*. the distinction here is real and worth a word each — you
**write** a taken, then you **contemplate** to record it, and the engine treats those as two steps
(`setStoneAsContemplated` refuses when the file is absent).

## .evidence — measured 2026-09-04

on `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance`, stone `1.vision`:

| iter | takens written | nitpicks |
|---|---|---|
| i004 | 0 | 3 + 4 |
| i005 | 0 | 5 + 6 — 🔴 every one *"re-raised, no `[REPAIR]` in this submission"* |
| i006 | 2 | 1 + 0 |
| i011 | 2/round since | **0 + 0** |

⇒ **repairs made in the artifacts with no taken beside them were invisible to the reviewers**, which
re-raised all of them. the count fell 11 → 0 across six rounds once takens began to land.

that is `rule.always.converge-with-reviewers.via-a-taken-per-point` measured rather than cited: *"a
blocker that returns after you fixed it is a driver error, never a reviewer defect."* **the taken is
not paperwork about the fix — to the reviewer, it IS the fix.**

## .disputes

none raised on the word. one adjacent dispute is settled in
`term=route.guard.review.contemplate._.choice.reason.md`: **`debt`** was proposed for the state a
taken discharges, and rejected — right about persistence, wrong about discharge, since a debt settles
by payment while this settles three ways (an answer, an overrule, or a reviewer that drops its own
blocker). `debt` stays prose-only.

## .see also

- `term=route.guard.review.given._.choice._.md` — the other half; the pair's full argument
- `term=route.guard.review.contemplate._.choice._.md` — the verb that records a taken
- `rule.always.converge-with-reviewers.via-a-taken-per-point` (bhrain/driver) — the `[REPAIR]` / `[REFUTE]` shapes
