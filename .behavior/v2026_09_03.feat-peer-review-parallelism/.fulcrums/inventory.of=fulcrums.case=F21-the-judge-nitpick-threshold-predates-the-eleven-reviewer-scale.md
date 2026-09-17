# F21 — the judge nitpick threshold predates the eleven-reviewer scale

- **rework**: clean
- **status**: RESOLVED 2026-09-14 — option A, `--allow-nitpicks 7 → 33`. the human ruled "approved"
  on the recommendation once the settled count landed (22 across 11 all-approved lanes)
- **confidence**: 100% (ratified)

## .the fork

the judge halts the stone on `nitpicks exceed threshold (30 > 7)`. every one of those nitpicks is
advisory and dream-tracked; none names a harm that ships. the gate is
`--allow-nitpicks 7` on the judge line (`5.1.execution.from_vision.guard:247`).

that `7` was calibrated for a stone with a handful of reviewers. this stone now carries **eleven**
(9 l1 + 2 l3), so `7` is ~0.6 nitpicks per reviewer — a bar the roster crosses on its first honest
pass. `rule.forbid.overzealous-blockers`: a swarm of advisory points is not a ship-blocker, and to
hold passage on it holds the release on cosmetics.

three ways out:

| option | why |
|---|---|
| **A — raise `--allow-nitpicks` to scale with the roster** ✅ | ~33–35 (≈3/reviewer) restores the same per-reviewer tolerance the `7` encoded for a smaller stone |
| **B — drop the nitpick gate for an advisory-only stone** | over-broad; a real nitpick swarm can still signal drift, and the gate is a cheap tripwire for it |
| **C — fix every nitpick to land under 7** | inappropriate; the nitpicks are `src/` edits that churn the l1 cache, and most are deferred by design |

## .the pick, and why

**option A**, and the value is deferred by one round. the count of `30` is not final: two l1 lanes
(r2, r8) had not re-run when the judge last tallied, and the two l3 lanes re-run each arrive. the
honest threshold is `~3 × 11`, set once r2/r8/r10/r11 give the settled total, so the bar is derived
from the roster rather than guessed.

## .why it is clean

the threshold is one integer on the judge line of the `.guard`, which is not in the hashed artifact
set (`getCacheSafePeerReviewArtifact.ts:19-22`). so the edit moves no artifact hash: every cached l1
lane stays live, and the change alters **how the verdict is tallied**, never **what any reviewer
found**. it is reversible without a teardown.

## .the verdict, once ruled

**ruled 2026-09-14 — option A at N=33.** the i026 arrive settled the count: all 11 lanes approved
with 0 blockers (incl. both l3), and the tally read **22 nitpicks** — every one advisory, none a
ship-harm. the human ruled "approved" on the recommendation. the judge line moved
`--allow-blockers 0 --allow-nitpicks 7` → `--allow-nitpicks 33` (≈3/reviewer), the judge re-tallied
`22 ≤ 33 ✓`, and the stone `5.1.execution.from_vision` passed. `--allow-blockers 0` is unchanged —
the real gate (zero blockers) still bites; only the miscalibrated cosmetic bar was rescaled.
