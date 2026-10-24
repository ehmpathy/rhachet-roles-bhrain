# F6 — the renderer seat is the lazy module boundary, injected

- **the fork:** `stepRouteStatusLineCached` must reach the render ops (`getRouteBind`,
  `stepRouteStatusLine`, `asStatusLineBlank`) only on a miss, since they pull ~90 modules.
  (a) a `context.getRenderer` seat whose default does the lazy `import()`s · (b) the lazy
  `import()`s inline in the operation, no seat; tests spy on the real modules
- **taken:** (a). the seat IS the lazy boundary: the one place the expensive graph enters. the
  integration suite counts renders and lookups across 40+ cases at that seat (`jest.fn` spies
  over the real ops — no fake render). under (b) the test spies would have to hook a dynamic
  `import()` of a module jest has already loaded, which needs `jest.mock` of the real module,
  and the cases that drive the real bind ops would then `chdir` into every temp repo
- **against:** `rule.forbid.inject-same-repo-domain-ops` — the tell fires literally. the rule
  aims at DI that stands in for direct composition; here the default composes the real ops
  directly, and the seat exists to keep a module boundary lazy and observable
- **rework:** clean — the seat is one optional context field; (b) is a local edit of one op
  and its test helper
- **confidence: 75%** — the tell fires on the shape, and a reader may hold the rule literal
- **where:** `src/domain.operations/route/statusLine/stepRouteStatusLineCached.ts`, its
  integration test
- **verdict:** reversed to (b) at 5.1 i002. the repo-rules lane held the rule literal, and it
  was right on a fact: the old test stubbed `getRouteBind`, a fake of a same-repo op. now the
  op does its lazy `import()`s inline with no context; the test counts calls through
  `jest.mock` factories whose fns call `jest.requireActual` (swc exports are non-configurable,
  so `jest.spyOn` cannot wrap them), and each repaint runs in a chdir to its temp repo. the
  clamp still bites: with hits disabled, 7 cases go red
