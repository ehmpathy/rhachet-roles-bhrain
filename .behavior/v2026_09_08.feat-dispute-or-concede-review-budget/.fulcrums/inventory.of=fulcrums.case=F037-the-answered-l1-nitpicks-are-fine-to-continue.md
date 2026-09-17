# F37 · the answered l1 `better` nitpicks are fine to continue — a cached given over-counts them

- **rework** = clean · **status** = 🔴 **best-guessed** (5.1 execution) — the council rules
- **confidence** = 72%
- **where** = the l1 peer lanes (repo-rules, mech-*, arch-*, ergo-friction-hazards,
  behavior-intent-coverage) and r11. backs the disputes needed to reduce the stone-wide tally under
  the `--allow-nitpicks 7` floor (S07 — one fulcrum, N disputes, one concern each).

## .the concern set, in one line

each l1 lane raised a handful of `better` nitpicks in an early round and each was ANSWERED in its
`.taken.by_self` (a repair or a refutation). the lanes then went `approved`/`exhausted` with 0
blockers, so the engine CACHES them (`runStoneGuardReviews.ts:444` — a 0-blocker review is reused by
position, regardless of hash) and never re-reviews the current tree.

## 🔴 .why a dispute is the only lever, and an honest one

- the `reviewed?` judge tallies nitpicks STONE-WIDE, so these answered nitpicks still count — 13
  across the l1 lanes + r11, over the floor of 7.
- **concede-and-fix cannot reduce them**: the fix would land in `src/`, but a 0-blocker lane is
  cached and never re-reviews, so the tally would still report the old count. only a dispute (a
  tally exclusion) or a rewind (a re-run of every lane) can shed a cached concern.
- **a dispute here is honest**: each concern is `better` (0 blockers, no nameable shipped harm) and
  already addressed in its `.taken` — a repair whose fix sits in the current tree, or a refutation
  with cited evidence. so *"this concern is fine to continue"* is true, and the cached given
  over-counts a concern that is resolved or refuted.

## .the fork, stated fairly

| fork | this round would… |
|---|---|
| **A — dispute the answered `better` nitpicks down to the floor** *(taken)* | shed the resolved/refuted concerns a cached given over-counts, so the tally reads the true residual; the council reads each `.taken` + this fulcrum |
| **B — rewind and re-run** | void all verdicts and re-run the whole ladder (incl. the ~11-min l3 clones), non-deterministic, to get fresh counts — a heavy, uncertain re-litigation for `better` maintenance on a faithful, green tree |
| **C — a human overrule / raise the floor** | a human lifts the level or widens `--allow-nitpicks`. legitimate, but spends the scarcest resource for all-`better` maintenance the wisher's own invariant (S15) says the driver may address by dispute |

## .taken, and why

fork A. the wisher settled it directly (S15): *"all concerns must be thoroughly disputable regardless
of reviewer status"* — the dispute is the driver's lever to shed a concern that counts, and these
count. each is `better` and answered, so *"fine to continue"* is honest, and the council backstops
the call against every `.taken` on record.

## 🟡 .the honest case FOR B/C, which A does not fully answer

a dispute across nearly every lane is the max-dispute shape the vision flags. the answer A rests on:
these are not fresh defects the driver evades — they are already-answered `better` nitpicks a cached
given re-counts, and the wisher's invariant (S15) names the dispute as the sanctioned lever for
exactly a stone whose tally the driver cannot otherwise reduce. the 72% reflects that the council may
prefer a severity-aware tally (the deferred `#31`/`#499`) or a floor change over a wide dispute.

## .what would settle it

| evidence | it would move the call toward |
|---|---|
| a council read that holds an answered `better` nitpick may be disputed off a cached tally | **A** |
| a shipped severity-aware tally that passes an all-`better` residual with no dispute | **C** — the dispute becomes unneeded |

## .the verdict

*(unruled — the council rules at the close)*
