# F3 — one cache file per branch under `.agent/.cache/`

- **the fork:** (a) `.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=<flat>.json`
  · (b) inside the route, `$route/.route/.status-line.cache.json` (beside the bouncer cache)
- **taken:** (a). the cache must be found before the route is known — that lookup is the costly
  glob — so it cannot live inside the route. per-branch keys make a branch switch a different file
- **the ignore:** `.agent/.cache/` is ignored by rhachet's link step (`findsertAgentEphemeralGitignore`),
  and this repo's `.gitignore` names it too. the ignore is rhachet's to own; a temp repo the tests
  build is not linked, so a `git status` assert there would test rhachet's absence, not this cache
- **the anchor:** the harness runs a seat's command at the project root (the help's `note:`), so the
  cache lands at `<root>/.agent/.cache/`. a seat whose cwd is a subdir is outside what the harness
  does; its file would sit under `<subdir>/.agent/.cache/`, which the root ignore does not cover
- **the read:** a HEAD file read keys the cache; a detached or unknown HEAD falls back to `git`. a
  reftable repo is the one shape the two could part, and there a bind drop misses and the line heals
  within the 30s max age
- **the prune:** none. each record is one small json file per branch under an ignored dir; a prune
  would add a dir walk to some repaint
- **rework:** clean — one path constant
- **confidence: 90%**
- **where:** the new status-line cache read/write
