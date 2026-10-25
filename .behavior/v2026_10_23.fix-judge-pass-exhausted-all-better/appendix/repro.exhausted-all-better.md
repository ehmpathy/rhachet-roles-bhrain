# appendix: repro of the measured halt

date 2026-10-23 · repo `rhachet-roles-bhrain` @ `beav/fix-judge-pass-exhausted-all-better` (0.42.1)

fixture: `blackbox/.test/assets/route-exhausted-all-better/` — lanes `calm` (l1, 0/1), `intent`
(l2, budget 3, 1 blocker per run), `friction` (l2, budget 3, 2 blockers per run); judge
`reviewed? --allow-blockers 0 --allow-nitpicks 7`. driver loop per round: `--as passed`, write every
`.taken`, concede each blocker `--severity better`, `--as absorbed` per lane, edit `src/feature.ts`.

## result

| step | verdict |
|---|---|
| rounds 1–3 `--as passed` | `blocked · blockers exceed threshold (3 > 0)` — each round's fresh givens, before that round's stances |
| round 4 `--as passed` (both lanes exhausted 🌙) | `passage = allowed` |
| `route.stone.judge --route .` | `passed: true · reviews pass (blockers: 0/0, nitpicks: 1/7)` |
| `route.stone.judge --route <symlink alias of the same dir>` | `passed: false · blockers exceed threshold (3 > 0)` |

## the ledger row that explains it

```
{"stone":"1.vision","status":"conceded","reviewer":"friction","about":"blocker.2",
 "given":"/tmp/test-fns/…/2026-10-23T04-06-26.754Z.exhausted-all-better.cd0082dc/.reviews/peer/1.vision._.review.i003.aae49dff22797063a1.r003._.given.by_peer.friction.md",
 "severity":"better", …}
```

the `given` is absolute. through the alias, the latest given's path begins with the alias, the
strings differ, and `getLiveReviewAbsorptions` drops the stance.
