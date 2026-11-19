# domain.term: pointer

term.chosen   = pointer
term.kind     = noun
term.boundary = route.status.line
term.synonyms.forbidden:
- index
- bookmark
- link
- ref

## .what

**a one-line file, per branch, that names the route the status line reads for that branch — or the
multi-bind mark.**

it lives at `.agent/.cache/repo=bhrain/role=driver/skill=route.status.line/branch=$branchFlat.route`
and holds exactly one of two values:

| value | sense |
|---|---|
| a route path, relative to the repo root | the route bound to this branch; the reader opens its `.route/.status.line.json` |
| `@multi-bind` | two routes hold this branch's bind flag; the reader prints the fault line |

it is **derived state, never a source of truth.** the bind flag (`term=route.bind`) is the truth.
the pointer only spares the bash reader a repo-wide walk for that flag, so the reader still checks
the flag it leads to, and a pointer whose flag is gone reads blank.

## .refs

- `src/domain.operations/route/statusLine/file/asRouteStatusLinePointerPath.ts` — the path, and `MARK_OF_MULTI_BIND`
- `src/domain.operations/route/statusLine/file/asRouteStatusLinePointerNext.ts` — the next value a writer leaves
- `src/domain.operations/route/statusLine/file/{set,getOne,del}RouteStatusLinePointer.ts`
- `src/domain.roles/driver/skills/route.status.line.sh` — the one reader

## .reason

- `term=route.status.line.pointer._.choice.reason.md`
