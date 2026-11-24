# F1 — the clone handle lives in `.agent/.cache/route.reminder/`

- **fork**: (a) `<gitroot>/.agent/.cache/repo=bhrain/role=driver/skill=route.reminder/` · (b) `~/.rhachet/storage/repo=bhrain/role=driver/.reminder/` (machine scope) · (c) `<gitroot>/.log/bhrain/route.reminder/`
- **taken**: (a). `.agent/.cache/` is the paved, gitignored, gitroot-scoped home for clone-local state (`asRouteStatusLineCachePath`, with a `*` `.gitignore` findsert). tests stay hermetic in a temp repo. (b) matches a pid's machine scope but writes outside the repo in every test. (c) is not gitignored for non-`.log` files (`.gitignore` ignores `*.log` only), so a `.pid` there would be tracked
- **rework**: clean — one path builder (`getRouteReminderHandlePath`) decides it
- **confidence**: 85% — below 93% because a clone viewed from two worktrees would split; no such case is known today
- **where**: `1.vision.yield.md` · the solution, move 1
