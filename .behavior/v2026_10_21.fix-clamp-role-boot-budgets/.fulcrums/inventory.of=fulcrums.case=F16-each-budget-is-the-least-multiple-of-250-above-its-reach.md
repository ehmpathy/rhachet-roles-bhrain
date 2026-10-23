# F16 — each budget is the least multiple of 250 above what its role costs as a seat boots it

## the fork

after the i003 move-out, each role fell. a seat boots each role from `.agent/repo=bhrain/role=<slug>/`,
and every booted path rides in the payload, so the seat form costs more than the `src/` form:

| role | `src/` form | seat form |
|---|---|---|
| learner | 20,536 | 20,691 |
| driver | 19,847 | 20,002 |
| librarian | 11,912 | 12,017 |

| option | budgets | headroom over the seat form |
|---|---|---|
| keep the 500 rule | 21,000 · 20,500 · 12,500 | up to ~500; loose enough to admit a small bloat unseen |
| least multiple of 250, seat form | 20,750 · 20,250 · 12,250 | 59 · 248 · 233 |
| a fixed margin, e.g. +250 | uneven numbers | no rule a reader can recompute |

## taken, and why at the time

the 250 rule over the seat form: one rule a reader recomputes from the pinned seat payload, and
tight enough that the next bloat halts here. the first cut measured the `src/` form and set the
driver at 20,000, which the seat form exceeds by 3 (r011 i006); the clamp now boots the seat form.

## rework: clean

three numbers in three `boot.yml` files, the snapshot, the yield, and the pr body.

## confidence: 70%, and why it is not higher

- the learner's 59 tokens of headroom means an edit of a few lines to any learner min halts the
  boot. that is the budget's job, but it may read as friction to the next author
- the director proposed 12k · 12k · 5k; the step size between reach and cap was never stated

## where

`src/domain.roles/{learner,driver,librarian}/boot.yml` · `pr.body.md` · `5.1.execution.from_vision.yield.md`
