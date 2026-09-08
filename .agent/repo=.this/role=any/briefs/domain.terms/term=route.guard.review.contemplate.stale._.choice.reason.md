# domain.term.choice.reason: stale

## .etymology

`stale` is the plain-domain word for *"still here, no longer current"* — bread, a lead, a cache.
it is the word a driver already reaches for when told their answer no longer applies, so it
needed no coinage.

chosen over:

| rejected | why |
|---|---|
| `outdated` | implies a **date** decided it. what decided it is a **new given**, never the clock |
| `superseded` | correct in sense, but it names what happened to the **given**; the tag describes the **taken** |
| `expired` | implies a timer the engine does not have. a `.taken` never expires on its own |
| `old` | carries no fact a reader can act on |

## 🔴 .the trigger CHANGED in this behavior, and the copy changed with it

before `v2026_09_03.fix-contemplation-gate-on-entrance`, contemplation debt was keyed
`(slug, hash)`. so `stale` fired when **the artifact hash moved** — the driver's own edit made
their answer stale, and the copy said so.

under P2 the debt is keyed to the **path the given derives**. so `stale` now fires when **the
reviewer has spoken again**.

⇒ **the word survived; its meaning was replaced.** that reversal is itemized as fulcrum **F7**,
and it is the reason this cluster exists: a value whose trigger silently inverts is exactly the
kind a later reader will misread from the name alone.

⚠️ **F7's stated reason for confidence was that the copy needed no edit. that was falsified** —
three lines changed (`formatRouteGuardReviewPeerContemplatePrompt.ts:239`, `:243-245`, `:247`),
and F7 was re-scored 88% → 70% on that catch.

## 🔴 .the OVERLOAD — this word is used in a second sense in this repo's own prose

**measured 2026-09-06**, across `.reviews/peer/`, `.fulcrums/`, and `.dream/` on this branch:

| sense | where | what it means |
|---|---|---|
| **1 — the contract value** | `tag: 'absent' \| 'stale'` | a `.taken` exists and answers a superseded given |
| **2 — the evidence rung** | ~15 takens, F12, two dreams | a snapshot's **bytes exist**, so the delta is determined and a hand repair is checkable |

both senses pair with **`absent`**, which makes the collision worse rather than incidental —
a reader who learns one *"stale vs absent"* axis will read the other one wrong.

### why it was not resolved by a rename this round

`rule.forbid.domain-term-ambiguity` says the repair for an overload is a **second word**, and
`rule.forbid.domain-term-synonyms` scopes the forbid to **contracts** — a dobj/dop name, an
internal shape, a published interface. sense 2 appears in **prose only**: takens, fulcrum
entries, dream bodies. it sits in no signature and no type.

⇒ so it is **not a violation today**, and it is **one contract away from being one**. the moment
anyone names an operation `isSnapshotStale` or a field `staleness`, the two senses collide in
code and the repair gets expensive.

⚠️ **recorded here rather than deferred silently**, per this glossary's own `.readme.md` gap
convention: *"the overload hides an ABSENT DISTINCTION."* the absent distinction is the evidence
ladder, and it has no word of its own.

### what the second sense actually needs

a word for *"the artifact's bytes exist, so the delta is determinable and a by-hand repair is
checkable"* — as against *"no bytes, so any authored value asserts output never observed."*

the rule it serves is already stated and is the durable half:

> **never assert output you have not observed.**

⇒ the naming is left open on purpose. `rule.require.enumerate-before-you-name` asks for the full
instance list before the word, and the list here is three (a moved snapshot key, `[case4]`'s four
absent baselines, the discard-loop nitpicks' new baselines) — thin enough that a word chosen now
would be tested once.

## .evidence

- the contract value, read from source: `getRouteGuardReviewPeerContemplationStatus.ts:32`
- the trigger swap: `1.vision.yield.md`, § *"F7 comes with the swap"*
- the re-score: `.fulcrums/inventory.of=fulcrums.case=F7-the-stale-tag-keeps-its-copy-changes-its-trigger.md`
- the overload's second sense, worked at length:
  `.behavior/v2026_09_03.fix-contemplation-gate-on-entrance/.reviews/peer/5.3.verification._.review.i022.adf368b5c05f11c221.r002._.taken.by_self.ergo-contract-snapshots.md`

## .see also

- `term=route.guard.review.contemplate.absent._.choice._.md` — the peer value on the same axis
- `term=route.guard.review.contemplate._.choice._.md` — the act these tags qualify
- `rule.forbid.domain-term-ambiguity` (bhrain/learner) — the rule the overload sits one contract short of
