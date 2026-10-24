# F11 — the route dir join stays a named transformer at one call site

- **the fork:** `asRouteStatusLineRouteDir` (`path.isAbsolute(route) ? route : join(cwd, route)`)
  now has one production caller, the fingerprint. (a) keep it as a named, unit-tested leaf ·
  (b) inline the ternary into the fingerprint
- **taken:** (a). the ternary is decode-friction in an orchestrator, which
  `rule.require.named-transformers` asks to name; `rule.prefer.wet-over-dry` governs when to
  generalize two similar blocks, not whether to name one. its unit test pins both branches
  (relative and absolute route), which the fingerprint tests do not each re-derive
- **rework:** clean — one import
- **confidence: 85%**
- **where:** `src/domain.operations/route/statusLine/cache/asRouteStatusLineRouteDir.ts`
