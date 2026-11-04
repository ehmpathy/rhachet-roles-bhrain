# F2 — extend the extant store, do not port goal.tree

- fork: (a) add a cure and a runnable done check to `.goals/` and `goal.memory.set`; (b) port goal.tree (one json per goal under the route) and retire the extant skills
- taken: (a)
- why: the wish asks for one achiever, folded. the dispatched wish in nheuron (`src/stream/2026.Q4/2026-10-18.dispatch.repo=rhachet-roles-bhrain.behavior=achiever-no-excuses.wish.md`) says the `.goals/` layout and the extant skills must not change. the extant store already holds asks, coverage, and a `blocked` status to tighten
- rework: dirty — callers and tests harden on the store shape once built
- risk: none — the store is plain files in the repo or route; it touches no credential and writes no prod
- confidence: 100% — ruled by the commander
- verdict: ruled 2026-11-03 by the commander — extend the extant `.goals/` store, so extant goals carry over unchanged. goal.tree's features promote into this role on top of that store (seed S2)
