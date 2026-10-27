# F24 — the status line's branch read stays at its leaf until a second consumer

- **the fork:** `getOneRouteStatusLineBranch` reads the branch from the git dir's HEAD file, and
  holds no status-line logic. (a) leave it under `statusLine/cache/`, and leave the bind ops' git
  spawn as is · (b) lift it to `src/utils/git/` and route `getAllBindFlagsByBranch` through it
- **taken:** (a). it has one consumer; a lift with no second reuse is speculative
  (`rule.prefer.most-common-denominator`). the bind ops run on a miss alone, so their git spawn costs
  no hit, and to swap it would move every bind op's branch read in a change scoped to the status line
- **against:** two branch reads in one repo can disagree on an odd HEAD (a detached head, a worktree
  `gitdir:`); the cache key and the bind flag name then name two branches
- **rework:** clean — move the file, rename it, point `getAllBindFlagsByBranch` at it
- **confidence: 85%**
- **where:** `statusLine/cache/getOneRouteStatusLineBranch.ts`, `bind/getAllBindFlagsByBranch.ts`
