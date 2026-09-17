# F33 · a stance-only flag on a non-stance `--as` is a deliberate, bounded no-op

- **rework** = clean · **status** = 🔴 **disputed** (ergo-friction-hazards nitpick.1, r009 i005) — the council rules
- **confidence** = 70%
- **where** = `stepRouteStoneSet.ts` — the cli dispatch on `--as` · where `--severity` / `--why` reach a verb

## .the concern, verbatim

> nitpick.1 — the silent-ignore of `--severity`/`--why` on a non-stance `--as` is real: the flags
> are stance-only by contract, and for a non-stance `--as` value the flag is a no-op that the happy
> path never emits. graded low impact, so nitpick.

⇒ e.g. `--as passed --severity urgent` accepts `--severity` and ignores it; `--as blocked --why <path>`
accepts `--why` and ignores it. neither reaches `setStoneAsStanced`, so neither is refused.

## .the fork, stated fairly

| fork | the cli would… |
|---|---|
| **A — bounded no-op** *(taken)* | leave the non-stance case silent. the INCOMPATIBLE-stance case (`--severity` on a dispute, `--why` on a concede) is already refused and tested; a stance-only flag on a non-stance verb is a no-op the pit-of-success path never produces |
| **B — fail loud everywhere** | reject `--severity` on any `--as` but `conceded`, and `--why` on any `--as` but `disputed` — a blanket guard at the top of the dispatch |

## .taken, and why at the time

**A.** the harmful case already fails loud, and the residual case is one the happy path cannot reach:

1. **the WRONG-stance case is refused and tested.** `setStoneAsStanced` throws for `--severity` on a
   dispute and `--why` on a concede (`setStoneAsStanced.ts:78-99`), and `blackbox` case4/case5 pin
   both. that is where the harm lives — a flag on the stance it contradicts
2. **the non-stance case ships no harm.** `--as passed --severity urgent` names a harm grade for a
   verb that carries none; the flag is dropped and the pass proceeds exactly as a bare `--as passed`
   would. no state is mis-set, no verdict mis-graded — the input is meaningless and the outcome is
   the correct one
3. **B adds a failure surface for input the pit-of-success never emits.** the happy path never pairs a
   stance-only flag with a non-stance verb, so B's new throws guard a combination a driver reaches
   only by a hand-typed contradiction — and each new throw is a new blackbox snapshot to author and
   hold

## 🟡 .the honest case FOR B, which A does not fully answer

- `rule.prefer.prevent-over-correct` rung 3 and `rule.require.safe-by-default` both favour a loud
  refusal of a meaningless flag over a silent swallow. a silently-ignored flag IS a swallowed slip
- so B is not a stretch — it is the ergonomist default read one notch stricter, and reasonable
  engineers land there

⇒ this is why the call sits at 70%, not higher: A is defensible and B is defensible, and the concern
is a genuine ergonomics fork rather than a defect.

## .what would settle it

| evidence | it would move the call toward |
|---|---|
| a wisher/council read that a meaningless flag MUST fail loud | **B** |
| a peer read that the non-stance no-op is bounded and harmless enough to leave | **A** |
| a measured driver who mistyped a stance-only flag on a non-stance verb and was harmed by the silence | **B** |

## .the verdict

*(unruled — the council rules at the close)*
