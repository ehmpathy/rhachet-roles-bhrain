# fulcrum F1: node16 module resolution, or a repo override

## .the fork
- **adopt node16**: declapract-typescript-ehmpathy 0.50.0 sets `module`/`moduleResolution` to `node16` in tsconfig.json, and re-applies it on every upgrade run. under node16, a dynamic `import()` in a cjs file resolves in esm mode and needs an explicit extension
- **override**: keep `commonjs`/`node`; declare the override so the practice stops a rewrite

## .what adoption costs
- 13 build errors in 5 files: the lazy `import()` loads in `src/contract/cli/{index,route,route.status.line}.ts` and `src/domain.operations/route/statusLine/stepRouteStatusLineCached.ts`. these loads are deliberate: they keep each cli subpath from a load of every module (`rule.require.isolated-cli-subpath-exports`)
- each load needs a `.js` suffix; the jest `moduleNameMapper` (`^@src/(.*)$` → `src/$1`) then points at `src/x.js`, absent. the jest configs need a `.js` → `.ts` mapper, and the practice owns those configs too
- `getAllTokenRatesByModel.ts` deep-imports `rhachet-brains-anthropic/dist/.../BrainAtom.config`; node16 honors that package's `exports`, which do not expose it. needs an upstream export or another source for the rates

## .what the override costs
- the new `jest.{integration,acceptance}.prepare.ts` files import `test-fns/autoprune.setup.jest`, a subpath export only node16 resolves. a `paths` entry closes it for types (runtime node honors `exports` either way). verified: types pass with commonjs/node + that entry
- the repo drifts from the org practice; each upgrade re-applies node16 unless the override is declared

## .verdict
ruled by the director: conform. migrate to node16 as the practice applies. bridge the anthropic deep import here, and dispatch the export upstream.

## .taken
- every lazy `import()` in prod code became a typed `require` (`const mod: typeof import('x') = require('x')`). under node16 a commonjs file looks up `require` and `typeof import()` in commonjs mode, so no extension is owed, the jest `@src` mappers (owned by the practice) still work, and each load stays lazy
- the two test files' dynamic imports became static imports; laziness bought them naught
- the anthropic "deep import" proved no `exports` fence: `rhachet-brains-anthropic@0.4.3` declares no `exports` field, so node16 permits the path. its error was the same extension rule. the typed `require` bridges it; no pnpm patch or local rate copy is owed
- dispatched upstream: a public subpath export for the atom config (held for the radio until `rhx radio.uses allow`)
- `test:types` passes under node16

## .where
tsconfig.json · src/contract/cli/*.ts · src/domain.operations/route/statusLine/stepRouteStatusLineCached.ts · src/domain.operations/reflect/tokens/getAllTokenRatesByModel.ts · jest.*.config.ts
