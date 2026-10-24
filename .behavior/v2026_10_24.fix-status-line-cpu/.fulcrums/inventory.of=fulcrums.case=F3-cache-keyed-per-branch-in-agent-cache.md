# F3 — one cache file per branch under `.agent/.cache/`

- **the fork:** (a) `.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=<flat>.json`
  · (b) inside the route, `$route/.route/.status-line.cache.json` (beside the bouncer cache)
- **taken:** (a). the cache must be found before the route is known — that lookup is the costly
  glob — so it cannot live inside the route. per-branch keys make a branch switch a different file
- **rework:** clean — one path constant
- **confidence: 90%**
- **where:** the new status-line cache read/write
