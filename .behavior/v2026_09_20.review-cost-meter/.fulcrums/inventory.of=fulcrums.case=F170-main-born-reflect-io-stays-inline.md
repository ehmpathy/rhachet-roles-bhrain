# fulcrum F170 — main-born reflect i/o stays inline

- rework = 🟢 **clean** — each extraction is a named communicator that lands alone
- status = 🟡 **BEST-GUESSED 2026-10-07 — dispute it**
- confidence = 🟡 **75%**
- raised.by = peer lane `arch-opport-decomposition` (r007), nitpick.2, round i016 hash `31f2ba409ea651c2e8`

## .the fork

the lane names five orchestrators that fuse a raw i/o call into their body
(`rule.prefer.decomposable-architecture`), and itself states the calls predate this change.

| site | taken |
|---|---|
| `route/stones/delStoneGuardArtifacts.ts` — `fs.rm` loop | ✅ **repaired** — routed through `route/guard/artifact/delAllRouteFiles` |
| `reflect/step2/executeManifestOperations.ts` — `fs.copyFile` / `readFile` / `writeFile` | 🟡 held |
| `reflect/step2/compileReflectStep2Prompt.ts` — rule file `fs.readFile` | 🟡 held |
| `reflect/stepReflect.ts` — `citations.md` / rule / manifest `fs.writeFile` | 🟡 held |
| `reflect/snapshot/backupSnapshots.ts` — `execSync('aws s3 sync …')` | 🟡 held |

## .why hold the four reflect sites, at the time

- every held call stands on `origin/main` unchanged (`git show origin/main:…/stepReflect.ts`
  carries the `citations.md` write; `…/backupSnapshots.ts` carries the `aws s3 sync`). this branch's
  delta to each file lies elsewhere — the lane says so itself
- the reflect domain is not this wish's subject (the review cost meter). five communicators across
  it, each owed an integration test by `rule.require.test-coverage-by-grain`, is a sweep, and
  `rule.prefer.scouts-honor` bounds a fix-forward to the cheap in-scope one
- the s3 sync extraction would sit on a success path no test can reach without the bucket grant
  `F116` already reserves for a human
- the same call `F69` made for a main-born `fs.readFile` in `route/guard/review/`

## 🟡 .why 75%, not higher

- each extraction is clean; a council may judge the four cheap enough to land in this PR
- the severity is `better` on the harm test: no shipped harm has a name — the calls behave
  identically whether named or inline

## .where

- `src/domain.operations/reflect/step2/executeManifestOperations.ts`
- `src/domain.operations/reflect/step2/compileReflectStep2Prompt.ts`
- `src/domain.operations/reflect/stepReflect.ts`
- `src/domain.operations/reflect/snapshot/backupSnapshots.ts`

## .the verdict

open — for the council.
