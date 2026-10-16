# F203 — a split lane trusts its peer half for a cross-file claim

- raised 2026-10-10, from i035 r017 blocker.1 `[blocker][better]`: `repo-rules-briefs` re-raised the
  itemization of `eviction` and `probe` because the `term=` cluster and the gap row sit outside its
  scope — the guard routes `domain.terms/**` to its split peer `repo-rules-briefs-terms`, by design
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed; overrule it to widen the lane's refs**
- confidence: **75%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — hand the lane the terms as `--refs`** | the lane can then confirm any itemization it asks for; it costs the 52.9k tokens the split was made to shed, and the lane timed out at that size |
| **B — the peer half grades it** | `repo-rules-briefs-terms` reads every changed `domain.terms/**` file under the same rubric and approved; the claim is graded once, where its evidence lives |

## .taken, and why

**B.** the split exists because the whole lane timed out (the `.SPLIT` note in the guard). to feed
the terms back as refs re-creates the overflow. the artifacts the blocker asks for are on disk and
graded: `term=prompt.cache.eviction._.choice._.md` (`term.chosen = eviction`, boundary
`prompt.cache`) and the `probe` row in `inventory.of=gaps._.md` (`watched`, one instance).

## .rework, and why

**clean.** one `--refs` glob on one guard lane.

## .confidence, and why it is not higher

a cross-file rule a split lane cannot see is a general gap; a second such re-raise would argue for
a narrow `--refs` of the cited clusters only, built by the guard per round.

## .where

`.behavior/v2026_09_20.review-cost-meter/5.1.execution.from_vision.guard` (`repo-rules-briefs`,
`repo-rules-briefs-terms`)

## .verdict

(open)
