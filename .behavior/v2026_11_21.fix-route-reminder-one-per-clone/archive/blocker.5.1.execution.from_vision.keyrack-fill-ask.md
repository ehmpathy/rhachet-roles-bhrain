# blocker: 5.1.execution.from_vision — the integration and acceptance proof needs test keys this host lacks

## what blocks you

three peer concerns from round i001 can close only by a run of the integration and acceptance suites, and that run needs api keys this host does not hold:

- repo-rules blocker.2 — the committed snapshots are stale; they owe a resnap
- behavior-intent-coverage blocker.1 — the integration + acceptance suites and the clamp's red-by-revert are unrun
- ergo-friction-hazards blocker.3 — the same: stale snapshots, unrun proof

`jest.integration.env.ts` calls `keyrack.source({ env: 'test', owner: 'ehmpath', mode: 'strict' })`. on this host `rhx keyrack unlock --owner ehmpath --env test` reports every `ehmpathy.test.*` key absent (OPENROUTER, OPENAI, ANTHROPIC, TAVILY, XAI), so every integration and acceptance suite fails at setup before one assertion. a keyrack fill is a human act; I hold no lever for it. a mock is no substitute: these suites ARE the proof the wish asks for.

## what you tried

- answered all 32 concerns of round i001, one stance per concern: 30 conceded (`better`) and repaired in code, 2 disputed with fulcrums (F6 pid handle, F7 vision stamp)
- the repairs: the legacy sweep allowlists expected faults and rethrows the rest; one shared `isToleratedIoWriteError`; `withToleratedIoFaultAsValue` in the sync; an absent focus never counts as a crash (sync case13); the spawn absolutizes `repoRoot` (spawn case3); `--repo-root` in `--help`; the daemon spawns through `routeReminderCli`; `isPathWithinRoot` takes `..foo`; snapshot calls on every refusal and daemon edge (acceptance case14, cli case15/17/19)
- local proof that can run here: types, lint, format pass; unit `src/domain.operations/route` 282 suites / 2600 tests pass; unit `src/contract/cli` 22 suites / 154 tests pass
- `rhx keyrack unlock --owner ehmpath --env test` — every test key absent
- no second opinion sought: a credential is the foreman-only carve-out of `rule.always.get-a-second-opinion-before-foreman`

## what you need

a human fills the test keyrack once:

```sh
rhx keyrack fill --owner ehmpath --env test
```

then the driver runs, and records the output in the yield:

```sh
rhx git.repo.test --what integration --mode apply --resnap
rhx git.repo.test --what acceptance --against local --env test --mode apply --resnap
```

plus the clamp red-by-revert (revert the clone-keyed handle path → `syncRouteReminderForDrive.integration` case9 red; restore → green), then re-arrives for round i002.

or, if the human prefers: say so, and the driver pushes the branch so CI (which holds the keys) runs the suites; the resnap is then the one CI-reported diff to apply.
