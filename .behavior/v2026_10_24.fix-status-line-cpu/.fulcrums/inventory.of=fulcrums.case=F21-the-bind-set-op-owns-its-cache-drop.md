# F21 — `setRouteBind` owns its status line cache drop

- **the fork:** a bind must drop the status line cache, or an unbound seat shows a blank line for up
  to 30s. (a) the domain op `setRouteBind` drops it · (b) the cli entry composes the drop after the op
- **taken:** (a). the drop is part of what a bind does: every caller of the op, the cli and the
  integration cases alike, gets a line that names the new route at once. under (b) a second caller
  of `setRouteBind` would bind silently stale, and the integration clamp (`[case9]`, `[case9b]`)
  would test the op without the effect the wish needs. the dependency runs one way: `bind/` reads
  the cache op, and the cache reads only the pure `asRouteBindFlagName`
- **against:** the op reads `process.cwd()` and spawns `git rev-parse --show-toplevel`, an effect
  its name does not say
- **rework:** clean — move the one call into `contract/cli/route.ts` beside `setRouteBind`, and have
  the integration cases call both
- **confidence: 80%**
- **where:** `route/bind/setRouteBind.ts`, `statusLine/cache/delRouteStatusLineCache.ts`
