# F029 · the urgent auto-grant is deferred to a dream, this PR ships the WARN

- **rework** = clean · **confidence** = settled · **status** = wisher-ruled (S14)

## .the fork

the wisher named both the dream and its dispatch in one breath (S14): *"catch a dream and dispatch a
task back into this repo to automatically add budget on --concede urgent. i.e., if the last round had
an urgent one, automatically allow one more."*

so the work splits along a line the wisher drew:

| option | shape |
|---|---|
| **A** | ship the WARN now, defer the auto-grant to a dream — the split the wisher named |
| **B** | ship the auto-grant now, in this PR |
| **C** | ship neither; keep the extant human-summons on every exhaustion |

## .taken, and why

**option A** — and the wisher ruled it, so this is a record over a call.

- **the WARN is the honest floor.** a budget hit with ≥1 live urgent concession halts and tells the
  human to grant more (`define.invariant.review.peer.budget.urgent-earns-budget`). the human still
  runs `route.guard.budget --add N` by hand. that is a complete, shippable behavior.
- **the auto-grant crosses a new authority line, so it is not clean.** the engine would spend budget
  on its own initiative — today every budget add is an explicit human or driver command. an engine
  that tops up autonomously must be bounded and recorded before it ships, and it needs a
  per-generation counter the ledger does not carry.
- **it interacts with the dispute skip and the per-severity exhaustion split this PR just landed.**
  the auto-grant must fire only for an urgent CONCEDE, never a dispute, and only at the exhaustion
  boundary — a mis-scope re-runs a lane the driver disputed.

⇒ B would ship an unbounded authority beside a feature not yet at rest. C ignores the wisher's
directive outright.

## .rework, and why

**clean.** the WARN and the auto-grant are additive: the auto-grant reads the same concession
severities the WARN already reads (`isRouteGuardConcessionExhaustion`, refined by severity), and adds
a bounded round + a passage record. no caller hardens against the absence of the auto-grant — the
human hand-step is a serviceable default. to fold the auto-grant in later is a pure addition.

## .confidence, and why it is settled

the wisher named the dream, its trigger, and its dispatch, and named the this-PR half as the WARN.
no open call remains — only the record that the split was the wisher's, and the dream + issue that
carry the deferred half.

## .where

`.dream/v2026_09_14.feat.auto-grant-a-round-after-an-urgent-concession.md` (the deferred work) ·
symlinked at `dreams/v2026_09_14.feat.auto-grant-a-round-after-an-urgent-concession.md` ·
gh issue #499 (the dispatch) · `define.invariant.review.peer.budget.urgent-earns-budget` (the WARN
this PR ships) · S14 (the wisher's words).

## .the verdict

_wisher-ruled (S14). the split is the wisher's; this row records it._
