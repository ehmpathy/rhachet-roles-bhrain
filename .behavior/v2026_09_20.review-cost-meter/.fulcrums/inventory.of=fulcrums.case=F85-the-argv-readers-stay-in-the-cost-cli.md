# F85 — the argv readers stay in the cost cli this round

- rework = 🟠 **dirty** — six readers move to `src/contract/cli/argv/`, one file each with its own test, and `review._.warmer` swaps its own flag policy for theirs
- confidence = 🟡 **75%**
- raised.by = `enroll-impl-arch-defects` at i056, nitpick.5

## .the fork

`review._.cost.ts` holds the generic flag readers (`FlagRead`, `getOneFlagRead`, `isArgValueOfFlag`,
`getAllArgsStray`, `getAllFlagsRepeated`, `getAllFlagsUnknown`) beside its help text, refusals, and
three emit paths. the warmer's `asWarmerArgsFromArgv` (`warmer/asWarmerArgv.ts`, lifted out of
`review._.warmer` at i057) reads flags under another policy: the last value
of a repeated flag wins, and a stray token is dropped.

| option | what it costs |
|---|---|
| A — lift the six readers into `contract/cli/argv/` now, and move the warmer onto them | six new operations and their tests, the cost cli re-wired, and the warmer's spawn contract tightened — a malformed spawn becomes a refusal where it was a half-read |
| B — defer with a dream, keep this stone on its subject | the two policies stay apart until the dream lands |

## .taken — B

- the readers are correct where they stand; no concern names a wrong read today, only two policies
- the warmer is spawned by `review.ts` alone, with argv it builds itself, so a stray or repeated
  flag is not reachable from a human today
- the lift ripples into the warmer's spawn contract and every cli test that drives it, files this
  stone did not set out to open (`rule.always.fix-forward-under-scouts-honor` — safe, not clean)
- the work is caught: `dreams/v2026_10_03.refactor.argv-readers-lift-to-contract-cli-argv.md`

## .why confidence is not higher

the second policy is exactly the drift the reviewer names, and a third cli would copy whichever
policy it found first. a reader may hold that two copies are already the moment to lift
(`rule.prefer.wet-over-dry` says three). the deferral rests on scope alone.

## .verdict

🟡 BEST-GUESSED 2026-10-03 — defer to the dream.
